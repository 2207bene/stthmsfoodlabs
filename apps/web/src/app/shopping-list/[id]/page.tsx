import { prisma as db } from "@kjg/database";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { notFound } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import {
  toggleItemChecked,
  updateAmountObtained,
  confirmPurchase,
  bookPartialAmount,
  updateIngredientMetroUrl,
  regenerateMetroUrlWithAI,
} from "./actions";
import { PdfExportButton } from "./PdfExportButton";

export default async function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await db.shoppingList.findUnique({
    where: { id },
    include: {
      items: {
        include: { ingredient: true },
        orderBy: { ingredient: { category: "asc" } },
      },
    },
  });

  if (!list) notFound();

  const checkedCount = list.items.filter((i) => i.checked).length;

  // Group items by category
  const groupedItems = list.items.reduce(
    (acc, item) => {
      const cat = item.ingredient.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, typeof list.items>,
  );

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {list.type === "metro"
              ? "Metro Lieferung"
              : list.type === "vor_ort"
                ? "Vor-Ort Einkauf"
                : "Sonstiger Einkauf"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Generiert am{" "}
            {format(list.createdAt, "dd. MMMM yyyy, HH:mm", { locale: de })}
          </p>
        </div>
        <PdfExportButton listData={list} groupedItems={groupedItems} />
      </div>

      <div className="space-y-8 bg-card border rounded-lg p-6 shadow-sm">
        {Object.keys(groupedItems).length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Alles ist auf Lager. Keine fehlenden Zutaten!
          </p>
        )}

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              {category}
            </h2>
            <div className="space-y-4">
              {items.map((item) => {
                const stillNeeded = Math.max(
                  0,
                  item.amountTotal - (item.amountObtained ?? 0),
                );
                const fullyObtained =
                  (item.amountObtained ?? 0) >= item.amountTotal;

                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    {/* Toggle row */}
                    <form
                      action={toggleItemChecked}
                      className="flex items-center space-x-3"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <input
                        type="hidden"
                        name="checked"
                        value={item.checked ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="flex items-center space-x-3 w-full text-left"
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          className="pointer-events-none"
                        />
                        <Label
                          htmlFor={item.id}
                          className={`flex-1 cursor-pointer text-base ${item.checked ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.ingredient.name}
                        </Label>
                        <span
                          className={`font-mono text-sm ${item.checked ? "text-muted-foreground" : "font-medium"}`}
                        >
                          {item.amountTotal.toLocaleString("de-DE")}{" "}
                          {item.ingredient.unit}
                        </span>
                      </button>
                    </form>

                    {/* Partial delivery row */}
                    <div className="pl-7 space-y-1">
                      <form
                        action={updateAmountObtained}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="itemId" value={item.id} />
                        <span className="text-xs text-muted-foreground shrink-0">
                          Besorgt:
                        </span>
                        <input
                          type="number"
                          name="amountObtained"
                          defaultValue={item.amountObtained ?? 0}
                          min={0}
                          step={
                            ["kg", "l"].includes(item.ingredient.unit)
                              ? "0.1"
                              : "any"
                          }
                          className="w-20 text-sm border rounded px-2 py-1 text-right"
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.ingredient.unit}
                        </span>
                        <button
                          type="submit"
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 transition-opacity"
                        >
                          Speichern
                        </button>
                      </form>
                      {(item.amountObtained ?? 0) > 0 && (
                        <form
                          action={bookPartialAmount}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            {(item.amountObtained ?? 0).toLocaleString("de-DE")}{" "}
                            {item.ingredient.unit} ins Lager einbuchen
                          </button>
                          {!fullyObtained && (
                            <span className="text-xs text-orange-600 font-medium">
                              Noch {stillNeeded.toLocaleString("de-DE")}{" "}
                              {item.ingredient.unit} offen
                            </span>
                          )}
                          {fullyObtained && (
                            <span className="text-xs text-green-600 font-medium">
                              Vollständig besorgt
                            </span>
                          )}
                        </form>
                      )}
                    </div>

                    {/* Metro Link Row */}
                    <div className="pl-7 pt-2 border-t border-muted/30 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        {item.ingredient.metroUrl ? (
                          <a
                            href={item.ingredient.metroUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#002d72] text-[#ffdd00] hover:bg-[#002256] font-bold px-2 py-0.5 rounded text-[10px] tracking-wide flex items-center gap-1 shadow-sm border border-[#ffdd00]/20 transition-colors"
                            title="Produkt bei Metro öffnen"
                          >
                            <span>METRO</span>
                            <span className="text-[8px] text-white">↗</span>
                          </a>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded border">
                            Kein Link
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <form
                          action={updateIngredientMetroUrl}
                          className="flex-1 flex items-center gap-1.5"
                        >
                          <input
                            type="hidden"
                            name="ingredientId"
                            value={item.ingredient.id}
                          />
                          <input
                            type="hidden"
                            name="shoppingListId"
                            value={list.id}
                          />
                          <input
                            type="url"
                            name="metroUrl"
                            placeholder="Metro-Link manuell einfügen..."
                            defaultValue={item.ingredient.metroUrl || ""}
                            className="flex-1 min-w-0 text-xs border rounded px-2 py-1 bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-7"
                          />
                          <button
                            type="submit"
                            className="text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 border px-2 py-1 rounded h-7 transition-colors shrink-0"
                            title="Link speichern"
                          >
                            Speichern
                          </button>
                        </form>

                        <form
                          action={regenerateMetroUrlWithAI}
                          className="shrink-0"
                        >
                          <input
                            type="hidden"
                            name="ingredientId"
                            value={item.ingredient.id}
                          />
                          <input
                            type="hidden"
                            name="shoppingListId"
                            value={list.id}
                          />
                          <button
                            type="submit"
                            className="text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50 px-2.5 py-1 rounded h-7 transition-colors flex items-center gap-1 shrink-0"
                            title="Link mit KI generieren"
                          >
                            <span>✨ KI</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {checkedCount > 0 && list.status !== "abgeschlossen" && (
        <form action={confirmPurchase} className="mt-6">
          <input type="hidden" name="listId" value={list.id} />
          <Button
            type="submit"
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="w-4 h-4" />
            Einkauf bestätigen – {checkedCount} Position
            {checkedCount !== 1 ? "en" : ""} ins Lager einbuchen
          </Button>
        </form>
      )}

      {list.status === "abgeschlossen" && (
        <div className="mt-6 flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg py-3 px-4 text-sm font-medium">
          ✓ Einkauf wurde bereits ins Lager eingebucht
        </div>
      )}
    </div>
  );
}
