import { prisma } from "@kjg/database";
import MealPlanCalendar from "@/components/mealplan/MealPlanCalendar";
import { startOfWeek, addDays, format, subWeeks, addWeeks } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealPlanPdfButton } from "./MealPlanPdfButton";

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  // Calculate the start-of-week to display.
  // If a "week" param is provided (ISO date string of any day in that week), use it.
  // Otherwise fall back to Aug 1, 2026 (Saturday before KW32 2026).
  const defaultDate = new Date("2025-08-02T00:00:00.000Z");
  const baseDate = week ? new Date(week) : defaultDate;
  const startOfCurrentWeek = startOfWeek(baseDate, { weekStartsOn: 6 });

  const weekDates = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfCurrentWeek, i),
  );

  const prevWeekParam = subWeeks(startOfCurrentWeek, 1).toISOString();
  const nextWeekParam = addWeeks(startOfCurrentWeek, 1).toISOString();

  const recipes = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
  });

  const entries = await prisma.mealPlanEntry.findMany({
    where: {
      date: {
        gte: weekDates[0],
        lte: weekDates[6],
      },
    },
    include: { recipe: true },
  });

  return (
    <div className="p-4 md:p-8 font-sans h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Speiseplan</h1>
          <p className="text-gray-500">
            {format(weekDates[0], "dd.MM.yyyy")} –{" "}
            {format(weekDates[6], "dd.MM.yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/mealplan?week=${prevWeekParam}`}>
            <Button variant="outline" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/mealplan?week=${new Date().toISOString()}`}>
            <Button variant="outline" size="sm">
              Heute
            </Button>
          </Link>
          <Link href={`/mealplan?week=${nextWeekParam}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <MealPlanPdfButton
            entries={entries}
            weekDates={weekDates.map((d) => d.toISOString())}
          />
        </div>
      </div>

      <MealPlanCalendar
        initialEntries={entries}
        recipes={recipes}
        weekDates={weekDates.map((d) => d.toISOString())}
      />
    </div>
  );
}
