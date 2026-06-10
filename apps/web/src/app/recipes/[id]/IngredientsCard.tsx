"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  Users,
  ChevronDown,
  ChevronUp,
  Calculator,
  Drumstick,
  Salad,
  RefreshCw,
} from "lucide-react";
import {
  addIngredientToVersion,
  updateRecipeIngredient,
  removeRecipeIngredient,
} from "@/app/actions/recipes";
import { getPersonGroupCounts } from "@/app/actions/groups";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface RecipeIngredientRow {
  id: string;
  amountPerPerson: number;
  unit: string;
  ingredient: Ingredient;
}

interface IngredientsCardProps {
  versionId: string;
  versionType: "MIT_FLEISCH" | "VEGETARISCH";
  initialIngredients: RecipeIngredientRow[];
  recipeId: string;
  defaultPersons: number;
}

const CATEGORIES = [
  "Fleisch & Fisch",
  "Gemüse",
  "Obst",
  "Milch & Käse",
  "Brot & Getreide",
  "Gewürze & Saucen",
  "Getränke",
  "Sonstiges",
];

function formatAmount(amount: number, unit: string): string {
  if (unit.toLowerCase() === "g" && amount >= 1000) {
    return `${(amount / 1000).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`;
  }
  if (unit.toLowerCase() === "ml" && amount >= 1000) {
    return `${(amount / 1000).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} l`;
  }
  return `${amount.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
}

export function IngredientsCard({
  versionId,
  versionType,
  initialIngredients,
  recipeId,
  defaultPersons,
}: IngredientsCardProps) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [isPending, startTransition] = useTransition();

  // Persons adjustment
  const [persons, setPersons] = useState(defaultPersons || 0);
  const [buffer, setBuffer] = useState(0);
  const [showTotals, setShowTotals] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshPersons = async () => {
    setIsRefreshing(true);
    const counts = await getPersonGroupCounts();
    const fresh = versionType === "MIT_FLEISCH" ? counts.meat : counts.veggie;
    setPersons(fresh);
    setIsRefreshing(false);
  };

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUnit, setAddUnit] = useState("g");
  const [addAmount, setAddAmount] = useState("");
  const [addCategory, setAddCategory] = useState("Sonstiges");
  const [addError, setAddError] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<RecipeIngredientRow | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editUnit, setEditUnit] = useState("");

  const totalPersons = Math.ceil(persons * (1 + buffer / 100));

  const openEdit = (row: RecipeIngredientRow) => {
    setEditRow(row);
    setEditAmount(String(row.amountPerPerson));
    setEditUnit(row.unit);
    setEditOpen(true);
  };

  const handleAdd = () => {
    const amount = parseFloat(addAmount);
    if (!addName.trim() || isNaN(amount) || amount <= 0) {
      setAddError("Bitte Name und gültige Menge eingeben.");
      return;
    }
    setAddError("");
    startTransition(async () => {
      await addIngredientToVersion(versionId, recipeId, {
        name: addName.trim(),
        unit: addUnit,
        amountPerPerson: amount,
        category: addCategory,
      });
      setIngredients((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          amountPerPerson: amount,
          unit: addUnit,
          ingredient: {
            id: "",
            name: addName.trim(),
            unit: addUnit,
            category: addCategory,
          },
        },
      ]);
      setAddOpen(false);
      setAddName("");
      setAddUnit("g");
      setAddAmount("");
      setAddCategory("Sonstiges");
    });
  };

  const handleEdit = () => {
    if (!editRow) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    startTransition(async () => {
      await updateRecipeIngredient(editRow.id, recipeId, {
        amountPerPerson: amount,
        unit: editUnit,
      });
      setIngredients((prev) =>
        prev.map((row) =>
          row.id === editRow.id
            ? { ...row, amountPerPerson: amount, unit: editUnit }
            : row,
        ),
      );
      setEditOpen(false);
    });
  };

  const handleRemove = (rowId: string) => {
    startTransition(async () => {
      await removeRecipeIngredient(rowId, recipeId);
      setIngredients((prev) => prev.filter((r) => r.id !== rowId));
    });
  };

  const isVeggie = versionType === "VEGETARISCH";
  const titleIcon = isVeggie ? (
    <Salad className="w-4 h-4 text-green-600 inline mr-1" />
  ) : (
    <Drumstick className="w-4 h-4 text-orange-500 inline mr-1" />
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {titleIcon}
            Zutaten ({isVeggie ? "Vegetarisch" : "Fleisch"})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-3 h-3" />
            Hinzufügen
          </Button>
        </div>

        {/* Persons & totals panel */}
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-3.5 h-3.5" />
              <span>Kalkuliert für</span>
              <input
                type="number"
                min={0}
                value={persons}
                onChange={(e) =>
                  setPersons(Math.max(0, Number(e.target.value)))
                }
                className="w-14 text-center rounded border border-gray-300 px-1 py-0.5 text-sm bg-white"
              />
              <span>Personen</span>
              <button
                type="button"
                onClick={handleRefreshPersons}
                disabled={isRefreshing}
                className="ml-1 p-0.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                title="Personenzahl aus Gruppen neu laden"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>Puffer</span>
              <input
                type="number"
                min={0}
                max={100}
                value={buffer}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="w-12 text-center rounded border border-gray-300 px-1 py-0.5 text-sm bg-white"
              />
              <span>%</span>
            </div>

            {buffer > 0 && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                → {totalPersons} Pers. mit Puffer
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs text-indigo-600 hover:bg-indigo-50 ml-auto"
              onClick={() => setShowTotals(!showTotals)}
            >
              <Calculator className="w-3 h-3" />
              Gesamtmengen
              {showTotals ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>

          {showTotals && ingredients.length > 0 && (
            <div className="border-t border-gray-200 pt-2 space-y-1">
              <p className="text-xs font-medium text-gray-500">
                Gesamtmengen für {totalPersons} Personen
                {buffer > 0 ? ` (+${buffer}% Puffer)` : ""}:
              </p>
              {ingredients.map((ing) => {
                const total = ing.amountPerPerson * totalPersons;
                const displayTotal = formatAmount(total, ing.unit);
                return (
                  <div
                    key={ing.id}
                    className="text-xs flex justify-between text-gray-700"
                  >
                    <span>{ing.ingredient.name}</span>
                    <span className="font-medium">{displayTotal}</span>
                  </div>
                );
              })}
            </div>
          )}

          {showTotals && ingredients.length === 0 && (
            <p className="text-xs text-gray-400 border-t border-gray-200 pt-2">
              Noch keine Zutaten hinterlegt.
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {ingredients.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Noch keine Zutaten hinterlegt.
          </p>
        ) : (
          <ul className="space-y-0">
            {ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between py-2 border-b last:border-0 group"
              >
                <span className="text-sm">{ing.ingredient.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 flex flex-col items-end">
                    <span>
                      {ing.amountPerPerson} {ing.unit}
                      <span className="text-xs text-gray-400 font-normal">
                        {" "}
                        /Pers.
                      </span>
                    </span>
                    {totalPersons > 0 && (
                      <span className="text-xs text-indigo-600 font-normal bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5">
                        Gesamt:{" "}
                        {formatAmount(
                          ing.amountPerPerson * totalPersons,
                          ing.unit,
                        )}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => openEdit(ing)}
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-gray-500"
                    title="Bearbeiten"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(ing.id)}
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400"
                    title="Entfernen"
                    disabled={isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Add ingredient dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Zutat hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="z.B. Hackfleisch"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-amount">Menge pro Person</Label>
                <Input
                  id="add-amount"
                  type="number"
                  min={0}
                  step="any"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="z.B. 150"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-unit">Einheit</Label>
                <Input
                  id="add-unit"
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value)}
                  placeholder="g / ml / Stk."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-category">Kategorie</Label>
              <select
                id="add-category"
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {addError && <p className="text-xs text-red-600">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? "Speichert..." : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit ingredient dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Zutat bearbeiten – {editRow?.ingredient.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-amount">Menge pro Person</Label>
              <Input
                id="edit-amount"
                type="number"
                min={0}
                step="any"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-unit">Einheit</Label>
              <Input
                id="edit-unit"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
