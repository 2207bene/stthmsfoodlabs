"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Drumstick, Salad } from "lucide-react";
import { AiSuggestionSection, SuggestedIngredient } from "./AiSuggestionSection";
import { createRecipe } from "@/app/actions/recipes";

const SELECT_CLASS =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface PersonGroup {
  id: string;
  name: string;
  count: number;
  isVegetarian: boolean;
}

interface NewRecipeFormProps {
  groups: PersonGroup[];
}

export function NewRecipeForm({ groups }: NewRecipeFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hauptgericht");
  const [tags, setTags] = useState("");
  const [allergens, setAllergens] = useState("");
  const [notes, setNotes] = useState("");
  const [hasVeggie, setHasVeggie] = useState(true);
  const [suggestedIngredients, setSuggestedIngredients] = useState<{
    meat: SuggestedIngredient[];
    veggie: SuggestedIngredient[];
  } | null>(null);

  const handleAiAccept = (suggestion: {
    name: string;
    category: string;
    tags: string;
    allergens: string;
    notes: string;
    ingredients?: { meat: SuggestedIngredient[]; veggie: SuggestedIngredient[] };
  }) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setTags(suggestion.tags);
    setAllergens(suggestion.allergens);
    setNotes(suggestion.notes);
    if (suggestion.ingredients) {
      setSuggestedIngredients(suggestion.ingredients);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/recipes" className="text-gray-500 hover:text-black flex items-center gap-2 mb-4 text-sm w-fit">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Neues Rezept</h1>
        <p className="text-gray-500">Erstelle ein neues Gericht für den Speiseplan.</p>
      </div>

      <AiSuggestionSection groups={groups} onAccept={handleAiAccept} />

      {suggestedIngredients && (
        <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 mb-6 space-y-3">
          <p className="text-sm font-semibold text-green-800">Zutaten werden beim Speichern angelegt:</p>

          {suggestedIngredients.meat.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Drumstick className="w-3 h-3 text-orange-500" /> Mit Fleisch
              </p>
              <ul className="space-y-1">
                {suggestedIngredients.meat.map((ing, i) => (
                  <li key={i} className="text-sm flex justify-between text-gray-700">
                    <span>{ing.name}</span>
                    <span className="font-medium">{ing.amountPerPerson} {ing.unit} / Person</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestedIngredients.veggie.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Salad className="w-3 h-3 text-green-600" /> Vegetarisch
              </p>
              <ul className="space-y-1">
                {suggestedIngredients.veggie.map((ing, i) => (
                  <li key={i} className="text-sm flex justify-between text-gray-700">
                    <span>{ing.name}</span>
                    <span className="font-medium">{ing.amountPerPerson} {ing.unit} / Person</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSuggestedIngredients(null)}
            className="text-xs text-red-400 hover:text-red-600 underline"
          >
            Zutaten-Vorschlag verwerfen
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rezept Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              if (suggestedIngredients) {
                formData.set("ingredients", JSON.stringify(suggestedIngredients));
              }
              await createRecipe(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name des Gerichts</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="z.B. Käsespätzle"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <select
                name="category"
                id="category"
                className={SELECT_CLASS}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="Hauptgericht">Hauptgericht</option>
                <option value="Beilage">Beilage</option>
                <option value="Frühstück">Frühstück</option>
                <option value="Nachmittagssnack">Nachmittagssnack</option>
                <option value="Dessert">Dessert</option>
                <option value="Special">Special</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 pb-2">
              <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <input
                  type="checkbox"
                  name="hasVeggie"
                  id="hasVeggie"
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  checked={hasVeggie}
                  onChange={(e) => setHasVeggie(e.target.checked)}
                />
                Vegetarische Alternative mit anlegen
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Erstellt automatisch einen Tab für die pflanzliche Variante.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (kommasepariert)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="z.B. Schnell, Günstig, Kalt"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergene (kommasepariert)</Label>
              <Input
                id="allergens"
                name="allergens"
                placeholder="z.B. Gluten, Laktose"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Zubereitungs-Notizen / Rezept</Label>
              <textarea
                id="notes"
                name="notes"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Schritt für Schritt Anleitung..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full">Rezept speichern</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
