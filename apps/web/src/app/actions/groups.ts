"use server"

import { prisma } from "@kjg/database"
import { revalidatePath } from "next/cache"

export async function createGroup(data: {
  name: string
  count: number
  ageRange: string
  gender: string
  isVegetarian: boolean
  intolerances: string
}) {
  await prisma.personGroup.create({
    data,
  })
  revalidatePath("/groups")
}

export async function deleteGroup(id: string) {
  await prisma.personGroup.delete({
    where: { id },
  })
  revalidatePath("/groups")
}

export async function updateGroup(id: string, data: {
  name: string
  count: number
  ageRange: string
  gender: string
  isVegetarian: boolean
  intolerances: string
}) {
  await prisma.personGroup.update({
    where: { id },
    data,
  })
  revalidatePath("/groups")
}

export async function getPersonGroupCounts(): Promise<{ meat: number; veggie: number }> {
  const [groups, campflowPersons] = await Promise.all([
    prisma.personGroup.findMany({ select: { count: true, isVegetarian: true } }),
    prisma.campflowPerson.findMany({ select: { diet: true } }),
  ])

  const isVeggie = (diet: string) => {
    const diets = diet.split(",").map(d => d.trim())
    return diets.includes("vegetarian") || diets.includes("vegan")
  }

  const meat =
    groups.filter(g => !g.isVegetarian).reduce((s, g) => s + g.count, 0) +
    campflowPersons.filter(p => !isVeggie(p.diet)).length

  const veggie =
    groups.filter(g => g.isVegetarian).reduce((s, g) => s + g.count, 0) +
    campflowPersons.filter(p => isVeggie(p.diet)).length

  return { meat, veggie }
}
