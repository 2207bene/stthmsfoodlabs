"use server"

import { prisma } from "@kjg/database"
import { revalidatePath } from "next/cache"

const ALLOWED_UNITS = ["kg", "l", "pkg", "pcs"];
const ALLOWED_KUCHEN_UNITS = ["pcs", "kg", "pkg"];

export async function addIngredient(formData: FormData) {
  const name = formData.get("name") as string
  const unit = formData.get("unit") as string
  const category = formData.get("category") as string

  if (!ALLOWED_UNITS.includes(unit)) {
    throw new Error(`Ungültige Einheit: ${unit}. Erlaubte Einheiten: ${ALLOWED_UNITS.join(", ")}`)
  }

  await prisma.ingredient.create({
    data: {
      name,
      unit,
      category,
      allergens: "",
      currentStock: 0
    }
  })

  revalidatePath("/inventory")
}

export async function bookStock(ingredientId: string, amount: number, isAdding: boolean) {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
  if (!ingredient) return

  const direction = isAdding ? 1 : -1
  const type = isAdding ? "einkauf" : "verbrauch"

  // Update stock
  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: {
      currentStock: ingredient.currentStock + (amount * direction)
    }
  })

  // Create movement record
  await prisma.stockMovement.create({
    data: {
      ingredientId,
      amount,
      direction,
      type
    }
  })

  revalidatePath("/inventory")
}

export async function bookKuchenspende(formData: FormData) {
  const name = (formData.get("name") as string).trim()
  const amount = parseFloat(formData.get("amount") as string)
  const unit = formData.get("unit") as string
  const notes = (formData.get("notes") as string | null)?.trim() || null

  if (!name || isNaN(amount) || amount <= 0) return
  if (!ALLOWED_KUCHEN_UNITS.includes(unit)) return

  // Find or create the ingredient
  let ingredient = await prisma.ingredient.findFirst({
    where: { name, category: "Kuchenspenden" },
  })
  if (!ingredient) {
    ingredient = await prisma.ingredient.create({
      data: { name, unit, category: "Kuchenspenden", allergens: "", currentStock: 0 },
    })
  }

  // Book stock movement
  await prisma.ingredient.update({
    where: { id: ingredient.id },
    data: { currentStock: ingredient.currentStock + amount },
  })
  await prisma.stockMovement.create({
    data: {
      ingredientId: ingredient.id,
      amount,
      direction: 1,
      type: "kuchenspende",
      notes,
    },
  })

  // Create a recipe so it shows up in Rezeptverwaltung and calendar sidebar
  const existingRecipe = await prisma.recipe.findFirst({
    where: { name, category: "Kuchenspenden" },
  })
  if (!existingRecipe) {
    await prisma.recipe.create({
      data: {
        name,
        category: "Kuchenspenden",
        tags: "Kuchenspende",
        allergens: "",
      },
    })
  }

  revalidatePath("/inventory")
  revalidatePath("/recipes")
  revalidatePath("/mealplan")
}
