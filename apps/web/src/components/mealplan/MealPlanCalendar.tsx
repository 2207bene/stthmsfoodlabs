"use client";

import { useState, useEffect } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { assignRecipeToMealTime, removeMealPlanEntry, moveMealPlanEntry, updateMealPlanStatus } from "@/app/actions/mealplan";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { BookOpen, Trash2, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Recipe = {
  id: string;
  name: string;
  category: string;
};

type MealPlanEntry = {
  id: string;
  date: Date;
  mealTime: string;
  recipeId: string | null;
  recipe: Recipe | null;
  status: string;
};

const MEAL_TIMES = [
  { id: "fruehstueck", label: "Frühstück", color: "bg-orange-100 border-orange-200 text-orange-800" },
  { id: "mittag", label: "Mittagessen", color: "bg-green-100 border-green-200 text-green-800" },
  { id: "nachmittag", label: "Nachmittag", color: "bg-purple-100 border-purple-200 text-purple-800" },
  { id: "abend", label: "Abendessen", color: "bg-blue-100 border-blue-200 text-blue-800" },
  { id: "special", label: "Special", color: "bg-yellow-100 border-yellow-200 text-yellow-800" },
];

const STATUS_OPTIONS = [
  { value: "leer", label: "Leer" },
  { value: "geplant", label: "Geplant" },
  { value: "vorbereitet", label: "Vorbereitet" },
  { value: "gekocht", label: "Gekocht" },
];

function DraggableRecipe({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { type: "recipe", recipe },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-3 bg-white border rounded-md shadow-sm cursor-grab hover:border-gray-400 z-10 relative"
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium truncate">{recipe.name}</p>
        <p className="text-xs text-gray-500">{recipe.category}</p>
      </div>
    </div>
  );
}

function DraggableCalendarEntry({
  entry,
  color,
  onDelete,
  onStatusChange,
}: {
  entry: MealPlanEntry;
  color: string;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isTemp = entry.id.startsWith("temp-");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: { type: "entry", entry },
    disabled: isTemp,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isTemp ? listeners : {})}
      {...(!isTemp ? attributes : {})}
      className={`p-2 rounded-md border text-sm relative group ${color} ${!isTemp ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {!isTemp && (
        <GripVertical className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-current opacity-40 group-hover:opacity-70" />
      )}
      <div className={`font-medium pr-6 truncate ${!isTemp ? "pl-4" : ""}`}>
        {entry.recipe?.name || "Unbekanntes Rezept"}
      </div>
      {!isTemp ? (
        <select
          value={entry.status}
          onChange={(e) => onStatusChange(entry.id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`mt-1 text-xs w-full bg-transparent border-none outline-none cursor-pointer opacity-70 hover:opacity-100 pl-4`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-xs opacity-70 mt-0.5">Wird gespeichert…</div>
      )}
      {!isTemp && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function DroppableCell({
  date,
  mealTime,
  entries,
  color,
  onDelete,
  onStatusChange,
}: {
  date: string;
  mealTime: string;
  entries: MealPlanEntry[];
  color: string;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const id = `cell-${date}-${mealTime}`;
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { date, mealTime },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] p-2 border rounded-md transition-colors flex flex-col gap-1 ${
        isOver ? "bg-accent border-dashed border-accent-foreground border-2" : "bg-card"
      }`}
    >
      {entries.length > 0 ? (
        entries.map((entry) => (
          <DraggableCalendarEntry
            key={entry.id}
            entry={entry}
            color={color}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300 text-xs text-center border-2 border-transparent border-dashed flex-1">
          Drop Rezept hier
        </div>
      )}
    </div>
  );
}

export default function MealPlanCalendar({
  initialEntries,
  recipes,
  weekDates,
}: {
  initialEntries: MealPlanEntry[];
  recipes: Recipe[];
  weekDates: string[];
}) {
  const [entries, setEntries] = useState(initialEntries);

  // Sync with server data after revalidatePath triggers an RSC re-render
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const handleDelete = async (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    await removeMealPlanEntry(entryId);
  };

  const handleStatusChange = async (entryId: string, status: string) => {
    setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, status } : e)));
    await updateMealPlanStatus(entryId, status);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !over.id.toString().startsWith("cell-")) return;

    const { date, mealTime } = over.data.current as { date: string; mealTime: string };

    if (active.data.current?.type === "entry") {
      const entry = active.data.current.entry as MealPlanEntry;
      if (entry.id.startsWith("temp-")) return;

      const sourceDate = new Date(entry.date).toISOString();
      if (sourceDate === date && entry.mealTime === mealTime) return;

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, date: new Date(date), mealTime } : e))
      );
      await moveMealPlanEntry(entry.id, date, mealTime);
    } else {
      const recipe = active.data.current?.recipe as Recipe;
      if (recipe && date && mealTime) {
        const tempId = `temp-${Date.now()}`;
        setEntries((prev) => [
          ...prev,
          { id: tempId, date: new Date(date), mealTime, recipeId: recipe.id, recipe, status: "geplant" },
        ]);
        const realId = await assignRecipeToMealTime(recipe.id, date, mealTime);
        setEntries((prev) => prev.map((e) => (e.id === tempId ? { ...e, id: realId } : e)));
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-auto bg-card rounded-xl border border-border shadow-sm">
          <div className="grid grid-cols-8 gap-px bg-border min-w-[800px]">
            {/* Header */}
            <div className="bg-muted p-4 sticky top-0 left-0 z-20"></div>
            {weekDates.map((dateStr) => {
              const date = new Date(dateStr);
              return (
                <div key={dateStr} className="bg-muted p-3 text-center sticky top-0 z-10">
                  <div className="text-sm font-medium text-foreground">{format(date, "EEEE", { locale: de })}</div>
                  <div className="text-xs text-gray-500">{format(date, "dd.MM.")}</div>
                </div>
              );
            })}

            {/* Rows */}
            {MEAL_TIMES.map((mealTime) => (
              <div key={mealTime.id} className="contents">
                <div className="bg-muted p-4 font-medium text-sm flex items-center border-t border-border sticky left-0 z-10 text-foreground">
                  {mealTime.label}
                </div>
                {weekDates.map((dateStr) => {
                  const cellEntries = entries.filter(
                    (e) => new Date(e.date).toISOString() === dateStr && e.mealTime === mealTime.id
                  );
                  return (
                    <div key={`${dateStr}-${mealTime.id}`} className="bg-card p-2 border-t border-border">
                      <DroppableCell
                        date={dateStr}
                        mealTime={mealTime.id}
                        entries={cellEntries}
                        color={mealTime.color}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Recipes */}
        <div className="w-80 bg-muted rounded-xl border border-border flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border bg-card font-medium flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4" />
            Rezepte
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 pb-8 space-y-4">
              {recipes.filter(r => r.category !== "Kuchenspenden").length > 0 && (
                <div className="space-y-2">
                  {recipes.filter(r => r.category !== "Kuchenspenden").map((recipe) => (
                    <DraggableRecipe key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
              {recipes.filter(r => r.category === "Kuchenspenden").length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider px-1 pb-1.5 border-b border-amber-200 mb-2">
                    🎂 Kuchenspenden
                  </div>
                  <div className="space-y-2">
                    {recipes.filter(r => r.category === "Kuchenspenden").map((recipe) => (
                      <DraggableRecipe key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                </div>
              )}
              {recipes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Keine Rezepte vorhanden. Bitte lege zuerst Rezepte an.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </DndContext>
  );
}
