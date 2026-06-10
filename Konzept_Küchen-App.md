# Konzept: Küchen-App für Sommerlager

**Für:** KJG Sommerlager · ~80 Personen · 1 Woche  
**Stand:** Mai 2026  
**Erstellt von:** Claude (Softwareentwickler-Modus)

---

## 1. Ausgangslage & Ziele

### Kontext (aus den vorliegenden Dokumenten)

- **~80 Personen** (66 Kinder + 15 Leiter + 2 Küche), davon ca. 25 Vegetarier
- **4 Mahlzeiten täglich:** Frühstück (8:30) · Mittagessen (12:30) · Nachmittag (15:00) · Abendessen (18:30)
- **Bestellung:** Metro-Lieferung (1–2× pro Woche), zusätzlich Essensspenden
- **Besonderheiten:** Glutenfreie Optionen, vegetarische Alternativen zu jedem Fleischgericht
- **Kalkulation:** Bisher auf Basis von ~95 Personen (Puffer), Fleisch für ~70, Veggie für ~25

### Ziele der App

1. Speiseplanung visuell und übersichtlich machen
2. Einkaufslisten automatisch aus Rezepten generieren
3. Mengenberechnung KI-gestützt (Claude API) nach Personengruppen
4. Lagerbestand in Echtzeit im Blick behalten — inkl. vorausschauender Engpasswarnung
5. Beim Einkauf mobil abhaken können
6. Unverträglichkeiten und Ernährungsformen automatisch gegen Rezepte prüfen

---

## 2. Benutzerrollen

| Rolle          | Rechte                            | Typischer Use Case                                |
| -------------- | --------------------------------- | ------------------------------------------------- |
| **Küchenchef** | Alles                             | Plant Speiseplan, pflegt Rezepte, verwaltet Lager |
| **Köchin**     | Kochen bestätigen, Lager anpassen | Verbucht gekochte Gerichte, meldet Verbrauch      |
| **Einkäufer**  | Einkaufsliste lesen & abhaken     | Unterwegs bei Metro, Aldi etc.                    |

---

## 3. Module (Hauptbereiche der App)

```
┌─────────────────────────────────────────────────────────┐
│                    KÜCHEN-APP                           │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ 📅       │ 📖       │ 🛒       │ 📦       │ 👥         │
│ Speise-  │ Rezepte  │ Einkauf  │ Lager    │ Gruppen    │
│ plan     │         │ liste    │ bestand  │ verwaltung │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

---

## 4. Modul-Spezifikation

### 4.1 Speiseplan (Kalender)

**Ansicht:** Wochenkalender mit 4 Zeilen pro Tag + optionalen Specials

```
         Mo 02.08        Di 03.08        Mi 04.08   ...
──────────────────────────────────────────────────────────
🌅 Früh  [🟠 Rührei]    [🟠 Standard]  [🟠 Standard]
🍽 Mittag [🟢 Chili]    [🟢 Käsespätz] [🟢 Schnitzel]
🍎 Nach.  [🟣 Obst]     [🟣 Obst]      [🟣 Kuchen]
🌙 Abend  [🔵 Standard] [🔵 Standard]  [🔵 Standard]
⭐ Special [🟡 Geburts-  —              [🟡 Lager-
           tagskuchen]                   feuer-Snack]
