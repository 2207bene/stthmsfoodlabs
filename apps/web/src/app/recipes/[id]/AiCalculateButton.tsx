"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalcMeta {
  totalPersons: number;
  totalMeat: number;
  totalVeggie: number;
  buffer: number;
  totalWithBuffer: number;
  personsMeatWithBuffer: number;
  personsVeggieWithBuffer: number;
}

export function AiCalculateButton({ recipeId }: { recipeId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [meta, setMeta] = useState<CalcMeta | null>(null);
  const [open, setOpen] = useState(false);
  const [buffer, setBuffer] = useState(0);

  const handleCalculate = async () => {
    setLoading(true);
    setOpen(true);
    setResult(null);
    setMeta(null);

    try {
      const res = await fetch("/api/ai/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, buffer }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResult(data.result);
      setMeta(data.meta);
    } catch (err: any) {
      setResult("Fehler bei der Berechnung: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 border border-indigo-200 rounded-md bg-indigo-50 px-2 py-1">
          <label
            htmlFor="buffer-input"
            className="text-xs text-indigo-600 whitespace-nowrap font-medium"
          >
            Puffer %
          </label>
          <input
            id="buffer-input"
            type="number"
            min={0}
            max={100}
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className="w-12 text-center text-sm bg-transparent border-none focus:outline-none text-indigo-800 font-bold"
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleCalculate}
          className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
        >
          <Sparkles className="w-4 h-4" />
          Menge & Nährwerte berechnen
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              KI-Mengenberechnung
            </DialogTitle>
            <DialogDescription>
              Claude berechnet die Gesamtmengen basierend auf den eingetragenen
              Gruppen.
            </DialogDescription>
          </DialogHeader>

          {meta && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <Users className="w-4 h-4" />
                <span className="font-medium">
                  {meta.totalPersons} Personen
                </span>
                <span className="text-indigo-400">
                  ({meta.totalMeat} Fleisch · {meta.totalVeggie} Vegetarisch)
                </span>
              </div>
              {meta.buffer > 0 && (
                <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  <span>+{meta.buffer}% Puffer</span>
                  <span className="font-bold">
                    → {meta.totalWithBuffer} Personen
                  </span>
                  <span className="text-green-500">
                    ({meta.personsMeatWithBuffer} /{" "}
                    {meta.personsVeggieWithBuffer})
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Claude analysiert das Rezept und berechnet die Mengen...</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-gray-800 bg-muted/50 p-4 rounded-md font-sans">
                {result}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
