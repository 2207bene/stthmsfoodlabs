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
import { deleteGroup, updateGroup } from "../actions/groups";

const SELECT_CLASS =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

type Group = {
  id: string;
  name: string;
  count: number;
  ageRange: string;
  gender: string;
  isVegetarian: boolean;
  intolerances: string | null;
};

export function GroupCard({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(group.name);
  const [count, setCount] = useState(String(group.count));
  const [ageRange, setAgeRange] = useState(group.ageRange);
  const [gender, setGender] = useState(group.gender);
  const [isVegetarian, setIsVegetarian] = useState(String(group.isVegetarian));
  const [intolerances, setIntolerances] = useState(group.intolerances ?? "");

  const handleSave = () => {
    startTransition(async () => {
      await updateGroup(group.id, {
        name: name.trim() || group.name,
        count: parseInt(count, 10),
        ageRange,
        gender,
        isVegetarian: isVegetarian === "true",
        intolerances,
      });
      setOpen(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteGroup(group.id);
    });
  };

  return (
    <div className="flex justify-between items-center p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold">{group.name}</h3>
        <p className="text-sm text-gray-500">
          {group.count} Personen • {group.ageRange} • {group.gender}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              group.isVegetarian
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {group.isVegetarian ? "Vegetarisch" : "Mit Fleisch"}
          </span>
          {group.intolerances &&
            group.intolerances.split(",").map((intol) =>
              intol.trim() !== "" ? (
                <span
                  key={intol}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                >
                  {intol.trim()}
                </span>
              ) : null,
            )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Bearbeiten
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          Löschen
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gruppe bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor={`edit-name-${group.id}`}>Gruppenname</Label>
              <Input
                id={`edit-name-${group.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`edit-count-${group.id}`}>Anzahl Personen</Label>
              <Input
                id={`edit-count-${group.id}`}
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Altersgruppe</Label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="klein">Klein (7–12)</option>
                <option value="mittel">Mittel (12–15)</option>
                <option value="groß">Groß (16+)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Geschlecht</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="m">Männlich</option>
                <option value="f">Weiblich</option>
                <option value="diverse">Gemischt/Divers</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Ernährung</Label>
              <select
                value={isVegetarian}
                onChange={(e) => setIsVegetarian(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="false">Mit Fleisch</option>
                <option value="true">Vegetarisch</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Unverträglichkeiten (kommasepariert)</Label>
              <Input
                value={intolerances}
                onChange={(e) => setIntolerances(e.target.value)}
                placeholder="z.B. glutenfrei, laktosefrei"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
