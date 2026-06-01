import { prisma as db } from "@kjg/database";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateShoppingList } from "./actions";

export default async function NewShoppingListPage() {
  const mealPlans = await db.mealPlanEntry.findMany({
    where: { status: "geplant" },
    orderBy: { date: "asc" },
    include: { recipe: true },
  });

  // Group by date to show a nice summary
  const groupedByDate = mealPlans.reduce((acc, plan) => {
    const dateStr = format(plan.date, "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(plan);
    return acc;
  }, {} as Record<string, typeof mealPlans>);

  const hasPlans = mealPlans.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Neue Einkaufsliste generieren</h1>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        {!hasPlans ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Es gibt aktuell keine geplanten Gerichte im Speiseplan, für die eine Liste generiert werden könnte.</p>
            <Link href="/mealplan" className={buttonVariants({ variant: "outline" })}>
              Zum Speiseplan
            </Link>
          </div>
        ) : (
          <form action={generateShoppingList} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Einkaufs-Typ</Label>
              <Select name="type" defaultValue="metro">
                <SelectTrigger>
                  <SelectValue placeholder="Typ wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metro">Metro Lieferung</SelectItem>
                  <SelectItem value="vor_ort">Vor-Ort Einkauf (Aldi, Rewe...)</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges / Spenden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Einbezogene Tage (Automatisch aus Speiseplan "geplant")</Label>
              <div className="bg-muted/50 rounded-md p-4 max-h-60 overflow-y-auto space-y-4">
                {Object.entries(groupedByDate).map(([dateStr, plans]) => (
                  <div key={dateStr}>
                    <h4 className="font-semibold text-sm mb-1">{format(new Date(dateStr), "EEEE, dd.MM.", { locale: de })}</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {plans.map(p => (
                        <li key={p.id}>
                          • {p.mealTime}: {p.recipe ? p.recipe.name : p.specialName || "Ohne Rezept"}
                          <input type="hidden" name="mealPlanIds" value={p.id} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer">Puffer (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  name="buffer"
                  id="buffer"
                  defaultValue={0}
                  min={0}
                  max={100}
                  className="w-28"
                />
                <p className="text-sm text-muted-foreground">
                  Prozentuale Zugabe auf alle berechneten Mengen (z.B. 10 = +10%).
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Liste generieren & Netto-Bedarf berechnen
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
