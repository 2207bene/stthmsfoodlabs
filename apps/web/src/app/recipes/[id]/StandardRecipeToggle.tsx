"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateRecipe } from "@/app/actions/recipes";

export function StandardRecipeToggle({
  recipeId,
  initialValue,
}: {
  recipeId: string;
  initialValue: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleCheckedChange = (checkedValue: boolean) => {
    setChecked(checkedValue);
    startTransition(async () => {
      await updateRecipe(recipeId, { isStandard: checkedValue });
    });
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <Checkbox
        id="standard-recipe-toggle"
        checked={checked}
        disabled={isPending}
        onCheckedChange={(val) => handleCheckedChange(val === true)}
      />
      <Label
        htmlFor="standard-recipe-toggle"
        className="text-sm font-medium leading-none cursor-pointer select-none"
      >
        Standard-Rezept (kann mehrmals verplant werden)
      </Label>
    </div>
  );
}
