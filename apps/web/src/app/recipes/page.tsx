import { prisma } from "@kjg/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen } from "lucide-react";

const CATEGORY_SECTIONS = [
  { label: "Frühstück", categories: ["Frühstück"] },
  { label: "Mittagessen", categories: ["Mittagessen", "Hauptgericht"] },
  { label: "Abendessen", categories: ["Abendessen"] },
  {
    label: "Nachmittag & Snacks",
    categories: ["Nachmittagssnack", "Beilage", "Dessert"],
  },
  { label: "Specials", categories: ["Special"] },
  { label: "Kuchenspenden", categories: ["Kuchenspenden"] },
];

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
    include: {
      versions: true,
    },
  });

  const assignedIds = new Set<string>();
  const sections = CATEGORY_SECTIONS.map((section) => ({
    ...section,
    recipes: recipes.filter((r) => {
      const match = section.categories.includes(r.category);
      if (match) assignedIds.add(r.id);
      return match;
    }),
  }));

  const uncategorized = recipes.filter((r) => !assignedIds.has(r.id));
  const allSections =
    uncategorized.length > 0
      ? [
          ...sections,
          { label: "Sonstiges", categories: [], recipes: uncategorized },
        ]
      : sections;

  const RecipeCard = ({ recipe }: { recipe: (typeof recipes)[0] }) => (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="hover:border-gray-400 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-start justify-between">
            <span className="line-clamp-1">{recipe.name}</span>
            <BookOpen className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-3">{recipe.category}</div>
          <div className="flex flex-wrap gap-2">
            {recipe.versions.some((v) => v.type === "MIT_FLEISCH") && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs border border-red-100">
                Fleisch
              </span>
            )}
            {recipe.versions.some((v) => v.type === "VEGETARISCH") && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-100">
                Veggie
              </span>
            )}
            {recipe.tags &&
              recipe.tags.split(",").map(
                (tag) =>
                  tag.trim() && (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                    >
                      {tag}
                    </span>
                  ),
              )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rezeptverwaltung
          </h1>
          <p className="text-gray-500">Alle Rezepte auf einen Blick</p>
        </div>
        <Link href="/recipes/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Rezept
          </Button>
        </Link>
      </div>

      {recipes.length === 0 && (
        <div className="py-12 text-center bg-muted rounded-xl border border-border border-dashed">
          <p className="text-gray-500 mb-4">Noch keine Rezepte angelegt.</p>
          <Link href="/recipes/new">
            <Button variant="outline">Erstes Rezept anlegen</Button>
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {allSections.map(
          (section) =>
            section.recipes.length > 0 && (
              <div key={section.label}>
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">
                  {section.label}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
