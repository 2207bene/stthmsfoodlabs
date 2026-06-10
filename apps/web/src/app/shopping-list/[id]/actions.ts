"use server";

import { prisma as db } from "@kjg/database";
import { revalidatePath } from "next/cache";
import { generateMetroSearchUrl } from "@/lib/ai";

export async function updateAmountObtained(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const amountObtained =
    parseFloat(formData.get("amountObtained") as string) || 0;

  if (!itemId) return;

  const updated = await db.shoppingListItem.update({
    where: { id: itemId },
    data: { amountObtained },
  });

  revalidatePath(`/shopping-list/${updated.shoppingListId}`);
}

export async function toggleItemChecked(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  const checked = formData.get("checked") === "true";

  if (!itemId) return;

  const updated = await db.shoppingListItem.update({
    where: { id: itemId },
    data: { checked },
  });

  // Check if all items are checked to update list status
  const allItems = await db.shoppingListItem.findMany({
    where: { shoppingListId: updated.shoppingListId },
  });

  const allChecked = allItems.every((i) => i.checked);
  const anyChecked = allItems.some((i) => i.checked);

  let newStatus = "offen";
  if (allChecked) newStatus = "abgeschlossen";
  else if (anyChecked) newStatus = "in_bearbeitung";

  await db.shoppingList.update({
    where: { id: updated.shoppingListId },
    data: { status: newStatus },
  });

  revalidatePath(`/shopping-list/${updated.shoppingListId}`);
  revalidatePath("/shopping-list");
}

export async function bookPartialAmount(formData: FormData) {
  const itemId = formData.get("itemId") as string;
  if (!itemId) return;

  const item = await db.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { ingredient: true },
  });
  if (!item || !item.amountObtained || item.amountObtained <= 0) return;

  const bookedAmount = item.amountObtained;
  const remaining = item.amountTotal - bookedAmount;

  await db.ingredient.update({
    where: { id: item.ingredientId },
    data: { currentStock: item.ingredient.currentStock + bookedAmount },
  });

  await db.stockMovement.create({
    data: {
      ingredientId: item.ingredientId,
      amount: bookedAmount,
      direction: 1,
      type: "einkauf",
      referenceId: item.shoppingListId,
    },
  });

  if (remaining <= 0) {
    await db.shoppingListItem.delete({ where: { id: itemId } });
  } else {
    await db.shoppingListItem.update({
      where: { id: itemId },
      data: { amountTotal: remaining, amountObtained: 0, checked: false },
    });
  }

  const remainingCount = await db.shoppingListItem.count({
    where: { shoppingListId: item.shoppingListId },
  });

  await db.shoppingList.update({
    where: { id: item.shoppingListId },
    data: { status: remainingCount === 0 ? "abgeschlossen" : "offen" },
  });

  revalidatePath(`/shopping-list/${item.shoppingListId}`);
  revalidatePath("/shopping-list");
  revalidatePath("/inventory");
}

export async function confirmPurchase(formData: FormData) {
  const listId = formData.get("listId") as string;
  if (!listId) return;

  const checkedItems = await db.shoppingListItem.findMany({
    where: { shoppingListId: listId, checked: true },
    include: { ingredient: true },
  });

  for (const item of checkedItems) {
    const bookedAmount =
      (item.amountObtained ?? 0) > 0
        ? (item.amountObtained ?? 0)
        : item.amountTotal;

    await db.ingredient.update({
      where: { id: item.ingredientId },
      data: { currentStock: item.ingredient.currentStock + bookedAmount },
    });

    await db.stockMovement.create({
      data: {
        ingredientId: item.ingredientId,
        amount: bookedAmount,
        direction: 1,
        type: "einkauf",
        referenceId: listId,
      },
    });
  }

  await db.shoppingListItem.deleteMany({
    where: { shoppingListId: listId, checked: true },
  });

  const remainingCount = await db.shoppingListItem.count({
    where: { shoppingListId: listId },
  });

  await db.shoppingList.update({
    where: { id: listId },
    data: { status: remainingCount === 0 ? "abgeschlossen" : "offen" },
  });

  revalidatePath(`/shopping-list/${listId}`);
  revalidatePath("/shopping-list");
  revalidatePath("/inventory");
}

export async function updateIngredientMetroUrl(formData: FormData) {
  const ingredientId = formData.get("ingredientId") as string;
  const shoppingListId = formData.get("shoppingListId") as string;
  let metroUrl = formData.get("metroUrl") as string;

  if (!ingredientId) return;

  metroUrl = metroUrl?.trim() || "";
  const finalUrl = metroUrl === "" ? null : metroUrl;

  await db.ingredient.update({
    where: { id: ingredientId },
    data: { metroUrl: finalUrl },
  });

  if (shoppingListId) {
    revalidatePath(`/shopping-list/${shoppingListId}`);
  }
}

export async function regenerateMetroUrlWithAI(formData: FormData) {
  const ingredientId = formData.get("ingredientId") as string;
  const shoppingListId = formData.get("shoppingListId") as string;

  if (!ingredientId) return;

  const ingredient = await db.ingredient.findUnique({
    where: { id: ingredientId },
  });

  if (!ingredient) return;

  try {
    const url = await generateMetroSearchUrl({
      name: ingredient.name,
      unit: ingredient.unit,
      category: ingredient.category,
    });

    await db.ingredient.update({
      where: { id: ingredientId },
      data: { metroUrl: url },
    });
  } catch (error) {
    console.error("Fehler bei AI Link-Regeneration:", error);
  }

  if (shoppingListId) {
    revalidatePath(`/shopping-list/${shoppingListId}`);
  }
}