```

**Farbcodierung nach Mahlzeittyp (fix, immer sichtbar):**

| Farbe     | Mahlzeit           | Erklärung                   |
| --------- | ------------------ | --------------------------- |
| 🟠 Orange | Frühstück          | Morgen-Energie              |
| 🟢 Grün   | Mittagessen        | Hauptmahlzeit des Tages     |
| 🟣 Lila   | Nachmittag / Snack | Zwischenmahlzeit            |
| 🔵 Blau   | Abendessen         | Abend-Routine               |
| 🟡 Gelb   | Special            | Besondere Mahlzeit / Extras |

Innerhalb jeder farbigen Zelle zeigt ein kleines Icon den Bearbeitungsstatus:

- ○ leer / noch nicht geplant
- ● geplant
- ⚙ in Vorbereitung
- ✓ gekocht

**Specials — ein oder mehrere pro Tag:**

- Jeder Tag kann beliebig viele Specials erhalten (z. B. Geburtstagskuchen, Lagerfeuer-Snack, Mitternachts-Überraschung)
- Special hinzufügen: „+ Special" Button unter den vier Standardmahlzeiten
- Jedes Special hat: Name / Rezept-Verknüpfung (optional), Uhrzeit (optional), Notiz, Status (wie Standardmahlzeiten)
- Specials fließen in Einkaufsliste und Lagerabzug ein (sofern mit Rezept verknüpft)
- Specials werden in der Wochenübersicht als kompakte Chips unter den Tages-Mahlzeiten angezeigt

**Weitere Funktionen:**

- Tippen auf eine Zelle → Rezept auswählen oder neu erstellen
- Notizfeld pro Mahlzeit (z. B. „Veggie-Option: Gemüsebolognese")
- Vegetarische Alternative parallel eintragen
- Ansicht als Liste oder als Kalender umschaltbar

**Aus Euren Dokumenten übernehmen:**

- Frühstück ist immer gleich (Standard-Vorlage nach „Gudruns heiligem Zettel")
- Abendessen fast immer Brot/Wurst/Käse (Standard-Vorlage)
- Nur Mittagessen variiert täglich → Hauptfokus der Planung
- Specials für Geburtstage, Lagerfeuerabende, spontane Extras

---

### 4.2 Rezeptverwaltung

**Rezept-Datenstruktur:** Jedes Gericht kann eine Fleisch- und eine vegetarische Version haben, die jeweils eigene Zutaten besitzen. Die Personenzahl wird automatisch aus der Gruppenstruktur übernommen (Fleischesser → Fleischversion, Vegetarier → veggie Version).

```
Rezept: Chili
├── Kategorien: Hauptgericht
├── Allergene: [Sellerie]
├── Tags: [Schnell, Günstig]
│
├── Version A – MIT Fleisch (für 60 Personen, aus Gruppe)
│   ├── Hackfleisch gemischt: 10,5 kg
│   ├── Passierte Tomaten: 5,25 l
│   ├── Rote Bohnen: 1,75 kg
│   └── ... (alle Zutaten skalierbar)
│
└── Version B – VEGETARISCH (für 21 Personen, aus Gruppe)
    ├── Passierte Tomaten: 2 l
    ├── Rote Bohnen: 625 g
    └── ... (eigene Zutatenliste)
```

**Personenanzahl aus Gruppenstruktur:**
Die App liest automatisch aus der Gruppenstruktur (Modul 4.5) aus, wie viele Personen Fleischesser und wie viele Vegetarier sind. Beim Öffnen eines Rezepts sind diese Zahlen bereits vorausgefüllt — sie können für einzelne Gerichte manuell überschrieben werden (z. B. wenn ein Teil der Gruppe an dem Tag nicht dabei ist).

**Funktionen:**

- Skalierungs-Slider: Personenzahl anpassen → alle Mengen beider Versionen werden angepasst
- Fleisch- und vegetarische Version in einer Ansicht, umschaltbar
- Rezept bearbeiten: jede Zutat, Menge, Einheit und Zubereitung ist editierbar
- Rezept löschen: mit Bestätigungsdialog (wird auch aus dem Speiseplan entfernt)
- Import aus vorhandenen Word-Dokumenten als Vorlage (einmalig beim Setup)
- Nährwertanzeige (via Claude API, siehe Modul 4.6)
- Rezept-Bibliothek mit Suchfunktion und Filterung nach Tags und Allergenen

---

### 4.3 Einkaufsliste

**Automatische Generierung:**

1. Alle Rezepte der Woche → Zutaten werden summiert und nach Kategorien zusammengefasst
2. Lagerbestand wird abgezogen (was schon da ist, muss nicht gekauft werden)
3. Ergebnis: vollständige, kategorisierte Einkaufsliste

**Kategorien (wie in Euren Dokumenten):**

- 🧴 Öle & Essige
- 🧂 Gewürze & Würzmittel
- 🍞 Back- & Trockenwaren
- 🥩 Fleisch & Fisch
- 🥛 Milchprodukte
- 🥦 Obst & Gemüse
- 🥫 Konserven
- 🧹 Reinigungsmittel & Sonstiges

**Einkaufsansicht (mobil):**

```
🛒 Einkaufsliste – Metro Lieferung Mo 04.08
──────────────────────────────────────────
🧴 Öle & Essige
  ☐ Sonnenblumenöl     5 Flaschen
  ☑ Olivenöl           4 l          ← bereits abgehakt
  ☐ Balsamico hell     2 Flaschen

