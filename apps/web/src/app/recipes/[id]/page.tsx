import { prisma } from "@kjg/database";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteRecipe } from "@/app/actions/recipes";
import { AiCalculateButton } from "./AiCalculateButton";
import { EditRecipeDialog } from "./EditRecipeDialog";
import { IngredientsCard } from "./IngredientsCard";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [recipe, groups] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            ingredients: {
              include: { ingredient: true }
            }
          }
        }
      }
    }),
    prisma.personGroup.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, count: true, isVegetarian: true },
    }),
  ]);

  if (!recipe) return notFound();

  const meatVersion = recipe.versions.find(v => v.type === "MIT_FLEISCH");
  const veggieVersion = recipe.versions.find(v => v.type === "VEGETARISCH");

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/recipes" className="text-gray-500 hover:text-black flex items-center gap-2 mb-4 text-sm w-fit">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
          <p className="text-gray-500 mt-1">{recipe.category}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AiCalculateButton recipeId={recipe.id} />
          <EditRecipeDialog recipe={{
            id: recipe.id,
            name: recipe.name,
            category: recipe.category,
            tags: recipe.tags,
            allergens: recipe.allergens,
            notes: recipe.notes ?? null,
            cookingTime: recipe.cookingTime ?? null,
          }} />
          <form action={async () => {
            "use server"
            await deleteRecipe(recipe.id)
          }}>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Löschen
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="meat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meat" disabled={!meatVersion}>🥩 Mit Fleisch</TabsTrigger>
              <TabsTrigger value="veggie" disabled={!veggieVersion}>🥦 Vegetarisch</TabsTrigger>
            </TabsList>

            <TabsContent value="meat" className="mt-4">
              {meatVersion ? (
                <IngredientsCard
                  versionId={meatVersion.id}
                  versionType="MIT_FLEISCH"
                  initialIngredients={meatVersion.ingredients.map(ing => ({
                    id: ing.id,
                    amountPerPerson: ing.amountPerPerson,
                    unit: ing.unit,
                    ingredient: {
                      id: ing.ingredient.id,
                      name: ing.ingredient.name,
                      unit: ing.ingredient.unit,
                      category: ing.ingredient.category,
                    },
                  }))}
                  recipeId={recipe.id}
                  groups={groups}
                />
              ) : (
                <p className="text-sm text-gray-500 italic p-4">Keine Fleisch-Version vorhanden.</p>
              )}
            </TabsContent>

            <TabsContent value="veggie" className="mt-4">
              {veggieVersion ? (
                <IngredientsCard
                  versionId={veggieVersion.id}
                  versionType="VEGETARISCH"
                  initialIngredients={veggieVersion.ingredients.map(ing => ({
                    id: ing.id,
                    amountPerPerson: ing.amountPerPerson,
                    unit: ing.unit,
                    ingredient: {
                      id: ing.ingredient.id,
                      name: ing.ingredient.name,
                      unit: ing.ingredient.unit,
                      category: ing.ingredient.category,
                    },
                  }))}
                  recipeId={recipe.id}
                  groups={groups}
                />
              ) : (
                <p className="text-sm text-gray-500 italic p-4">Keine Vegetarisch-Version vorhanden.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <Card>
            <CardHeader>
              <CardTitle>Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipe.cookingTime && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Kochzeit</h3>
                  <p className="text-sm">⏱ {recipe.cookingTime} Min.</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags ? recipe.tags.split(",").map(tag => tag.trim() && (
                    <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">{tag}</span>
                  )) : <span className="text-sm text-gray-500">-</span>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Allergene</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens ? recipe.allergens.split(",").map(alg => alg.trim() && (
                    <span key={alg} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-100">{alg}</span>
                  )) : <span className="text-sm text-gray-500">-</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zubereitung</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.notes ? (
                <div className="whitespace-pre-wrap text-sm text-gray-700">{recipe.notes}</div>
              ) : (
                <p className="text-sm text-gray-500 italic">Keine Zubereitungshinweise vorhanden.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
