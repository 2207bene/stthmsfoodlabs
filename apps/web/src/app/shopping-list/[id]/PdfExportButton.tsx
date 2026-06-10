"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PdfExportButtonProps = {
  listData: any;
  groupedItems: Record<string, any[]>;
};

export function PdfExportButton({
  listData,
  groupedItems,
}: PdfExportButtonProps) {
  const handleExport = () => {
    const doc = new jsPDF();

    // Title
    const title =
      listData.type === "metro"
        ? "Metro Bestellung"
        : listData.type === "vor_ort"
          ? "Vor-Ort Einkaufsliste"
          : "Einkaufsliste";

    doc.setFontSize(20);
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `Generiert am: ${format(new Date(listData.createdAt), "dd.MM.yyyy HH:mm")}`,
      14,
      30,
    );

    let currentY = 40;

    Object.entries(groupedItems).forEach(([category, items]) => {
      autoTable(doc, {
        startY: currentY,
        head: [[category, "Menge", "Abgehakt"]],
        body: items.map((item) => [
          item.ingredient.name,
          `${item.amountTotal.toLocaleString("de-DE")} ${item.ingredient.unit}`,
          "", // Empty column for checking off manually
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Einkaufsliste_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      Als PDF exportieren
    </Button>
  );
}
