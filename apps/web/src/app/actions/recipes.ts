"use server";

import { prisma } from "@kjg/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface IngredientInput {
  name: string;
  unit: string;
  amountPerPerson: number;
  category: string;
}

async function findOrCreateIngredient(
  name: string,
  unit: string,
  category: string,
) {
  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: name } },
  });
  if (existing) return existing;
  return prisma.ingredient.create({
    data: { name, unit, category, allergens: "" },
  });
}

export async function createRecipe(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const allergens = formData.get("allergens") as string;
  const tags = formData.get("tags") as string;
  const notes = formData.get("notes") as string;
  const hasVeggie = formData.get("hasVeggie") === "on";
  const isStandard = formData.get("isStandard") === "on";
  const ingredientsJson = formData.get("ingredients") as string | null;

  const recipe = await prisma.recipe.create({
    data: {
      name,
      category,
      allergens: allergens || "",
      tags: tags || "",
      notes,
      isStandard,
      versions: {
        create: [
          { type: "MIT_FLEISCH" },
          ...(hasVeggie ? [{ type: "VEGETARISCH" }] : []),
        ],
      },
    },
    include: { versions: true },
  });

  if (ingredientsJson) {
    try {
      const ingredients: {
        meat: IngredientInput[];
        veggie: IngredientInput[];
      } = JSON.parse(ingredientsJson);
      const meatVersion = recipe.versions.find((v) => v.type === "MIT_FLEISCH");
      const veggieVersion = recipe.versions.find(
        (v) => v.type === "VEGETARISCH",
      );

      if (meatVersion && ingredients.meat?.length) {
        for (const ing of ingredients.meat) {
          const ingredient = await findOrCreateIngredient(
            ing.name,
            ing.unit,
            ing.category || "Sonstiges",
          );
          await prisma.recipeIngredient.create({
            data: {
              recipeVersionId: meatVersion.id,
              ingredientId: ingredient.id,
              amountPerPerson: ing.amountPerPerson,
              unit: ing.unit,
            },
          });
        }
      }

      if (veggieVersion && ingredients.veggie?.length) {
        for (const ing of ingredients.veggie) {
          const ingredient = await findOrCreateIngredient(
            ing.name,
            ing.unit,
            ing.category || "Sonstiges",
          );
          await prisma.recipeIngredient.create({
            data: {
              recipeVersionId: veggieVersion.id,
              ingredientId: ingredient.id,
              amountPerPerson: ing.amountPerPerson,
              unit: ing.unit,
            },
          });
        }
      }
    } catch {
      // Ingredient creation errors don't block recipe creation
    }
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({
    where: { id },
  });
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(
  id: string,
  data: {
    name?: string;
    category?: string;
    tags?: string;
    allergens?: string;
    notes?: string;
    cookingTime?: number | null;
    isStandard?: boolean;
  },
) {
  await prisma.recipe.update({
    where: { id },
    data,
  });
  revalidatePath(`/recipes/${id}`);
  revalidatePath(`/recipes`);
  revalidatePath(`/mealplan`);
}

export async function addIngredientToVersion(
  versionId: string,
  recipeId: string,
  ing: {
    name: string;
    unit: string;
    amountPerPerson: number;
    category: string;
  },
) {
  const ingredient = await findOrCreateIngredient(
    ing.name,
    ing.unit,
    ing.category || "Sonstiges",
  );
  await prisma.recipeIngredient.create({
    data: {
      recipeVersionId: versionId,
      ingredientId: ingredient.id,
      amountPerPerson: ing.amountPerPerson,
      unit: ing.unit,
    },
  });
  revalidatePath(`/recipes/${recipeId}`);
}

export async function updateRecipeIngredient(
  recipeIngredientId: string,
  recipeId: string,
  data: { amountPerPerson?: number; unit?: string },
) {
  await prisma.recipeIngredient.update({
    where: { id: recipeIngredientId },
    data,
  });
  revalidatePath(`/recipes/${recipeId}`);
}

export async function removeRecipeIngredient(
  recipeIngredientId: string,
  recipeId: string,
) {
  await prisma.recipeIngredient.delete({
    where: { id: recipeIngredientId },
  });
  revalidatePath(`/recipes/${recipeId}`);
}
