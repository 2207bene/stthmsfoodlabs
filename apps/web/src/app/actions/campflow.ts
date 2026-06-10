"use server";

import { prisma } from "@kjg/database";
import { revalidatePath } from "next/cache";
import { fetchAllPersons } from "@/lib/campflow";

export type PersonDetailed = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  birthdate: string | null;
  age: number | null;
  ageGroup: "klein" | "mittel" | "groß" | "unbekannt";
  gender: string | null;
  diet: string;
  intolerances: string;
};

export async function importFromCampflow(
  listId: string,
): Promise<{ count: number }> {
  const persons = await fetchAllPersons(listId);

  await Promise.all(
    persons.map((person) =>
      prisma.campflowPerson.upsert({
        where: { campflowId: person.id },
        update: {
          listId,
          firstName: person.name.first_name,
          lastName: person.name.last_name,
          birthdate: person.birthdate ?? null,
          gender: person.gender ?? null,
          diet: person.diet.join(","),
          intolerances: person.intolerances.join(","),
        },
        create: {
          campflowId: person.id,
          listId,
          firstName: person.name.first_name,
          lastName: person.name.last_name,
          birthdate: person.birthdate ?? null,
          gender: person.gender ?? null,
          diet: person.diet.join(","),
          intolerances: person.intolerances.join(","),
        },
      }),
    ),
  );

  revalidatePath("/groups");
  return { count: persons.length };
}

export async function deleteCampflowImport(listId: string): Promise<void> {
  await prisma.campflowPerson.deleteMany({ where: { listId } });
  revalidatePath("/groups");
}

export async function deleteCampflowPerson(id: string): Promise<void> {
  await prisma.campflowPerson.delete({ where: { id } });
  revalidatePath("/groups");
}

export async function updateCampflowPerson(
  id: string,
  data: { gender?: string; diet?: string; intolerances?: string },
): Promise<void> {
  await prisma.campflowPerson.update({ where: { id }, data });
  revalidatePath("/groups");
}

export async function getCampflowSummary(): Promise<{
  total: number;
  veggie: number;
  meat: number;
  lastImport: Date | null;
  intolerances: { label: string; count: number }[];
}> {
  const persons = await prisma.campflowPerson.findMany({
    select: { diet: true, intolerances: true, importedAt: true },
  });

  const total = persons.length;
  const veggie = persons.filter(
    (p: { diet: string; intolerances: string; importedAt: Date }) => {
      const diets = p.diet.split(",").map((d) => d.trim());
      return diets.includes("vegetarian") || diets.includes("vegan");
    },
  ).length;
  const meat = total - veggie;

  const lastImport =
    persons.length > 0
      ? persons.reduce(
          (
            max: Date,
            p: { diet: string; intolerances: string; importedAt: Date },
          ) => (p.importedAt > max ? p.importedAt : max),
          persons[0].importedAt,
        )
      : null;

  const intoleranceCounts = new Map<string, number>();
  for (const p of persons) {
    if (!p.intolerances) continue;
    for (const label of p.intolerances.split(",")) {
      const trimmed = label.trim();
      if (trimmed)
        intoleranceCounts.set(
          trimmed,
          (intoleranceCounts.get(trimmed) ?? 0) + 1,
        );
    }
  }

  const intolerances = Array.from(intoleranceCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return { total, veggie, meat, lastImport, intolerances };
}

function calcAge(birthdate: string | null, today: Date): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function classifyAgeGroup(age: number | null): PersonDetailed["ageGroup"] {
  if (age === null) return "unbekannt";
  if (age < 12) return "klein";
  if (age <= 15) return "mittel";
  return "groß";
}

export async function getCampflowPersonsDetailed(): Promise<{
  persons: PersonDetailed[];
  byGender: Record<string, number>;
  byDiet: { meat: number; veggie: number };
  byAgeGroup: {
    klein: number;
    mittel: number;
    groß: number;
    unbekannt: number;
  };
}> {
  const raw = await prisma.campflowPerson.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const today = new Date();
  const isVeggieDiet = (diet: string) => {
    const diets = diet.split(",").map((d) => d.trim());
    return diets.includes("vegetarian") || diets.includes("vegan");
  };

  const persons: PersonDetailed[] = raw.map((p) => {
    const age = calcAge(p.birthdate, today);
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      birthdate: p.birthdate,
      age,
      ageGroup: classifyAgeGroup(age),
      gender: p.gender,
      diet: p.diet,
      intolerances: p.intolerances,
    };
  });

  const byGender: Record<string, number> = {};
  for (const p of persons) {
    const g = p.gender || "unbekannt";
    byGender[g] = (byGender[g] ?? 0) + 1;
  }

  const byDiet = { meat: 0, veggie: 0 };
  for (const p of persons) {
    if (isVeggieDiet(p.diet)) byDiet.veggie++;
    else byDiet.meat++;
  }

  const byAgeGroup = { klein: 0, mittel: 0, groß: 0, unbekannt: 0 };
  for (const p of persons) {
    byAgeGroup[p.ageGroup]++;
  }

  return { persons, byGender, byDiet, byAgeGroup };
}
