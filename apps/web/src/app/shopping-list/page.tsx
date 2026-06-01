import { prisma as db } from "@kjg/database";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ShoppingListPage() {
  const lists = await db.shoppingList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einkaufslisten</h1>
          <p className="text-muted-foreground mt-1">
            Generierte Einkaufslisten für die Metro und Vor-Ort-Einkäufe.
          </p>
        </div>
        <Link href="/shopping-list/new">
          <Button>Neue Liste generieren</Button>
        </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center p-12 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium mb-2">Keine Einkaufslisten vorhanden</h3>
          <p className="text-muted-foreground mb-4">
            Generiere eine neue Einkaufsliste aus dem aktuellen Speiseplan.
          </p>
          <Link href="/shopping-list/new">
            <Button variant="outline">Jetzt generieren</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <Link key={list.id} href={`/shopping-list/${list.id}`}>
              <div className="border rounded-lg p-5 hover:border-primary transition-colors flex justify-between items-center bg-card">
                <div>
                  <h3 className="font-semibold text-lg">
                    {list.type === "metro" ? "Metro Lieferung" : list.type === "vor_ort" ? "Vor-Ort Einkauf" : "Sonstiger Einkauf"}
                  </h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>{format(list.createdAt, "dd. MMMM yyyy", { locale: de })}</span>
                    <span>•</span>
                    <span>{list._count.items} Positionen</span>
                    <span>•</span>
                    <span className={list.status === "offen" ? "text-amber-500" : list.status === "in_bearbeitung" ? "text-blue-500" : "text-green-500"}>
                      {list.status === "offen" ? "Offen" : list.status === "in_bearbeitung" ? "In Bearbeitung" : "Abgeschlossen"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Ansehen</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