🥩 Fleisch & Fisch
  ☐ Hackfleisch        10,5 kg
  ☐ Putenschnitzel     85 Stück
```

**Weitere Funktionen:**

- Teilen als PDF oder per Link (für Lieferbestellung an Metro)
- Notizfeld pro Position (z. B. „glutenfrei beachten!")
- Mehrere Einkaufslisten parallel (z. B. Metro-Lieferung + Aldi-Einkauf)
- Manuelles Hinzufügen von Positionen

---

### 4.4 Lagerverwaltung

**Konzept:** Perpetuelles Inventar — jede Bewegung wird erfasst

```
Lagerbewegungen:
  [+] Einkauf einbuchen      → erhöht Bestand
  [-] Verbrauch eintragen    → verringert Bestand
  [🍳] Gericht als gekocht  → verringert automatisch Bestand
       markieren               (Rezept-Zutaten werden abgezogen)
```

**Lagerübersicht mit vorausschauender Engpasswarnung:**

Die App berechnet nicht nur den aktuellen Bestand, sondern simuliert auch den zukünftigen Verbrauch auf Basis aller noch geplanten Gerichte im Speiseplan. In der Übersicht ist auf einen Blick sichtbar, welche Vorräte bei aktuellem Bestand nicht bis zum Ende der Woche reichen.

```
Produkt          Bestand   Noch benötigt  Verbleibt  Status
─────────────────────────────────────────────────────────────
Hackfleisch      3,5 kg    10,5 kg        -7,0 kg    🔴 Engpass!
Emmentaler       9,0 kg     7,1 kg        +1,9 kg    🟢 OK
Spätzle          8,0 kg    10,7 kg        -2,7 kg    🟠 Knapp
Tomatenpassata   4,2 l      4,2 l          0,0 l     🟡 Exakt
Sonnenblumenöl   5 Fl.      3 Fl.         +2 Fl.     🟢 OK
```

Farb-Ampel:

- 🔴 Engpass: Bestand reicht definitiv nicht — Nachkauf nötig
- 🟠 Knapp: Bestand reicht gerade so, kein Puffer — Aufmerksamkeit empfohlen
- 🟡 Exakt: Bestand reicht genau, kein Spielraum
- 🟢 OK: Bestand reicht mit Puffer

Tippen auf eine Zeile → Detail-Ansicht zeigt, welche Gerichte an welchem Tag diese Zutat verbrauchen.

**Funktionen:**

- Manuelle Buchungen: Einkauf buchen, Verbrauch buchen, Korrektur buchen
- Wenn Gericht als „gekocht" markiert → Zutaten automatisch abbuchen
- Vorausschauende Engpassberechnung: alle zukünftigen Speiseplan-Einträge werden simuliert
- Direktlink von Engpass-Warnung zur Einkaufsliste (fehlende Menge wird automatisch ergänzt)
- Buchungshistorie (wer hat wann was gebucht)
- Inventur-Modus: tatsächliche Bestände eintippen → Differenzen werden angezeigt

---

### 4.5 Gruppenverwaltung

**Personengruppen definieren:** Jede Person (bzw. Personengruppe) wird mit Altersklasse, Geschlecht, Ernährungsform und Unverträglichkeiten erfasst.

```
Lager 2025 – Gruppenstruktur:
├── Kinder (7–13 Jahre)
│   ├── Mädchen: 28  │ davon vegetarisch: 8  │ davon glutenfrei: 1
│   └── Jungs: 26    │ davon vegetarisch: 5  │ davon laktosefrei: 1
├── Jugendliche (14–17 Jahre)
│   ├── Mädchen: 6   │ davon vegetarisch: 4  │
│   └── Jungs: 6     │ davon vegetarisch: 2  │
└── Erwachsene (18+)
    ├── Frauen: 8    │ davon vegetarisch: 2  │ davon glutenfrei: 1
    └── Männer: 7    │ davon vegetarisch: 0  │

