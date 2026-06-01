import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@kjg/database";
import Anthropic from "@anthropic-ai/sdk";
import { getPersonGroupCounts } from "@/app/actions/groups";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { recipeId, buffer = 0 } = await req.json();

    if (!recipeId) {
      return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });
    }

    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        versions: {
          include: {
            ingredients: {
              include: { ingredient: true }
            }
          }
        }
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Fetch person groups and combined counts (manual + Campflow)
    const [groups, counts] = await Promise.all([
      db.personGroup.findMany(),
      getPersonGroupCounts(),
    ]);

    const totalMeat = counts.meat;
    const totalVeggie = counts.veggie;
    const totalPersons = totalMeat + totalVeggie;

    // Apply buffer
    const bufferFactor = 1 + (buffer / 100);
    const personsMeatWithBuffer = Math.ceil(totalMeat * bufferFactor);
    const personsVeggieWithBuffer = Math.ceil(totalVeggie * bufferFactor);
    const totalWithBuffer = Math.ceil(totalPersons * bufferFactor);

    // Prepare recipe context
    let recipeContext = `Rezept: ${recipe.name}\n`;
    for (const version of recipe.versions) {
      recipeContext += `\nVersion ${version.type}:\n`;
      for (const ing of version.ingredients) {
        recipeContext += `- ${ing.amountPerPerson} ${ing.ingredient.unit} ${ing.ingredient.name} pro Person\n`;
      }
    }

    const manualTotal = groups.reduce((s, g) => s + g.count, 0);
    const campflowCount = totalPersons - manualTotal;
    const groupParts = groups.map(g => `${g.name}: ${g.count} Personen (${g.isVegetarian ? "vegetarisch" : "mit Fleisch"})`);
    if (campflowCount > 0) groupParts.push(`Campflow-Import: ${campflowCount} weitere Personen`);
    const groupSummary = groupParts.length === 0
      ? "Keine Personen eingetragen (bitte Gruppen oder Campflow-Import anlegen)."
      : groupParts.join(", ");

    const prompt = `Du bist ein Küchen-Assistent für ein Sommerlager.

Gruppen: ${groupSummary}
Gesamt: ${totalPersons} Personen (${totalMeat} Fleischesser, ${totalVeggie} Vegetarier)
${buffer > 0 ? `Puffer: +${buffer}% → Kalkulation mit ${totalWithBuffer} Personen (${personsMeatWithBuffer} Fleisch, ${personsVeggieWithBuffer} Vegetarisch)` : ""}

Berechne bitte auf Basis der folgenden Zutatenmengen pro Person die Gesamtmengen für diese Gruppe.
Gib zusätzlich eine grobe Kalorienabschätzung pro Portion und Gesamt an.

${recipeContext}

Formatiere die Ausgabe als übersichtlichen Text (Markdown-fähig), der direkt einem Koch angezeigt werden kann.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });

    let contentText = "Keine Antwort generiert.";
    if (message.content && message.content.length > 0) {
       const firstBlock = message.content[0];
       if ('text' in firstBlock) {
         contentText = firstBlock.text;
       }
    }

    return NextResponse.json({
      result: contentText,
      meta: {
        totalPersons,
        totalMeat,
        totalVeggie,
        buffer,
        totalWithBuffer,
        personsMeatWithBuffer,
        personsVeggieWithBuffer,
      }
    });

  } catch (error: any) {
    console.error("AI Calculate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
