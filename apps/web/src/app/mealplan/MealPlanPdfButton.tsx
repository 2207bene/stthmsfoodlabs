"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Recipe = {
  id: string;
  name: string;
  category: string;
};

type MealPlanEntry = {
  id: string;
  date: Date | string;
  mealTime: string;
  recipeId: string | null;
  recipe: Recipe | null;
  status: string;
};

type MealPlanPdfButtonProps = {
  entries: MealPlanEntry[];
  weekDates: string[];
};

const MEAL_TIMES = [
  { id: "fruehstueck", label: "Frühstück" },
  { id: "mittag", label: "Mittagessen" },
  { id: "nachmittag", label: "Nachmittag" },
  { id: "abend", label: "Abendessen" },
  { id: "special", label: "Special" },
];

export function MealPlanPdfButton({ entries, weekDates }: MealPlanPdfButtonProps) {
  const handleExport = () => {
    // A4 landscape dimensions: 297mm x 210mm
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const year = new Date(weekDates[0]).getFullYear();
    const startDateFormatted = format(new Date(weekDates[0]), "dd.MM.yyyy");
    const endDateFormatted = format(new Date(weekDates[6]), "dd.MM.yyyy");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // text-gray-800
    doc.text(`Speiseplan Sommerlager ${year}`, 10, 15);

    // Subtitle (date range)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.text(`${startDateFormatted} – ${endDateFormatted}`, 10, 21);

    // Build Headers: "Mahlzeit" followed by the 7 formatted week dates
    const headers = [
      "Mahlzeit",
      ...weekDates.map((dateStr) => {
        const d = new Date(dateStr);
        return `${format(d, "EEEE", { locale: de })}\n${format(d, "dd.MM.")}`;
      }),
    ];

    // Build Rows for each meal time
    const rows = MEAL_TIMES.map((mealTime) => {
      const rowCells = [mealTime.label];
      weekDates.forEach((dateStr) => {
        const cellEntries = entries.filter((e) => {
          return new Date(e.date).toISOString() === dateStr && e.mealTime === mealTime.id;
        });

        // Combine all recipes for this time slot with a double newline for spacing
        const text = cellEntries
          .map((e) => e.recipe?.name || "Unbekanntes Rezept")
          .join("\n\n");
        rowCells.push(text);
      });
      return rowCells;
    });

    // Generate PDF table
    autoTable(doc, {
      startY: 26,
      head: [headers],
      body: rows,
      theme: "grid",
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "top",
        halign: "left",
      },
      headStyles: {
        fillColor: [197, 85, 48], // Brand primary color (approx. oklch(0.61 0.13 45))
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        minCellHeight: 12,
      },
      bodyStyles: {
        minCellHeight: 28, // Tall fields so they are larger and readable
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 28,
          valign: "middle",
          halign: "center",
        },
      },
      didParseCell: (data) => {
        // Color-code the meal time label column (Column 0) matching the UI
        if (data.column.index === 0 && data.row.section === "body") {
          const mealTimeId = MEAL_TIMES[data.row.index]?.id;
          if (mealTimeId === "fruehstueck") {
            data.cell.styles.fillColor = [255, 237, 213]; // bg-orange-100
            data.cell.styles.textColor = [194, 65, 12]; // text-orange-800
          } else if (mealTimeId === "mittag") {
            data.cell.styles.fillColor = [220, 252, 231]; // bg-green-100
            data.cell.styles.textColor = [21, 128, 61]; // text-green-800
          } else if (mealTimeId === "nachmittag") {
            data.cell.styles.fillColor = [243, 232, 255]; // bg-purple-100
            data.cell.styles.textColor = [109, 40, 217]; // text-purple-800
          } else if (mealTimeId === "abend") {
            data.cell.styles.fillColor = [219, 234, 254]; // bg-blue-100
            data.cell.styles.textColor = [29, 78, 216]; // text-blue-800
          } else if (mealTimeId === "special") {
            data.cell.styles.fillColor = [254, 243, 199]; // bg-yellow-100
            data.cell.styles.textColor = [161, 98, 7]; // text-yellow-800
          }
        }
      },
    });

    // Add footer on all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // text-gray-400
      // Left footer
      doc.text("KJG Küchen-App", 10, 202);
      // Right footer
      doc.text(`Seite ${i} von ${totalPages}`, 287, 202, { align: "right" });
    }

    doc.save(`Speiseplan_${startDateFormatted}_${endDateFormatted}.pdf`);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
      <Printer className="w-4 h-4" />
      <span className="hidden md:inline">PDF Export</span>
    </Button>
  );
}