Zusammenfassung (automatisch berechnet):
├── Fleischesser: 60
├── Vegetarisch: 21
├── Glutenfrei: 2
└── Laktosefrei: 1
```

**Unterstützte Unverträglichkeiten & Ernährungsformen:**

- Vegetarisch / Vegan
- Glutenunverträglichkeit (Zöliakie)
- Laktoseintoleranz
- Nussallergie
- Weitere können frei hinzugefügt werden

**Automatische Rezept-Prüfung:**

Sobald die Gruppenstruktur gepflegt ist, analysiert die App automatisch alle Rezepte im Speiseplan und markiert Konflikte:

```
⚠️  Konflikt-Übersicht Speiseplan KW 31:

Dienstag Mittag – Käsespätzle:
  🔴 Glutenfrei: Spätzle enthalten Gluten (2 Personen betroffen)
     → Alternativgericht nötig oder glutenfreie Spätzle einkaufen

Mittwoch Mittag – Schnitzel mit Kartoffelsalat:
  🟡 Vegetarisch: Fleischversion vorhanden ✓
  🔴 Laktosefrei: Schmand in Kartoffelsalat (1 Person betroffen)
     → Alternative: Schmand durch laktosefreie Variante ersetzen

Freitag Mittag – Pizzaabend:
  🟢 Alle Gruppen abgedeckt ✓
```

**Warum wichtig:** Die Gruppenstruktur ist die zentrale Datenbasis für drei Kernfunktionen: Mengenberechnung via Claude API, automatische Rezept-Prüfung auf Unverträglichkeiten, und die korrekte Aufteilung der Rezept-Versionen (Fleisch / vegetarisch).

---

### 4.6 KI-Integration (Claude API)

Die Claude API wird für zwei Funktionen eingesetzt, die auf derselben Infrastruktur aufbauen: Rezeptvorschläge beim Anlegen neuer Rezepte und Mengenberechnung für bestehende Rezepte.

---

#### 4.6.1 Rezeptvorschlag beim Anlegen (✨ Neu)

**Ablauf:**

1. Nutzer tippt beim Anlegen eines neuen Rezepts nur den Gerichtsnamen ein (z. B. „Ofengemüse")
2. Nutzer klickt „✨ Rezept vorschlagen lassen"
3. App sendet an Claude API:
   - Den Gerichtsnamen
   - Lager-Kontext (~80 Personen, Zeltlager-Küche)
   - Gruppenstruktur (Anzahl Fleischesser / Vegetarier)
   - Anforderung: strukturiertes JSON im App-Datenformat
4. Claude generiert:
   - Vollständiges Rezept mit Fleisch- und vegetarischer Version
   - Zutaten mit Mengen pro Person (für Skalierungs-Slider)
   - Zubereitungsschritte in Lager-gerechter Sprache
   - Allergene automatisch erkannt und getaggt
5. Nutzer sieht Vorschlag-Screen, tippt „Übernehmen" und kann alle Felder danach noch manuell anpassen

**Beispiel:**

```
Eingabe: „Ofengemüse"

✨ Rezeptvorschlag von Claude:

Rezept: Ofengemüse
Kategorie: Hauptgericht / Beilage
Allergene: keines
Tags: [Vegetarisch, Günstig, Vegan möglich]

Version A – MIT Fleisch (für 60 Personen)
  Hähnchenschenkel:     9,0 kg
  Paprika (gemischt):   5,0 kg
  Zucchini:             4,0 kg
  Kartoffeln:           8,0 kg
  Olivenöl:             0,6 l
  Gewürze:              nach Bedarf

Version B – VEGETARISCH (für 21 Personen)
  Paprika (gemischt):   2,0 kg
  Zucchini:             1,5 kg
  Kartoffeln:           3,0 kg
  Kichererbsen (Dose):  2,5 kg
  Olivenöl:             0,25 l
  Gewürze:              nach Bedarf

