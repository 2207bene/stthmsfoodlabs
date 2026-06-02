import { prisma } from "@kjg/database";
import { NewRecipeForm } from "./NewRecipeForm";
import { getPersonGroupCounts } from "@/app/actions/groups";

export default async function NewRecipePage() {
  const [groups, counts] = await Promise.all([
    prisma.personGroup.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, count: true, isVegetarian: true },
    }),
    getPersonGroupCounts(),
  ]);

  return <NewRecipeForm groups={groups} defaultMeat={counts.meat} defaultVeggie={counts.veggie} />;
}
