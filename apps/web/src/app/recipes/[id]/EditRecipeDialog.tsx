"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { updateRecipe } from "@/app/actions/recipes";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface EditRecipeDialogProps {
  recipe: {
    id: string;
    name: string;
    category: string;
    tags: string;
    allergens: string;
    notes: string | null;
    cookingTime: number | null;
  };
}

export function EditRecipeDialog({ recipe }: EditRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [tags, setTags] = useState(recipe.tags);
  const [allergens, setAllergens] = useState(recipe.allergens);
  const [notes, setNotes] = useState(recipe.notes ?? "");
  const [cookingTime, setCookingTime] = useState(recipe.cookingTime ? String(recipe.cookingTime) : "");

  const handleSave = () => {
    startTransition(async () => {
      await updateRecipe(recipe.id, {
        name: name.trim() || recipe.name,
        category,
        tags,
        allergens,
        notes,
        cookingTime: cookingTime ? parseInt(cookingTime, 10) : null,
      });
      setOpen(false);
    });
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Edit className="w-4 h-4" />
        Bearbeiten
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rezept bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-recipe-name">Name</Label>
              <Input
                id="edit-recipe-name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-recipe-category">Kategorie</Label>
              <select
                id="edit-recipe-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="Hauptgericht">Hauptgericht</option>
                <option value="Beilage">Beilage</option>
                <option value="Frühstück">Frühstück</option>
                <option value="Nachmittagssnack">Nachmittagssnack</option>
                <option value="Dessert">Dessert</option>
                <option value="Special">Special</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-recipe-cookingtime">Kochzeit (Minuten)</Label>
              <Input
                id="edit-recipe-cookingtime"
                type="number"
                min={0}
                value={cookingTime}
                onChange={e => setCookingTime(e.target.value)}
                placeholder="z.B. 45"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-recipe-tags">Tags (kommasepariert)</Label>
              <Input
                id="edit-recipe-tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="z.B. Schnell, Günstig"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-recipe-allergens">Allergene (kommasepariert)</Label>
              <Input
                id="edit-recipe-allergens"
                value={allergens}
                onChange={e => setAllergens(e.target.value)}
                placeholder="z.B. Gluten, Laktose"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-recipe-notes">Zubereitungshinweise</Label>
              <textarea
                id="edit-recipe-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Schritt für Schritt Anleitung..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