Zubereitung: Gemüse in grobe Stücke schneiden, mit Öl
und Gewürzen mischen, bei 200°C ca. 35–40 Min. im Ofen
garen. Für die Fleischversion Hähnchenschenkel separat
würzen und gemeinsam im Ofen garen.

[Übernehmen]  [Nochmal vorschlagen]  [Manuell eingeben]
```

---

#### 4.6.2 Mengenberechnung für bestehende Rezepte

**Ablauf:**

1. Nutzer wählt Gericht und klickt „Menge berechnen"
2. App sendet an Claude API:
   - Rezept (Zutaten und Zubereitung)
   - Gruppenstruktur (Alter, Geschlecht, Anzahl)
   - Mahlzeittyp (Frühstück / Hauptmahlzeit / Snack)
   - Eventuelle Hinweise (z. B. „Sporttag", „Wanderung")
3. Claude berechnet:
   - Kalorienbedarf der Gesamtgruppe
   - Empfohlene Gesamtmenge pro Zutat
   - Nährwertübersicht (Kalorien, Protein, Kohlenhydrate, Fett)
   - Hinweis auf Anpassungen (z. B. Vegetarier-Portion)

**Beispiel-Output der KI:**

```
📊 Mengenempfehlung: Käsespätzle für 81 Personen
(60 Fleischesser · 21 Vegetarier)

Kalorienbedarf gesamt: ~6.800 kcal (Mittagessen, aktiver Tag)
Käsespätzle liefert: ~850 kcal pro Portion

Empfohlene Mengen:
• Spätzle (trocken):   10,7 kg  ✓ (Euer Rezept: 10,7 kg — passt!)
• Schmand:              4,75 kg
• Emmentaler:           7,1 kg
• Zwiebeln:             17 Stück

Hinweis: Bei einer Wanderung am selben Tag +15% einplanen.
```

---

## 5. Datenmodell (vereinfacht)

```
PersonGruppe
├── id, name, count
├── ageRange (kind/jugend/erwachsen)
├── gender (m/f/diverse)
├── isVegetarian (Boolean)
└── intolerances: [glutenfrei, laktosefrei, nussallergie, ...]

Rezept
├── id, name, category, tags
├── cookingTime, notes
├── allergens: [gluten, laktose, nüsse, ...]
├── versionen:
│   ├── MIT_FLEISCH: [{ ingredient_id, amountPerPerson, unit }]
│   └── VEGETARISCH: [{ ingredient_id, amountPerPerson, unit }]
└── personCount (wird aus Gruppenstruktur übernommen, überschreibbar)

Ingredient (Zutat/Lagerartikel)
├── id, name, unit, category
├── allergens: [gluten, laktose, ...]
├── currentStock (Float)
└── projectedStock (Float, berechnet aus Speiseplan)

