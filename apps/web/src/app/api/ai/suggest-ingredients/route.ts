import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { recipeName, category, notes, personsMeat, personsVeggie } = await req.json();

    if (!recipeName) {
      return NextResponse.json({ error: "Missing recipeName" }, { status: 400 });
    }

    const userPrompt = `Schlage realistische Zutaten mit Mengen pro Person vor für:

Gericht: ${recipeName}
Kategorie: ${category || "Hauptgericht"}
Zubereitung/Notizen: ${notes || "keine"}
Esser: ${personsMeat ?? 0} Fleischesser, ${personsVeggie ?? 0} Vegetarier

Antworte NUR mit folgendem JSON (kein weiterer Text):
{
  "meat": [
    { "name": "Zutat", "unit": "g", "amountPerPerson": 150, "category": "Fleisch & Fisch" }
  ],
  "veggie": [
    { "name": "Zutat", "unit": "g", "amountPerPerson": 150, "category": "Gemüse" }
  ]
}

Erlaubte Kategorien: "Fleisch & Fisch", "Gemüse", "Obst", "Milch & Käse", "Brot & Getreide", "Gewürze & Saucen", "Getränke", "Sonstiges"
Mengen als pro-Person-Wert angeben. Wenn kein Fleisch/Veggie-Esser, leeres Array verwenden.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: "Du bist ein Küchen-Assistent für ein Jugend-Sommerlager. Antworte ausschließlich mit gültigem JSON.",
      messages: [{ role: "user", content: userPrompt }],
    });

    if (message.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "Antwort zu lang — bitte Zutaten reduzieren." }, { status: 500 });
    }

    let contentText = "";
    const firstBlock = message.content[0];
    if (firstBlock && "text" in firstBlock) contentText = firstBlock.text;

    const start = contentText.indexOf("{");
    const end = contentText.lastIndexOf("}");
    const jsonText = start !== -1 && end > start ? contentText.slice(start, end + 1) : contentText.trim();
    const ingredients = JSON.parse(jsonText);

    return NextResponse.json({ ingredients });
  } catch (error: any) {
    console.error("AI Suggest Ingredients Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
