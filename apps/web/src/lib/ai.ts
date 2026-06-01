import Anthropic from "@anthropic-ai/sdk";

export async function generateMetroSearchUrl(ingredient: { name: string; unit: string; category: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const defaultUrl = `https://www.metro.de/marktplatz/search?q=${encodeURIComponent(ingredient.name)}`;

  if (!apiKey) {
    console.log(`Kein ANTHROPIC_API_KEY gefunden. Nutze Fallback-Link für: ${ingredient.name}`);
    return defaultUrl;
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      temperature: 0.1,
      system: "Du bist ein Küchen-Assistent für ein Pfadfinderlager/Großküche. Deine Aufgabe ist es, für einen gegebenen Zutaten-Namen den optimalen Suchbegriff für den Metro-Onlineshop (Deutschland) zu ermitteln. Antworte ausschließlich mit dem optimierten Suchbegriff (keine Erklärung, kein Markup, kein Satzzeichen, kein 'Suche nach').",
      messages: [
        {
          role: "user",
          content: `Zutat: "${ingredient.name}", Einheit: "${ingredient.unit}", Kategorie: "${ingredient.category}".\nOptimierter Suchbegriff für Metro:`
        }
      ]
    });

    const optimizedTerm = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    if (optimizedTerm) {
      // Clean query and build standard Metro search URL
      const cleanTerm = optimizedTerm.replace(/^["']|["']$/g, '');
      console.log(`AI-optimierter Suchbegriff für '${ingredient.name}': '${cleanTerm}'`);
      return `https://www.metro.de/marktplatz/search?q=${encodeURIComponent(cleanTerm)}`;
    }
  } catch (error) {
    console.error("Fehler bei der KI-Generierung des Metro Links:", error);
  }

  return defaultUrl;
}
