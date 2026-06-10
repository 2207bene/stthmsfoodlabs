import { prisma } from "@kjg/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  addIngredient,
  bookStock,
  bookKuchenspende,
} from "@/app/actions/inventory";
import { RefreshBedarfButton } from "./RefreshBedarfButton";

export default async function InventoryPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  const categories = Array.from(new Set(ingredients.map((i) => i.category)));

  // Calculate projected usage – only future meals
  const futureMeals = await prisma.mealPlanEntry.findMany({
    where: {
      status: { in: ["geplant", "vorbereitet"] },
      date: { gte: new Date() },
    },
    include: {
      recipe: {
        include: {
          versions: {
            include: { ingredients: true },
          },
        },
      },
    },
  });

  const projectedUsage = new Map<string, number>();

  for (const plan of futureMeals) {
    if (!plan.recipe) continue;

    const countMeat = plan.personCountMeat || 0;
    const countVeggie = plan.personCountVeggie || 0;

    for (const version of plan.recipe.versions) {
      const isMeat = version.type === "MIT_FLEISCH";
      const persons = isMeat ? countMeat : countVeggie;

      if (persons <= 0) continue;

      for (const recipeIng of version.ingredients) {
        const total = recipeIng.amountPerPerson * persons;
        const current = projectedUsage.get(recipeIng.ingredientId) || 0;
        projectedUsage.set(recipeIng.ingredientId, current + total);
      }
    }
  }

  // Calculate total units
  const unitTotals = new Map<string, number>();
  for (const item of ingredients) {
    const current = unitTotals.get(item.unit) || 0;
    unitTotals.set(item.unit, current + item.currentStock);
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lagerverwaltung</h1>
          <p className="text-gray-500">Aktuelle Bestände und Zu-/Abgänge</p>
        </div>
        <RefreshBedarfButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-indigo-50/50 border-indigo-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                Lagerbestand nach Einheiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Array.from(unitTotals.entries()).map(([unit, total]) => (
                  <div
                    key={unit}
                    className="bg-white px-4 py-2 rounded-md border shadow-sm"
                  >
                    <span className="text-2xl font-bold text-indigo-600">
                      {total.toLocaleString("de-DE")}
                    </span>
                    <span className="text-gray-500 ml-1">{unit}</span>
                  </div>
                ))}
                {unitTotals.size === 0 && (
                  <p className="text-gray-500 text-sm">
                    Noch keine Bestände vorhanden.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          {categories.length === 0 && (
            <div className="py-12 text-center bg-muted rounded-xl border border-border border-dashed">
              <p className="text-gray-500">Das Lager ist noch leer.</p>
            </div>
          )}

          {categories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  {category || "Unkategorisiert"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ingredients
                    .filter((i) => i.category === category)
                    .map((item) => {
                      const usage = projectedUsage.get(item.id) || 0;
                      const remaining = item.currentStock - usage;

                      let statusColor = "text-green-500";
                      let statusBg = "bg-green-500/10";
                      let statusIcon = <CheckCircle2 className="w-4 h-4" />;
                      let statusText = "OK";

                      if (remaining < 0) {
                        statusColor = "text-red-500";
                        statusBg = "bg-red-500/10";
                        statusIcon = <AlertCircle className="w-4 h-4" />;
                        statusText = "Engpass";
                      } else if (remaining === 0 && usage > 0) {
                        statusColor = "text-yellow-500";
                        statusBg = "bg-yellow-500/10";
                        statusText = "Exakt";
                      } else if (remaining > 0 && remaining <= usage * 0.1) {
                        statusColor = "text-orange-500";
                        statusBg = "bg-orange-500/10";
                        statusText = "Knapp";
                      }

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-4"
                        >
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {item.name}
                              {usage > 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusBg} ${statusColor}`}
                                  title={`Noch benötigt: ${usage.toLocaleString("de-DE")} ${item.unit}`}
                                >
                                  {statusIcon} {statusText}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4">
                              <span>
                                Bestand:{" "}
                                <span className="font-bold text-black">
                                  {item.currentStock.toLocaleString("de-DE")}{" "}
                                  {item.unit}
                                </span>
                              </span>
                              {usage > 0 && (
                                <>
                                  <span>
                                    Benötigt: {usage.toLocaleString("de-DE")}{" "}
                                    {item.unit}
                                  </span>
                                  <span
                                    className={
                                      remaining < 0
                                        ? "text-red-500 font-medium"
                                        : ""
                                    }
                                  >
                                    Differenz: {remaining > 0 ? "+" : ""}
                                    {remaining.toLocaleString("de-DE")}{" "}
                                    {item.unit}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <form
                              action={async () => {
                                "use server";
                                await bookStock(item.id, 1, false);
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="1 Einheit verbrauchen"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </form>

                            <form
                              action={async () => {
                                "use server";
                                await bookStock(item.id, 1, true);
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="1 Einheit einkaufen"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Neuer Artikel</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addIngredient} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Artikelname
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="z.B. Tomatenpassata"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="initialStock"
                      className="text-sm font-medium"
                    >
                      Anzahl / Menge
                    </label>
                    <Input
                      id="initialStock"
                      name="initialStock"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue="0"
                      placeholder="z.B. 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="unit" className="text-sm font-medium">
                      Einheit
                    </label>
                    <select
                      name="unit"
                      id="unit"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    >
                      <option value="kg">Kilogramm (kg)</option>
                      <option value="l">Liter (l)</option>
                      <option value="pkg">Packungen (pkg)</option>
                      <option value="pcs">Stück (pcs)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Kategorie
                  </label>
                  <select
                    name="category"
                    id="category"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="Öle & Essige">Öle & Essige</option>
                    <option value="Gewürze & Würzmittel">
                      Gewürze & Würzmittel
                    </option>
                    <option value="Back- & Trockenwaren">
                      Back- & Trockenwaren
                    </option>
                    <option value="Fleisch & Fisch">Fleisch & Fisch</option>
                    <option value="Milchprodukte">Milchprodukte</option>
                    <option value="Obst & Gemüse">Obst & Gemüse</option>
                    <option value="Konserven">Konserven</option>
                    <option value="Reinigung & Sonstiges">
                      Reinigung & Sonstiges
                    </option>
                    <option value="Kuchenspenden">Kuchenspenden</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">
                  Zum Lager hinzufügen
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2">
                🎂 Kuchenspende einbuchen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={bookKuchenspende} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="kuchen-name" className="text-sm font-medium">
                    Bezeichnung
                  </label>
                  <Input
                    id="kuchen-name"
                    name="name"
                    required
                    placeholder="z.B. Bienenstich, Obstkuchen…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="kuchen-amount"
                      className="text-sm font-medium"
                    >
                      Menge
                    </label>
                    <Input
                      id="kuchen-amount"
                      name="amount"
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="z.B. 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="kuchen-unit"
                      className="text-sm font-medium"
                    >
                      Einheit
                    </label>
                    <select
                      name="unit"
                      id="kuchen-unit"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    >
                      <option value="pcs">Stück (pcs)</option>
                      <option value="kg">Kilogramm (kg)</option>
                      <option value="pkg">Packungen (pkg)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="kuchen-notes" className="text-sm font-medium">
                    Notiz (optional)
                  </label>
                  <Input
                    id="kuchen-notes"
                    name="notes"
                    placeholder="z.B. von Familie Müller"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Kuchenspende einbuchen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