Speiseplan-Eintrag
├── date, mealTime (fruehstueck/mittag/nachmittag/abend/special)
├── recipe_id (optional bei Specials)
├── specialName (nur bei mealTime = special, z. B. „Geburtstagskuchen")
├── specialTime (optional, Uhrzeit als String, z. B. „21:00")
├── sortOrder (Integer, Reihenfolge bei mehreren Specials pro Tag)
├── personCountMeat (aus Gruppe, überschreibbar)
├── personCountVeggie (aus Gruppe, überschreibbar)
├── status (leer/geplant/vorbereitet/gekocht)
└── notes

Lagerbewegung
├── ingredient_id, amount, direction (+/-)
├── type (einkauf/verbrauch/korrektur/gericht_gebucht/spende)
├── reference_id (z. B. Speiseplan-Eintrag)
├── timestamp, userId
└── notes

Einkaufsliste
├── generatedFrom: [speiseplan_entry_id, ...]
├── status (offen/in_bearbeitung/abgeschlossen)
├── type (metro_lieferung/vor_ort_einkauf/sonstiges)
└── Positionen: [{ ingredient_id, amountTotal, checked, notes }]
   (Fleisch- und Veggie-Mengen werden zusammengeführt)
```

---

## 6. Technologie-Empfehlung

### Progressive Web App (PWA) — Festgelegte Architektur

**Warum PWA:** Läuft auf iPad, iPhone und Laptop gleichermaßen im Browser, kein App-Store nötig, optimiert für Touch-Bedienung auf mobilen Geräten, offline-fähig beim Einkaufen.

| Schicht       | Technologie                                  | Begründung                                   |
| ------------- | -------------------------------------------- | -------------------------------------------- |
| Frontend      | React + TypeScript                           | Komponentenbasiert, Touch-optimiert          |
| UI-Framework  | shadcn/ui + Tailwind CSS                     | Mobile-first, responsive                     |
| Backend       | Node.js + Express                            | Einfach, gut skalierbar                      |
| Datenbank     | PostgreSQL                                   | Mehrbenutzer-fähig, Echtzeit-Sync            |
| Echtzeit-Sync | WebSockets (z. B. Socket.io)                 | Gleichzeitige Nutzung durch mehrere Personen |
| KI            | Claude API (claude-sonnet-4-6)               | Mengenberechnung, Nährwerte, Rezeptprüfung   |
| Hosting       | Vercel (Frontend) + Railway/Render (Backend) | Über Internet erreichbar, kostengünstig      |
| Offline       | PWA Service Worker + IndexedDB               | Einkaufsliste funktioniert ohne Empfang      |

**Mobile-Optimierung:** Die gesamte UI ist primär für Touchscreen ausgelegt. Große Buttons, einfache Navigation, Einkaufsliste mit einem Fingertipp abhakbar. Desktop-Ansicht bietet zusätzlich mehr Übersicht beim Speiseplan (breitere Wochenansicht).

---

## 7. Screens & Navigation

```
[Dashboard]
  ↓ Überblick: nächste Mahlzeit · Lager-Engpässe · Unverträglichkeits-Warnungen · offene Einkaufsliste

[Speiseplan]  ← Hauptbildschirm
  → Wochenansicht / Tagesansicht
  → Farbcodierung: Orange (Früh) · Grün (Mittag) · Lila (Nachm.) · Blau (Abend) · Gelb (Special)
  → Tippen auf Mahlzeit → Rezept wählen / bearbeiten
  → „+ Special" pro Tag → Name, Uhrzeit, Rezept (optional) hinzufügen
  → Mehrere Specials pro Tag möglich, als Chips in der Tagesansicht
  → Warnsymbol bei Konflikten (Unverträglichkeiten / Lagerengpass)
  → Status-Icon in der Zelle: leer · geplant · in Vorbereitung · gekocht
  → „Menge berechnen" → Claude API
  → „Als gekocht markieren" → Lager wird abgebucht

[Rezepte]
  → Liste / Suche / Filter (nach Tags, Allergenen, vegetarisch)
  → Rezept-Detail: Fleisch- und Veggie-Version umschaltbar
  → Personenzahl vorausgefüllt aus Gruppenstruktur, anpassbar
  → Rezept bearbeiten / löschen

[Einkaufsliste]
  → Automatisch generiert aus Speiseplan
  → Fleisch- und Veggie-Mengen zusammengeführt
  → Kategorisiert, mit einem Tippen abhakbar
  → "Als PDF exportieren" (für Metro-Bestellung)

[Lager]
  → Aktuelle Bestände mit vorausschauender Engpassanzeige (Ampel)
  → Tippen auf Artikel → Detail: welche Gerichte verbrauchen wie viel wann?
  → "+ Einkauf buchen" / "- Verbrauch buchen"
  → Buchungshistorie

[Gruppen & Personen]  (früher: Einstellungen)
  → Altersgruppen, Geschlecht, Personenzahlen pflegen
  → Ernährungsform pro Gruppe: Fleisch / Vegetarisch
  → Unverträglichkeiten: Gluten, Laktose, Nüsse, weitere
  → Konflikt-Übersicht: welche Gerichte im Speiseplan sind problematisch?

[Einstellungen]
  → Lager-Zeitraum definieren
  → Kalkulations-Puffer einstellen (dynamisch, Standard: +15%)
  → Standardpläne einrichten (Frühstück/Abendessen-Vorlagen)
  → Benutzer verwalten (Küchenchef / Köchin / Einkäufer)
```

---

## 8. Besondere Features für den Lagerbetrieb

### Standard-Mahlzeiten-Vorlagen

Frühstück und Abendessen sind fast täglich identisch → einmal als Vorlage anlegen, automatisch in jeden Tag einsetzen. Gudruns heiliger Zettel wird zur App-Vorlage!

### Metro-Bestellliste Export

Export der Einkaufsliste im Format, das direkt an die Metro-Ansprechpartner gesendet werden kann — vorformatiert wie die bestehenden Word-Dokumente.

### Spenden-Tracking

Essensspenden (Müsli, Nutella, Kuchen, etc.) können eingebucht werden und verringern die Einkaufsliste automatisch.

### Offline-Modus

Beim Einkaufen gibt es oft kein gutes Mobilfunknetz. Die App muss offline funktionieren und sich synchronisieren, sobald wieder Empfang da ist.

### Allergene & Unverträglichkeiten

Jedes Rezept und jede Zutat ist mit Allergenen getaggt. Die App warnt, wenn ein geplantes Gericht Allergene enthält, die in der Gruppe vorkommen.

---

## 9. Entwicklungs-Roadmap

### Phase 1 – MVP (2–3 Wochen)

- Speiseplan-Kalender (CRUD)
- Rezeptverwaltung: Fleisch- und Veggie-Version pro Rezept
- Gruppenstruktur: Alter, Geschlecht, Vegetarisch, Unverträglichkeiten
- Einfache Lagerverwaltung (Bestände manuell eintragen)
- Benutzerauthentifizierung (Küchenchef / Köchin / Einkäufer)

### Phase 2 – Kern-Features (2 Wochen)

- Automatische Einkaufslisten-Generierung (Fleisch + Veggie zusammengeführt)
- Lager-Abbuchung wenn Gericht als „gekocht" markiert wird
- Vorausschauende Engpasswarnung (Lager vs. Speiseplan simulieren)
- Claude API Integration (Mengenberechnung, Nährwerte)
- Echtzeit-Sync zwischen mehreren Nutzern (WebSockets)
- PDF-Export für Metro-Bestellung

### Phase 3 – Polish (1 Woche)

- Offline-Modus (PWA Service Worker + IndexedDB)
- Konflikt-Übersicht: Rezepte vs. Unverträglichkeiten im Speiseplan
- Standardvorlagen (Frühstück/Abendessen nach Gudrun's Zettel)
- Import bestehender Rezepte aus Word-Dokumenten als Vorlage
- Kalkulations-Puffer dynamisch einstellbar (Standard: +15%)

### Phase 4 – Optional / Zukunft

- Foto-Upload für Gerichte
- Jahresvergleich (was haben wir letztes Jahr gekauft / was war zu viel?)
- Spenden-Tracking (Essensspenden einbuchen → Einkaufsliste reduziert sich)

---

## 10. Architekturentscheidungen (geklärt)

| Thema                   | Entscheidung                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| **Plattform**           | PWA, optimiert für mobile Geräte (iPad, iPhone), voll funktionsfähig auch auf dem Laptop             |
| **Mehrere Nutzer**      | Ja — Echtzeit-Sync per WebSockets, mehrere Personen können gleichzeitig arbeiten                     |
| **Datenpersistenz**     | Über das Internet (Cloud-Hosting), von überall erreichbar                                            |
| **Rezept-Import**       | Bestehende Word-Dokumente werden als Vorlage importiert (einmalig beim Setup, dann manuell anpassen) |
| **Kalkulations-Puffer** | Dynamisch einstellbar in den Einstellungen (Standard: +15%, war bisher fest ~95 Personen)            |
| **Einkaufsliste**       | Fleisch- und Veggie-Mengen werden zusammengeführt (eine Position pro Zutat, Gesamtmenge)             |

---

_Dokument erstellt auf Basis der vorliegenden KJG-Küchendokumente 2025 · Zuletzt aktualisiert: Mai 2026_
