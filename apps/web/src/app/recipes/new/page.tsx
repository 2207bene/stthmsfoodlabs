import { prisma } from "@kjg/database";
import { NewRecipeForm } from "./NewRecipeForm";

export default async function NewRecipePage() {
  const groups = await prisma.personGroup.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, count: true, isVegetarian: true },
  });

  return <NewRecipeForm groups={groups} />;
}
