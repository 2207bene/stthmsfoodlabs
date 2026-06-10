"use server";

import { prisma } from "@kjg/database";
import { revalidatePath } from "next/cache";
import { getPersonGroupCounts } from "./groups";

export async function assignRecipeToMealTime(
  recipeId: string,
  dateStr: string,
  mealTime: string,
) {
  const date = new Date(dateStr);
  const counts = await getPersonGroupCounts();

  const entry = await prisma.mealPlanEntry.create({
    data: {
      date,
      mealTime,
      recipeId,
      status: "geplant",
      personCountMeat: counts.meat,
      personCountVeggie: counts.veggie,
    },
  });

  revalidatePath("/mealplan");
  return entry.id;
}

export async function moveMealPlanEntry(
  entryId: string,
  newDateStr: string,
  newMealTime: string,
) {
  const newDate = new Date(newDateStr);

  // If moving a regular meal to a slot that already has one, we might want to swap or override.
  // For simplicity, we just override/update the moved entry.
  await prisma.mealPlanEntry.update({
    where: { id: entryId },
    data: {
      date: newDate,
      mealTime: newMealTime,
    },
  });

  revalidatePath("/mealplan");
}

export async function removeMealPlanEntry(entryId: string) {
  await prisma.mealPlanEntry.deleteMany({
    where: { id: entryId },
  });
  revalidatePath("/mealplan");
}

export async function updateMealPlanStatus(entryId: string, status: string) {
  const entry = await prisma.mealPlanEntry.findUnique({
    where: { id: entryId },
    include: {
      recipe: {
        include: {
          versions: {
            include: {
              ingredients: true,
            },
          },
        },
      },
    },
  });

  if (!entry) throw new Error("Entry not found");

  // If changing to 'gekocht' and it wasn't already 'gekocht'
  if (status === "gekocht" && entry.status !== "gekocht" && entry.recipe) {
    const countMeat = entry.personCountMeat || 0;
    const countVeggie = entry.personCountVeggie || 0;

    const stockMovements: any[] = [];

    for (const version of entry.recipe.versions) {
      const isMeat = version.type === "MIT_FLEISCH";
      const persons = isMeat ? countMeat : countVeggie;

      if (persons <= 0) continue;

      for (const recipeIng of version.ingredients) {
        const totalForRecipe = recipeIng.amountPerPerson * persons;

        stockMovements.push({
          ingredientId: recipeIng.ingredientId,
          amount: totalForRecipe,
          direction: -1,
          type: "gericht_gebucht",
          referenceId: entryId,
        });
      }
    }

    // Process movements and deduct stock
    await prisma.$transaction(async (tx) => {
      for (const move of stockMovements) {
        await tx.stockMovement.create({
          data: move,
        });

        await tx.ingredient.update({
          where: { id: move.ingredientId },
          data: {
            currentStock: {
              decrement: move.amount,
            },
          },
        });
      }

      await tx.mealPlanEntry.update({
        where: { id: entryId },
        data: { status },
      });
    });
  } else {
    await prisma.mealPlanEntry.update({
      where: { id: entryId },
      data: { status },
    });
  }

  revalidatePath("/mealplan");
  revalidatePath("/inventory");
}
