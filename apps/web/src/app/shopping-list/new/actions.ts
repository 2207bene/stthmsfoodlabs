"use server";

import { prisma as db } from "@kjg/database";
import { redirect } from "next/navigation";
import { generateMetroSearchUrl } from "@/lib/ai";

export async function generateShoppingList(formData: FormData) {
  const type = formData.get("type") as string;
  const mealPlanIds = formData.getAll("mealPlanIds") as string[];
  const buffer = Number(formData.get("buffer") || 0);

  if (!mealPlanIds || mealPlanIds.length === 0) {
    throw new Error("Keine Speiseplan-Einträge ausgewählt.");
  }

  // Fetch person groups dynamically
  const groups = await db.personGroup.findMany();
  let totalMeat = 0;
  let totalVeggie = 0;

  for (const group of groups) {
    if (group.isVegetarian) {
      totalVeggie += group.count;
    } else {
      totalMeat += group.count;
    }
  }

  // Apply buffer factor
  const bufferFactor = 1 + (buffer / 100);
  const personsMeat = Math.ceil(totalMeat * bufferFactor);
  const personsVeggie = Math.ceil(totalVeggie * bufferFactor);

  // 1. Fetch meal plans with full recipe tree
  const mealPlans = await db.mealPlanEntry.findMany({
    where: { id: { in: mealPlanIds } },
    include: {
      recipe: {
        include: {
          versions: {
            include: {
              ingredients: {
                include: { ingredient: true }
              }
            }
          }
        }
      }
    }
  });

  // 2. Calculate gross amounts per ingredient
  // ingredientId -> { ingredient, totalAmount }
  const ingredientTotals = new Map<string, { ingredientId: string; amount: number }>();

  for (const plan of mealPlans) {
    if (!plan.recipe) continue;

    for (const version of plan.recipe.versions) {
      const isMeat = version.type === "MIT_FLEISCH";
      // Use dynamic group counts; fall back to per-entry overrides if set
      const persons = isMeat
        ? (plan.personCountMeat ?? personsMeat)
        : (plan.personCountVeggie ?? personsVeggie);

      if (persons <= 0) continue;

      for (const recipeIng of version.ingredients) {
        const totalForRecipe = recipeIng.amountPerPerson * persons;

        const existing = ingredientTotals.get(recipeIng.ingredientId) || {
          ingredientId: recipeIng.ingredientId,
          amount: 0,
        };

        existing.amount += totalForRecipe;
        ingredientTotals.set(recipeIng.ingredientId, existing);
      }
    }
  }

  // 3. Fetch current stock for these ingredients
  const allIngredientIds = Array.from(ingredientTotals.keys());
  const dbIngredients = await db.ingredient.findMany({
    where: { id: { in: allIngredientIds } }
  });

  const stockMap = new Map<string, number>();
  for (const ing of dbIngredients) {
    stockMap.set(ing.id, ing.currentStock);
  }

  // 4. Calculate net amounts and create ShoppingList items
  const itemsToCreate = [];

  for (const [ingId, { amount }] of ingredientTotals.entries()) {
    const currentStock = stockMap.get(ingId) || 0;
    const netAmount = amount - currentStock;

    if (netAmount > 0) {
      itemsToCreate.push({
        ingredientId: ingId,
        amountTotal: netAmount,
        checked: false,
      });
    }
  }

  // If this is a Metro list, generate Metro URLs for ingredients that don't have them yet
  if (type === "metro") {
    const ingredientsMissingUrl = dbIngredients.filter(ing => !ing.metroUrl);
    if (ingredientsMissingUrl.length > 0) {
      const generatedUrls = await Promise.all(
        ingredientsMissingUrl.map(async (ing) => {
          try {
            const url = await generateMetroSearchUrl({
              name: ing.name,
              unit: ing.unit,
              category: ing.category,
            });
            return { id: ing.id, metroUrl: url };
          } catch (e) {
            console.error(`Fehler bei AI Link-Generierung für ${ing.name}:`, e);
            return { id: ing.id, metroUrl: null };
          }
        })
      );

      for (const item of generatedUrls) {
        if (item.metroUrl) {
          await db.ingredient.update({
            where: { id: item.id },
            data: { metroUrl: item.metroUrl }
          });
        }
      }
    }
  }

  // 5. Save to DB
  const newList = await db.shoppingList.create({
    data: {
      type: type,
      status: "offen",
      generatedFrom: mealPlanIds.join(","),
      items: {
        create: itemsToCreate
      }
    }
  });

  // 6. Redirect to list detail page
  redirect(`/shopping-list/${newList.id}`);
}
