"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Users, Plus, Minus, Salad, Drumstick,
} from "lucide-react";

export interface SuggestedIngredient {
  name: string;
  unit: string;
  amountPerPerson: number;
  category: string;
}

interface RecipeSuggestion {
  name: string;
  category: string;
  tags: string;
  allergens: string;
  notes: string;
  cookingTime?: number;
  ingredients?: {
    meat: SuggestedIngredient[];
    veggie: SuggestedIngredient[];
  };
}

interface PersonGroup {
  id: string;
  name: string;
  count: number;
  isVegetarian: boolean;
}

interface AiSuggestionSectionProps {
  groups: PersonGroup[];
  defaultMeat: number;
  defaultVeggie: number;
  onAccept: (suggestion: RecipeSuggestion) => void;
}

export function AiSuggestionSection({ groups, defaultMeat, defaultVeggie, onAccept }: AiSuggestionSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Omit<RecipeSuggestion, "ingredients"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Step 2: persons dialog
  const [showPersonsStep, setShowPersonsStep] = useState(false);
  const [personsMeat, setPersonsMeat] = useState(defaultMeat);
  const [personsVeggie, setPersonsVeggie] = useState(defaultVeggie);
  const [buffer, setBuffer] = useState(0);

  // Step 3: ingredient loading + result
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [suggestedIngredients, setSuggestedIngredients] = useState<{ meat: SuggestedIngredient[]; veggie: SuggestedIngredient[] } | null>(null);
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setShowPersonsStep(false);
    setSuggestedIngredients(null);

    try {
      const res = await fetch("/api/ai/suggest-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestion(data.recipe);
    } catch (err: any) {
      setError("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPersonsStep = () => {
    setPersonsMeat(defaultMeat);
    setPersonsVeggie(defaultVeggie);
    setBuffer(0);
    setSuggestedIngredients(null);
    setIngredientError(null);
    setShowPersonsStep(true);
  };

  const handleGenerateIngredients = async () => {
    if (!suggestion) return;
    setLoadingIngredients(true);
    setIngredientError(null);
    setSuggestedIngredients(null);

    const bufferFactor = 1 + buffer / 100;
    const meatWithBuffer = Math.ceil(personsMeat * bufferFactor);
    const veggieWithBuffer = Math.ceil(personsVeggie * bufferFactor);

    try {
      const res = await fetch("/api/ai/suggest-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeName: suggestion.name,
          category: suggestion.category,
          notes: suggestion.notes,
          personsMeat: meatWithBuffer,
          personsVeggie: veggieWithBuffer,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestedIngredients(data.ingredients);
    } catch (err: any) {
      setIngredientError("Fehler: " + err.message);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleAcceptWithIngredients = () => {
    if (!suggestion) return;
    onAccept({ ...suggestion, ingredients: suggestedIngredients ?? undefined });
    setSuggestion(null);
    setPrompt("");
    setExpanded(false);
    setShowPersonsStep(false);
    setSuggestedIngredients(null);
  };

  const handleAcceptWithoutIngredients = () => {
    if (!suggestion) return;
    onAccept({ ...suggestion });
    setSuggestion(null);
    setPrompt("");
    setExpanded(false);
    setShowPersonsStep(false);
    setSuggestedIngredients(null);
  };

  const handleReject = () => {
    setSuggestion(null);
    setShowPersonsStep(false);
    setSuggestedIngredients(null);
  };

  const totalPersons = personsMeat + personsVeggie;
  const bufferFactor = 1 + buffer / 100;
  const totalWithBuffer = Math.ceil(totalPersons * bufferFactor);

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 overflow-hidden mb-6">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left hover:bg-indigo-50/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-indigo-900">KI-Rezeptvorschlag generieren</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-indigo-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-sm text-indigo-700">
            Beschreibe kurz, was du kochen möchtest – die KI schlägt dir ein vollständiges Rezept mit Zutaten vor.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="z.B. Pasta mit Hackfleischsoße, vegetarisches Curry, schnelles Frühstück..."
              className="flex-1 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Lädt..." : "Generieren"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          {suggestion && !showPersonsStep && (
            <div className="bg-white border border-indigo-200 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{suggestion.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {suggestion.category}
                  </span>
                  {suggestion.cookingTime && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      ⏱ {suggestion.cookingTime} Min.
                    </span>
                  )}
                  {suggestion.tags.split(",").filter(Boolean).map((tag) => (
                    <span key={tag.trim()} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {suggestion.allergens && (
                <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                  ⚠ Allergene: {suggestion.allergens}
                </p>
              )}

              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{suggestion.notes}</p>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleOpenPersonsStep}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Vorschlag übernehmen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReject}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Ablehnen
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Du kannst den Vorschlag nach der Übernahme noch anpassen.
              </p>
            </div>
          )}

          {suggestion && showPersonsStep && (
            <div className="bg-white border border-indigo-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Für wie viele Personen kalkulieren?</h3>
              </div>
              <p className="text-sm text-gray-500">
                Vorausgefüllt mit den aktuellen Gruppen. Du kannst die Zahlen noch anpassen.
              </p>

              {groups.length > 0 && (
                <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                  <p className="font-medium text-gray-600 mb-1">Aktuelle Gruppen:</p>
                  {groups.map(g => (
                    <div key={g.id} className="flex justify-between text-gray-500">
                      <span>{g.name}</span>
                      <span>{g.count} Personen · {g.isVegetarian ? "Vegetarisch" : "Mit Fleisch"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Drumstick className="w-3.5 h-3.5 text-orange-500" />
                    Fleischesser
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPersonsMeat(Math.max(0, personsMeat - 1))}
                      className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={personsMeat}
                      onChange={(e) => setPersonsMeat(Math.max(0, Number(e.target.value)))}
                      className="w-16 text-center rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPersonsMeat(personsMeat + 1)}
                      className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Salad className="w-3.5 h-3.5 text-green-600" />
                    Vegetarier
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPersonsVeggie(Math.max(0, personsVeggie - 1))}
                      className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={personsVeggie}
                      onChange={(e) => setPersonsVeggie(Math.max(0, Number(e.target.value)))}
                      className="w-16 text-center rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPersonsVeggie(personsVeggie + 1)}
                      className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Puffer %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={buffer}
                  onChange={(e) => setBuffer(Number(e.target.value))}
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
                />
                {buffer > 0 && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    → {totalWithBuffer} Personen gesamt
                  </span>
                )}
                {buffer === 0 && (
                  <span className="text-xs text-gray-500">{totalPersons} Personen gesamt</span>
                )}
              </div>

              {ingredientError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{ingredientError}</p>
              )}

              {suggestedIngredients && (
                <div className="space-y-3 border border-green-200 rounded-lg p-3 bg-green-50/50">
                  <p className="text-sm font-semibold text-green-800">KI-Vorschlag Zutaten:</p>

                  {suggestedIngredients.meat.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Drumstick className="w-3 h-3 text-orange-500" /> Mit Fleisch
                      </p>
                      <ul className="space-y-1">
                        {suggestedIngredients.meat.map((ing, i) => (
                          <li key={i} className="text-sm flex justify-between">
                            <span>{ing.name}</span>
                            <span className="font-medium text-gray-700">{ing.amountPerPerson} {ing.unit} / Person</span>
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
                          <li key={i} className="text-sm flex justify-between">
                            <span>{ing.name}</span>
                            <span className="font-medium text-gray-700">{ing.amountPerPerson} {ing.unit} / Person</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {!suggestedIngredients ? (
                  <Button
                    type="button"
                    onClick={handleGenerateIngredients}
                    disabled={loadingIngredients || totalPersons === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    {loadingIngredients ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {loadingIngredients ? "KI berechnet Zutaten..." : "Zutaten mit KI vorschlagen"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleAcceptWithIngredients}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Rezept und Zutaten übernehmen
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAcceptWithoutIngredients}
                  className="text-gray-600 gap-2"
                >
                  Nur Rezept übernehmen (ohne Zutaten)
                </Button>

                <button
                  type="button"
                  onClick={() => setShowPersonsStep(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline text-center"
                >
                  ← Zurück zum Vorschlag
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
