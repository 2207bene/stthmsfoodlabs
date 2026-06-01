import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const systemPrompt = `Du bist ein erfahrener Koch und Küchen-Assistent für ein Jugend-Sommerlager ("Küche 26").
Deine Aufgabe ist es, auf Basis einer kurzen Beschreibung ein Rezept vorzuschlagen.
Antworte IMMER ausschließlich mit einem gültigen JSON-Objekt im folgenden Format:
{
  "name": "Name des Gerichts",
  "category": "Hauptgericht" | "Beilage" | "Frühstück" | "Nachmittagssnack" | "Dessert" | "Special",
  "tags": "Tag1, Tag2, Tag3",
  "allergens": "Allergen1, Allergen2",
  "notes": "Kurze Schritt-für-Schritt-Anleitung für die Großküche. Praxisnah und klar formuliert.",
  "cookingTime": 30
}
Kein weiterer Text, nur das JSON-Objekt.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: `Rezeptvorschlag für: ${prompt}` }],
    });

    let contentText = "";
    if (message.content && message.content.length > 0) {
      const firstBlock = message.content[0];
      if ("text" in firstBlock) {
        contentText = firstBlock.text;
      }
    }

    const start = contentText.indexOf("{");
    const end = contentText.lastIndexOf("}");
    const jsonText = start !== -1 && end > start ? contentText.slice(start, end + 1) : contentText.trim();

    const recipe = JSON.parse(jsonText);

    return NextResponse.json({ recipe });
  } catch (error: any) {
    console.error("AI Suggest Recipe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
