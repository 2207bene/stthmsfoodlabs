import { PrismaClient } from '../../node_modules/.prisma/client/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load DATABASE_URL from apps/web/.env.local if not already set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '../../apps/web/.env.local')
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const [key, ...vals] = line.split('=')
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '')
      }
    }
  } catch {}
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

const r = (n) => Math.round(n * 10000) / 10000

const P_MEAT   = 70
const P_VEGGIE = 25
const P_ALL    = 95

async function ing(name, unit, category, allergens = '') {
  const ex = await prisma.ingredient.findFirst({ where: { name } })
  if (ex) return ex
  return prisma.ingredient.create({ data: { name, unit, category, allergens } })
}

async function main() {
  console.log('🧹 Clearing existing data...')
  await prisma.shoppingListItem.deleteMany({})
  await prisma.shoppingList.deleteMany({})
  await prisma.mealPlanEntry.deleteMany({})
  await prisma.stockMovement.deleteMany({})
  await prisma.recipeIngredient.deleteMany({})
  await prisma.recipeVersion.deleteMany({})
  await prisma.recipe.deleteMany({})
  await prisma.ingredient.deleteMany({})

  // ── Zutaten ──────────────────────────────────────────────────────────────
  console.log('🥕 Creating ingredients...')
  const I = {
    milch:               await ing('Milch',                          'l',         'Milchprodukte',  'Milch'),
    hafermilch:          await ing('Hafermilch',                     'l',         'Milchprodukte'),
    brotback:            await ing('Brotbackmischung',               'kg',        'Backwaren',      'Gluten'),
    quarkJoghurt:        await ing('Quark / Joghurt',                'kg',        'Milchprodukte',  'Milch'),
    quark:               await ing('Quark (Natur)',                   'kg',        'Milchprodukte',  'Milch'),
    aepfel:              await ing('Äpfel',                          'Stück',     'Obst'),
    bananen:             await ing('Bananen',                        'Stück',     'Obst'),
    nektarinen:          await ing('Nektarinen',                     'Stück',     'Obst'),
    wurst:               await ing('Aufschnitt Wurst',               'kg',        'Fleisch'),
    kaese:               await ing('Käse (Scheiben)',                 'kg',        'Milchprodukte',  'Milch'),
    hackfleisch:         await ing('Hackfleisch (gemischt)',          'kg',        'Fleisch'),
    zwiebeln:            await ing('Zwiebeln',                       'Stück',     'Gemüse'),
    knoblauch:           await ing('Knoblauchzehen',                 'Stück',     'Gemüse'),
    passTomaten:         await ing('Passierte Tomaten',              'l',         'Konserven'),
    stueckTomaten:       await ing('Stückige Tomaten',               'l',         'Konserven'),
    tomatenmark:         await ing('Tomatenmark',                    'kg',        'Konserven'),
    chilisauce:          await ing('Hot Chilli Soße',                'l',         'Saucen'),
    roteBohnen:          await ing('Rote Bohnen (netto)',             'kg',        'Konserven'),
    mais:                await ing('Mais (netto)',                   'kg',        'Konserven'),
    schlangengurke:      await ing('Schlangengurken',                'Stück',     'Gemüse'),
    rotePaprika:         await ing('Rote Paprika',                   'Stück',     'Gemüse'),
    saureSahne:          await ing('Saure Sahne',                    'l',         'Milchprodukte',  'Milch'),
    baguette:            await ing('Aufbackbaguette (groß)',          'Stück',     'Backwaren',      'Gluten'),
    spaetzle:            await ing('Spätzle (trocken)',              'kg',        'Nudeln',         'Gluten,Ei'),
    schmand:             await ing('Schmand',                        'kg',        'Milchprodukte',  'Milch'),
    sahne:               await ing('Sahne',                          'l',         'Milchprodukte',  'Milch'),
    emmentaler:          await ing('Emmentaler (gerieben)',           'kg',        'Milchprodukte',  'Milch'),
    sauerrahm:           await ing('Sauerrahm',                      'l',         'Milchprodukte',  'Milch'),
    dill:                await ing('Dill',                           'Packungen', 'Gewürze'),
    dosenmandarinen:     await ing('Dosenmandarinen (netto)',         'kg',        'Konserven'),
    zucker:              await ing('Zucker',                         'kg',        'Trockenwaren'),
    vanillezucker:       await ing('Vanillezucker',                  'Packungen', 'Trockenwaren'),
    putenbrust:          await ing('Putenbrust',                     'kg',        'Fleisch'),
    kokosmilch:          await ing('Kokosmilch',                     'l',         'Konserven'),
    currypaste:          await ing('Currypaste rot',                 'Glas',      'Saucen'),
    joghurt:             await ing('Joghurt (natur)',                'l',         'Milchprodukte',  'Milch'),
    brokkoli:            await ing('Brokkoli',                       'Stück',     'Gemüse'),
    paprikaRot:          await ing('Paprika rot',                    'Stück',     'Gemüse'),
    paprikaGelb:         await ing('Paprika gelb',                   'Stück',     'Gemüse'),
    karotten:            await ing('Karotten',                       'kg',        'Gemüse'),
    fruehlingszwiebeln:  await ing('Frühlingszwiebeln',              'Stück',     'Gemüse'),
    parbreis:            await ing('Parboiled Reis',                 'kg',        'Trockenwaren'),
    mousseChoc:          await ing('Mousse au Chocolat (Pulver)',     'kg',        'Trockenwaren'),
    couscous:            await ing('Couscous',                       'kg',        'Trockenwaren',   'Gluten'),
    zucchini:            await ing('Zucchini',                       'Stück',     'Gemüse'),
    suesskartoffeln:     await ing('Süßkartoffeln',                  'Stück',     'Gemüse'),
    olivenoel:           await ing('Olivenöl',                       'l',         'Öle'),
    champignons:         await ing('Champignons (frisch)',            'kg',        'Gemüse'),
    parmesan:            await ing('Parmesan (gerieben)',             'kg',        'Milchprodukte',  'Milch'),
    eisbergsalat:        await ing('Eisbergsalat',                   'Stück',     'Gemüse'),
    apfelmus:            await ing('Apfelmus',                       'kg',        'Konserven'),
    haselnusskrokant:    await ing('Haselnusskrokant / Mandeln',      'kg',        'Trockenwaren',   'Nüsse'),
    knoedelBrot:         await ing('Knödelbrot',                     'kg',        'Backwaren',      'Gluten'),
    mehl:                await ing('Mehl',                           'kg',        'Trockenwaren',   'Gluten'),
    eier:                await ing('Eier',                           'Stück',     'Milchprodukte',  'Ei'),
    griess:              await ing('Grieß',                          'kg',        'Trockenwaren',   'Gluten'),
    petersilie:          await ing('Petersilie',                     'kg',        'Gewürze'),
    dosenchampignons:    await ing('Dosenchampignons (netto)',        'kg',        'Konserven'),
    maracujasaft:        await ing('Maracujasaft',                   'l',         'Getränke'),
    dosenpfirsiche:      await ing('Dosenpfirsiche (netto)',          'kg',        'Konserven'),
    vanillesossenpulver: await ing('Vanillesoßenpulver (ohne Kochen)','Packungen','Trockenwaren'),
    schnitzel:           await ing('Puten- / Schweineschnitzel',      'Stück',     'Fleisch'),
    semmelbrosel:        await ing('Semmelbrösel',                   'kg',        'Backwaren',      'Gluten'),
    butterschmalz:       await ing('Butterschmalz',                  'kg',        'Milchprodukte',  'Milch'),
    austernpilze:        await ing('Austernpilze',                   'Stück',     'Gemüse'),
    kartoffeln:          await ing('Kartoffeln',                     'kg',        'Gemüse'),
    kopfsalat:           await ing('Kopfsalat',                      'Stück',     'Gemüse'),
    griechJoghurt:       await ing('Griechischer Joghurt',           'kg',        'Milchprodukte',  'Milch'),
    pistazienkerne:      await ing('Pistazienkerne (gehackt)',        'kg',        'Trockenwaren',   'Nüsse'),
    honig:               await ing('Flüssiger Honig',                'kg',        'Süßungsmittel'),
    cantaloupeMelone:    await ing('Cantaloupe-Melonen',             'Stück',     'Obst'),
    spaghetti:           await ing('Spaghetti',                      'kg',        'Nudeln',         'Gluten'),
    sellerie:            await ing('Selleriestangen',                'Stück',     'Gemüse'),
    weisswein:           await ing('Weißwein',                       'l',         'Getränke'),
    rinderbruehe:        await ing('Rinderbrühe',                    'l',         'Saucen'),
    gemuesebruehe:       await ing('Gemüsebrühe',                    'l',         'Saucen'),
    linsen:              await ing('Linsen',                         'kg',        'Hülsenfrüchte'),
    kirschtomaten:       await ing('Kirschtomaten',                  'kg',        'Gemüse'),
    passata:             await ing('Passata',                        'l',         'Konserven'),
    nudelteig:           await ing('Nudelteig (Rollen)',             'Stück',     'Backwaren',      'Gluten,Ei'),
    braet:               await ing('Brät',                           'kg',        'Fleisch'),
    spinat:              await ing('Spinat (TK)',                    'kg',        'Gemüse'),
    schafskäse:          await ing('Schafskäse',                     'kg',        'Milchprodukte',  'Milch'),
    butter:              await ing('Butter',                         'kg',        'Milchprodukte',  'Milch'),
    bruehe:              await ing('Brühe',                          'l',         'Saucen'),
    // Abendessen-Extras
    frischkaese:         await ing('Frischkäse',                     'kg',        'Milchprodukte',  'Milch'),
    cremefraiche:        await ing('Crème fraîche',                  'kg',        'Milchprodukte',  'Milch'),
    mozzarella:          await ing('Mozzarella',                     'kg',        'Milchprodukte',  'Milch'),
    tomaten:             await ing('Tomaten (frisch)',                'Stück',     'Gemüse'),
    basilikum:           await ing('Basilikum (Topf)',                'Topf',      'Gewürze'),
    bockwurst:           await ing('Bockwürste',                     'Stück',     'Fleisch'),
    vegWurst:            await ing('Vegetarische Würste',             'Stück',     'Vegetarisch'),
    ketchup:             await ing('Tomatenketchup',                  'l',         'Saucen'),
    currypulver:         await ing('Currypulver',                    'kg',        'Gewürze'),
    baguettebroetchen:   await ing('Baguette-Brötchen',              'Stück',     'Backwaren',      'Gluten'),
  }
  console.log('✅ Ingredients created')

  // ── Rezepte ───────────────────────────────────────────────────────────────
  console.log('📋 Creating recipes...')

  // 1. Frühstück (Standard) – täglich, vegetarisch, alle 95 Personen
  const fruehstueck = await prisma.recipe.create({ data: {
    name: 'Frühstück (Standard)',
    category: 'Frühstück',
    tags: 'täglich,frühstück',
    isStandard: true,
    allergens: 'Gluten,Milch',
    notes: 'Tee: 24 l Wasser + 24 Teebeutel/Tag. Morgens warm und pur; nachmittags/abends mit Pulver (2–3 Packungen). Außerdem auf Tische: Margarine (1 Dose 250 g/Tisch), Marmelade (Förmchen), Nutella (1 Glas/Tisch), Kaba (Förmchen), Honigspender auf Buffet. Müsli nach Verfügbarkeit.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.milch.id,        amountPerPerson: r(10   / P_ALL), unit: 'l'     },
        { ingredientId: I.hafermilch.id,   amountPerPerson: r(2    / P_ALL), unit: 'l'     },
        { ingredientId: I.brotback.id,     amountPerPerson: r(2.5  / P_ALL), unit: 'kg'    },
        { ingredientId: I.quarkJoghurt.id, amountPerPerson: r(3    / P_ALL), unit: 'kg'    },
        { ingredientId: I.aepfel.id,       amountPerPerson: r(12   / P_ALL), unit: 'Stück' },
        { ingredientId: I.bananen.id,      amountPerPerson: r(7    / P_ALL), unit: 'Stück' },
        { ingredientId: I.nektarinen.id,   amountPerPerson: r(12   / P_ALL), unit: 'Stück' },
      ]}
    }]}
  }})

  // 2. Abendessen (Standard) – täglich, Fleisch + Veggie
  const abendessen = await prisma.recipe.create({ data: {
    name: 'Abendessen (Standard)',
    category: 'Abendessen',
    tags: 'täglich,abendessen',
    isStandard: true,
    allergens: 'Gluten,Milch',
    notes: 'Vegetarische Brotaufstriche auf das Buffet. Reste vom Mittagessen dazu stellen. Salate usw. als Extra. Abendliche ToDos: Brot backen, Tee aufkochen (Teebeutel über Nacht drin lassen), Zutaten für nächsten Tag raussuchen.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.wurst.id,    amountPerPerson: r(1.1 / P_MEAT), unit: 'kg' },
        { ingredientId: I.kaese.id,    amountPerPerson: r(1.5 / P_ALL),  unit: 'kg' },
        { ingredientId: I.brotback.id, amountPerPerson: r(3.5 / P_ALL),  unit: 'kg' },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.kaese.id,    amountPerPerson: r(1.5 / P_ALL),  unit: 'kg' },
        { ingredientId: I.brotback.id, amountPerPerson: r(3.5 / P_ALL),  unit: 'kg' },
      ]}},
    ]}
  }})

  // 3. Chili con Carne – Sa 02.08.2025
  const chili = await prisma.recipe.create({ data: {
    name: 'Chili con Carne',
    category: 'Mittagessen',
    tags: 'scharf,mexikanisch',
    allergens: 'Gluten,Milch',
    notes: 'Beilage: 36 Aufbackbaguette (groß) + 2× glutenfreies Baguette. Wassermelone: 3 Stück als Nachtisch.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.hackfleisch.id,    amountPerPerson: r(10.5   / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,       amountPerPerson: r(9      / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.knoblauch.id,      amountPerPerson: r(5      / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.passTomaten.id,    amountPerPerson: r(5.25   / P_MEAT),  unit: 'l'     },
        { ingredientId: I.stueckTomaten.id,  amountPerPerson: r(3.5    / P_MEAT),  unit: 'l'     },
        { ingredientId: I.tomatenmark.id,    amountPerPerson: r(0.175  / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.chilisauce.id,     amountPerPerson: r(4.4    / P_MEAT),  unit: 'l'     },
        { ingredientId: I.roteBohnen.id,     amountPerPerson: r(1.75   / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.mais.id,           amountPerPerson: r(1.75   / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.schlangengurke.id, amountPerPerson: r(5      / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.rotePaprika.id,    amountPerPerson: r(10     / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.saureSahne.id,     amountPerPerson: r(1.3    / P_MEAT),  unit: 'l'     },
        { ingredientId: I.baguette.id,       amountPerPerson: r(36     / P_ALL),   unit: 'Stück' },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.zwiebeln.id,       amountPerPerson: r(3      / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.knoblauch.id,      amountPerPerson: r(2      / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.passTomaten.id,    amountPerPerson: r(2      / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.stueckTomaten.id,  amountPerPerson: r(1.25   / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.tomatenmark.id,    amountPerPerson: r(0.0625 / P_VEGGIE), unit: 'kg'    },
        { ingredientId: I.chilisauce.id,     amountPerPerson: r(1.5    / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.roteBohnen.id,     amountPerPerson: r(0.625  / P_VEGGIE), unit: 'kg'    },
        { ingredientId: I.mais.id,           amountPerPerson: r(0.625  / P_VEGGIE), unit: 'kg'    },
        { ingredientId: I.schlangengurke.id, amountPerPerson: r(2      / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.rotePaprika.id,    amountPerPerson: r(3      / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.saureSahne.id,     amountPerPerson: r(0.45   / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.baguette.id,       amountPerPerson: r(36     / P_ALL),    unit: 'Stück' },
      ]}},
    ]}
  }})

  // 4. Käsespätzle – So 03.08.2025 (100 % veg, alle 95 P.)
  const kaesespaetzle = await prisma.recipe.create({ data: {
    name: 'Käsespätzle mit Gurkensalat und Mandarinenquark',
    category: 'Mittagessen',
    tags: 'vegetarisch,österreichisch',
    allergens: 'Gluten,Milch,Ei',
    notes: 'Für Gluten-Allergiker: glutenfreie Nudeln überbacken (noch klären). Brotbackmischung täglich: 6 kg gesamt (2,5 kg Frühstück + 3,5 kg Abendessen). Abends: Paprikacreme extra.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.spaetzle.id,       amountPerPerson: r(10.7  / P_ALL), unit: 'kg'       },
        { ingredientId: I.schmand.id,         amountPerPerson: r(4.75  / P_ALL), unit: 'kg'       },
        { ingredientId: I.sahne.id,           amountPerPerson: r(2.4   / P_ALL), unit: 'l'        },
        { ingredientId: I.emmentaler.id,      amountPerPerson: r(7.1   / P_ALL), unit: 'kg'       },
        { ingredientId: I.zwiebeln.id,        amountPerPerson: r(17    / P_ALL), unit: 'Stück'    },
        // Gurkensalat
        { ingredientId: I.schlangengurke.id,  amountPerPerson: r(25    / P_ALL), unit: 'Stück'    },
        { ingredientId: I.dill.id,            amountPerPerson: r(2     / P_ALL), unit: 'Packungen'},
        { ingredientId: I.sauerrahm.id,       amountPerPerson: r(2.4   / P_ALL), unit: 'l'        },
        // Mandarinenquark
        { ingredientId: I.quark.id,           amountPerPerson: r(6.75  / P_ALL), unit: 'kg'       },
        { ingredientId: I.milch.id,           amountPerPerson: r(2.8   / P_ALL), unit: 'l'        },
        { ingredientId: I.zucker.id,          amountPerPerson: r(0.45  / P_ALL), unit: 'kg'       },
        { ingredientId: I.dosenmandarinen.id, amountPerPerson: r(5     / P_ALL), unit: 'kg'       },
        { ingredientId: I.vanillezucker.id,   amountPerPerson: r(9     / P_ALL), unit: 'Packungen'},
      ]}
    }]}
  }})

  // 5. Curry mit Reis – Mo 04.08.2025
  const curry = await prisma.recipe.create({ data: {
    name: 'Curry mit Reis und Mousse au Chocolat',
    category: 'Mittagessen',
    tags: 'asiatisch,scharf',
    allergens: 'Milch',
    notes: 'Soßenbinder (Mondamin hell) und Gemüsebrühe vor Ort prüfen! 1–2 kg Cashewkerne optional. Gemüsebrühe bis ca. 6 l je nach Bedarf. Mousse au Chocolat: 2 Metro-Packungen (je 1 kg Pulver) + 5 l Milch = 116 Portionen. Limettensaft + Ingwer etwas mehr als bisher. Abends: Tomaten-Mozzarella extra.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.putenbrust.id,          amountPerPerson: r(8.75  / P_MEAT), unit: 'kg'    },
        { ingredientId: I.kokosmilch.id,          amountPerPerson: r(5.94  / P_MEAT), unit: 'l'     },
        { ingredientId: I.currypaste.id,          amountPerPerson: r(2.38  / P_MEAT), unit: 'Glas'  },
        { ingredientId: I.joghurt.id,             amountPerPerson: r(4.75  / P_MEAT), unit: 'l'     },
        { ingredientId: I.tomatenmark.id,         amountPerPerson: r(0.475 / P_MEAT), unit: 'kg'    },
        { ingredientId: I.brokkoli.id,            amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.paprikaRot.id,          amountPerPerson: r(11    / P_MEAT), unit: 'Stück' },
        { ingredientId: I.paprikaGelb.id,         amountPerPerson: r(11    / P_MEAT), unit: 'Stück' },
        { ingredientId: I.karotten.id,            amountPerPerson: r(3.5   / P_MEAT), unit: 'kg'    },
        { ingredientId: I.fruehlingszwiebeln.id,  amountPerPerson: r(3.5   / P_MEAT), unit: 'Stück' },
        { ingredientId: I.knoblauch.id,           amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.zwiebeln.id,            amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.parbreis.id,            amountPerPerson: r(6     / P_ALL),  unit: 'kg'    },
        { ingredientId: I.mousseChoc.id,          amountPerPerson: r(2     / P_ALL),  unit: 'kg'    },
        { ingredientId: I.milch.id,               amountPerPerson: r(5     / P_ALL),  unit: 'l'     },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.kokosmilch.id,          amountPerPerson: r(5.94  / P_MEAT), unit: 'l'     },
        { ingredientId: I.currypaste.id,          amountPerPerson: r(2.38  / P_MEAT), unit: 'Glas'  },
        { ingredientId: I.joghurt.id,             amountPerPerson: r(4.75  / P_MEAT), unit: 'l'     },
        { ingredientId: I.tomatenmark.id,         amountPerPerson: r(0.475 / P_MEAT), unit: 'kg'    },
        { ingredientId: I.brokkoli.id,            amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.paprikaRot.id,          amountPerPerson: r(11    / P_MEAT), unit: 'Stück' },
        { ingredientId: I.paprikaGelb.id,         amountPerPerson: r(11    / P_MEAT), unit: 'Stück' },
        { ingredientId: I.karotten.id,            amountPerPerson: r(3.5   / P_MEAT), unit: 'kg'    },
        { ingredientId: I.fruehlingszwiebeln.id,  amountPerPerson: r(3.5   / P_MEAT), unit: 'Stück' },
        { ingredientId: I.knoblauch.id,           amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.zwiebeln.id,            amountPerPerson: r(6     / P_MEAT), unit: 'Stück' },
        { ingredientId: I.parbreis.id,            amountPerPerson: r(6     / P_ALL),  unit: 'kg'    },
        { ingredientId: I.mousseChoc.id,          amountPerPerson: r(2     / P_ALL),  unit: 'kg'    },
        { ingredientId: I.milch.id,               amountPerPerson: r(5     / P_ALL),  unit: 'l'     },
      ]}},
    ]}
  }})

  // 6. Gefüllte Paprika – Di 05.08.2025 (100 % veg, alle 95 P.)
  const gefuelltePaprika = await prisma.recipe.create({ data: {
    name: 'Gefüllte Paprika mit Grünem Salat und Apfelschaum',
    category: 'Mittagessen',
    tags: 'vegetarisch',
    allergens: 'Gluten,Milch,Nüsse',
    notes: 'Morgens extra: Rührei (70 Eier). Beilage: 3 kg Reis. Brühe nach Bedarf ca. 2–3 l. 4–5 Packungen Sahnesteif für Apfelschaum. Besser Haselnusskrokant statt Mandeln. Abends: Paprikacreme extra.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.rotePaprika.id,        amountPerPerson: r(105  / P_ALL), unit: 'Stück'    },
        { ingredientId: I.couscous.id,           amountPerPerson: r(3.5  / P_ALL), unit: 'kg'       },
        { ingredientId: I.parbreis.id,           amountPerPerson: r(3    / P_ALL), unit: 'kg'       },
        { ingredientId: I.fruehlingszwiebeln.id, amountPerPerson: r(7    / P_ALL), unit: 'Stück'    },
        { ingredientId: I.zucchini.id,           amountPerPerson: r(12   / P_ALL), unit: 'Stück'    },
        { ingredientId: I.suesskartoffeln.id,    amountPerPerson: r(10   / P_ALL), unit: 'Stück'    },
        { ingredientId: I.olivenoel.id,          amountPerPerson: r(1.2  / P_ALL), unit: 'l'        },
        { ingredientId: I.stueckTomaten.id,      amountPerPerson: r(9.5  / P_ALL), unit: 'l'        },
        { ingredientId: I.champignons.id,        amountPerPerson: r(2.4  / P_ALL), unit: 'kg'       },
        { ingredientId: I.parmesan.id,           amountPerPerson: r(0.55 / P_ALL), unit: 'kg'       },
        { ingredientId: I.knoblauch.id,          amountPerPerson: r(10   / P_ALL), unit: 'Stück'    },
        // Grüner Salat
        { ingredientId: I.eisbergsalat.id,       amountPerPerson: r(9    / P_ALL), unit: 'Stück'    },
        // Apfelschaum
        { ingredientId: I.apfelmus.id,           amountPerPerson: r(9    / P_ALL), unit: 'kg'       },
        { ingredientId: I.sahne.id,              amountPerPerson: r(1.69 / P_ALL), unit: 'l'        },
        { ingredientId: I.vanillezucker.id,      amountPerPerson: r(6    / P_ALL), unit: 'Packungen'},
        { ingredientId: I.haselnusskrokant.id,   amountPerPerson: r(0.45 / P_ALL), unit: 'kg'       },
      ]}
    }]}
  }})

  // 7. Knödel mit Pilzsoße – Mi 06.08.2025 (100 % veg, alle 95 P.)
  const knoedel = await prisma.recipe.create({ data: {
    name: 'Knödel mit Pilzrahmsoße und Solero-Dessert',
    category: 'Mittagessen',
    tags: 'vegetarisch,bayerisch',
    allergens: 'Gluten,Milch,Ei',
    notes: 'Glutenfreie Alternative für Knödel klären (6 glutenfreie Knödel). Abends: Currywurst extra. Solero-Dessert: Minzblättchen zur Deko (ca. 1 Bund).',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        // Knödelmasse
        { ingredientId: I.knoedelBrot.id,       amountPerPerson: r(9.5           / P_ALL), unit: 'kg'       },
        { ingredientId: I.mehl.id,              amountPerPerson: r(1.78          / P_ALL), unit: 'kg'       },
        { ingredientId: I.eier.id,              amountPerPerson: r(59.5          / P_ALL), unit: 'Stück'    },
        { ingredientId: I.milch.id,             amountPerPerson: r(11.9          / P_ALL), unit: 'l'        },
        { ingredientId: I.griess.id,            amountPerPerson: r(0.594         / P_ALL), unit: 'kg'       },
        { ingredientId: I.petersilie.id,        amountPerPerson: r(0.95          / P_ALL), unit: 'kg'       },
        // Zwiebeln gesamt (Knödelmasse 9,5 + Pilzsoße 24 = 33,5)
        { ingredientId: I.zwiebeln.id,          amountPerPerson: r(33.5          / P_ALL), unit: 'Stück'    },
        // Pilzrahmsoße
        { ingredientId: I.dosenchampignons.id,  amountPerPerson: r(9.5           / P_ALL), unit: 'kg'       },
        { ingredientId: I.sahne.id,             amountPerPerson: r((4.75 + 1.13) / P_ALL), unit: 'l'        },
        { ingredientId: I.schmand.id,           amountPerPerson: r(3.5           / P_ALL), unit: 'kg'       },
        // Solero-Dessert
        { ingredientId: I.joghurt.id,           amountPerPerson: r(3.15     / P_ALL), unit: 'kg'       },
        { ingredientId: I.zucker.id,            amountPerPerson: r(0.18     / P_ALL), unit: 'kg'       },
        { ingredientId: I.vanillezucker.id,     amountPerPerson: r(5        / P_ALL), unit: 'Packungen'},
        { ingredientId: I.maracujasaft.id,      amountPerPerson: r(1.8      / P_ALL), unit: 'l'        },
        { ingredientId: I.dosenpfirsiche.id,    amountPerPerson: r(2.16     / P_ALL), unit: 'kg'       },
        { ingredientId: I.vanillesossenpulver.id,amountPerPerson: r(9       / P_ALL), unit: 'Packungen'},
      ]}
    }]}
  }})

  // 8. Schnitzel – Do 07.08.2025
  const schnitzelRezept = await prisma.recipe.create({ data: {
    name: 'Schnitzel mit Kartoffelsalat und Joghurt-Dessert',
    category: 'Mittagessen',
    tags: 'klassisch',
    allergens: 'Gluten,Milch,Ei,Nüsse',
    notes: 'Panade oder Schnitzel natur klären. Kartoffelsalat: Start mit ca. 1,4 l Brühe + 300–400 ml Öl, nach Schmatz-Test anpassen. Vegetarisch: Austernpilze paniert. Dessert: griech. Joghurt mit Cantaloupe-Melone, Pistazien, Honig.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.schnitzel.id,       amountPerPerson: r(85    / P_MEAT),  unit: 'Stück'    },
        { ingredientId: I.mehl.id,            amountPerPerson: r(1     / P_MEAT),  unit: 'kg'       },
        { ingredientId: I.sahne.id,           amountPerPerson: r(1     / P_MEAT),  unit: 'l'        },
        { ingredientId: I.eier.id,            amountPerPerson: r(18    / P_MEAT),  unit: 'Stück'    },
        { ingredientId: I.semmelbrosel.id,    amountPerPerson: r(3.5   / P_MEAT),  unit: 'kg'       },
        { ingredientId: I.butterschmalz.id,   amountPerPerson: r(4.5   / P_MEAT),  unit: 'kg'       },
        { ingredientId: I.kartoffeln.id,      amountPerPerson: r(12    / P_ALL),   unit: 'kg'       },
        { ingredientId: I.zwiebeln.id,        amountPerPerson: r(5     / P_ALL),   unit: 'Stück'    },
        { ingredientId: I.kopfsalat.id,       amountPerPerson: r(13    / P_ALL),   unit: 'Stück'    },
        { ingredientId: I.griechJoghurt.id,   amountPerPerson: r(6.75  / P_ALL),   unit: 'kg'       },
        { ingredientId: I.vanillezucker.id,   amountPerPerson: r(11    / P_ALL),   unit: 'Packungen'},
        { ingredientId: I.pistazienkerne.id,  amountPerPerson: r(0.113 / P_ALL),   unit: 'kg'       },
        { ingredientId: I.honig.id,           amountPerPerson: r(0.338 / P_ALL),   unit: 'kg'       },
        { ingredientId: I.cantaloupeMelone.id,amountPerPerson: r(5     / P_ALL),   unit: 'Stück'    },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.austernpilze.id,    amountPerPerson: r(40    / P_VEGGIE),unit: 'Stück'    },
        { ingredientId: I.mehl.id,            amountPerPerson: r(0.5   / P_VEGGIE),unit: 'kg'       },
        { ingredientId: I.sahne.id,           amountPerPerson: r(0.5   / P_VEGGIE),unit: 'l'        },
        { ingredientId: I.eier.id,            amountPerPerson: r(9     / P_VEGGIE),unit: 'Stück'    },
        { ingredientId: I.semmelbrosel.id,    amountPerPerson: r(1.7   / P_VEGGIE),unit: 'kg'       },
        { ingredientId: I.butterschmalz.id,   amountPerPerson: r(2     / P_VEGGIE),unit: 'kg'       },
        { ingredientId: I.kartoffeln.id,      amountPerPerson: r(12    / P_ALL),   unit: 'kg'       },
        { ingredientId: I.zwiebeln.id,        amountPerPerson: r(5     / P_ALL),   unit: 'Stück'    },
        { ingredientId: I.kopfsalat.id,       amountPerPerson: r(13    / P_ALL),   unit: 'Stück'    },
        { ingredientId: I.griechJoghurt.id,   amountPerPerson: r(6.75  / P_ALL),   unit: 'kg'       },
        { ingredientId: I.vanillezucker.id,   amountPerPerson: r(11    / P_ALL),   unit: 'Packungen'},
        { ingredientId: I.pistazienkerne.id,  amountPerPerson: r(0.113 / P_ALL),   unit: 'kg'       },
        { ingredientId: I.honig.id,           amountPerPerson: r(0.338 / P_ALL),   unit: 'kg'       },
        { ingredientId: I.cantaloupeMelone.id,amountPerPerson: r(5     / P_ALL),   unit: 'Stück'    },
      ]}},
    ]}
  }})

  // 9. Spaghetti – Fr 08.08.2025 (SONDERPROGRAMM)
  const SCALE = 70 / 30
  const spaghetti = await prisma.recipe.create({ data: {
    name: 'Spaghetti Bolognese / Linsen-Bolognese (Sonderprogramm)',
    category: 'Mittagessen',
    tags: 'italienisch,sonderprogramm',
    allergens: 'Gluten,Milch',
    notes: 'SONDERPROGRAMM! Hackfleischsoße-Mengen für 30 Personen: mit Faktor 70/30 hochrechnen. Kandierte Tomaten: 2 kg Kirschtomaten + Olivenöl + Zucker + ital. Kräuter. 2 Töpfe Basilikum + 1 kg Parmesan. Glutenfreie Spaghetti (1 Packung). Abends: Couscous-Salat extra.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.spaghetti.id,      amountPerPerson: r(12                   / P_ALL),  unit: 'kg'    },
        { ingredientId: I.hackfleisch.id,    amountPerPerson: r(1.88 * SCALE         / P_MEAT), unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,       amountPerPerson: r(6    * SCALE         / P_MEAT), unit: 'Stück' },
        { ingredientId: I.knoblauch.id,      amountPerPerson: r(3    * SCALE         / P_MEAT), unit: 'Stück' },
        { ingredientId: I.karotten.id,       amountPerPerson: r(6    * SCALE         / P_MEAT), unit: 'Stück' },
        { ingredientId: I.sellerie.id,       amountPerPerson: r(6    * SCALE         / P_MEAT), unit: 'Stück' },
        { ingredientId: I.weisswein.id,      amountPerPerson: r(0.75 * SCALE         / P_MEAT), unit: 'l'     },
        { ingredientId: I.milch.id,          amountPerPerson: r(1.13 * SCALE         / P_MEAT), unit: 'l'     },
        { ingredientId: I.rinderbruehe.id,   amountPerPerson: r(1.13 * SCALE         / P_MEAT), unit: 'l'     },
        { ingredientId: I.passTomaten.id,    amountPerPerson: r((1.13 * SCALE + 3)   / P_MEAT), unit: 'l'     },
        { ingredientId: I.stueckTomaten.id,  amountPerPerson: r((1.13 * SCALE + 3)   / P_MEAT), unit: 'l'     },
        { ingredientId: I.kirschtomaten.id,  amountPerPerson: r(2                    / P_ALL),  unit: 'kg'    },
        { ingredientId: I.parmesan.id,       amountPerPerson: r(1                    / P_ALL),  unit: 'kg'    },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.spaghetti.id,      amountPerPerson: r(12    / P_ALL),    unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,       amountPerPerson: r(2     / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.knoblauch.id,      amountPerPerson: r(3     / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.karotten.id,       amountPerPerson: r(3     / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.sellerie.id,       amountPerPerson: r(3     / P_VEGGIE), unit: 'Stück' },
        { ingredientId: I.linsen.id,         amountPerPerson: r(0.5   / P_VEGGIE), unit: 'kg'    },
        { ingredientId: I.weisswein.id,      amountPerPerson: r(0.3   / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.tomatenmark.id,    amountPerPerson: r(0.15  / P_VEGGIE), unit: 'kg'    },
        { ingredientId: I.stueckTomaten.id,  amountPerPerson: r(0.4   / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.passata.id,        amountPerPerson: r(0.75  / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.gemuesebruehe.id,  amountPerPerson: r(2     / P_VEGGIE), unit: 'l'     },
        { ingredientId: I.passTomaten.id,    amountPerPerson: r(3     / P_ALL),    unit: 'l'     },
        { ingredientId: I.stueckTomaten.id,  amountPerPerson: r(3     / P_ALL),    unit: 'l'     },
        { ingredientId: I.kirschtomaten.id,  amountPerPerson: r(2     / P_ALL),    unit: 'kg'    },
        { ingredientId: I.parmesan.id,       amountPerPerson: r(1     / P_ALL),    unit: 'kg'    },
      ]}},
    ]}
  }})

  // 10. Maultaschen – Sa 09.08.2025
  const maultaschen = await prisma.recipe.create({ data: {
    name: 'Maultaschen mit Kartoffelsalat',
    category: 'Mittagessen',
    tags: 'schwäbisch',
    allergens: 'Gluten,Milch,Ei',
    notes: '10 glutenfreie Maultaschen-Bürger bereitstellen. Nachtisch: 85 Eis. Kartoffelsalat: Start ~1,4 l Brühe + 300–400 ml Öl, nach Schmatz-Test anpassen.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.nudelteig.id,   amountPerPerson: r(15   / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.hackfleisch.id, amountPerPerson: r(7    / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.braet.id,       amountPerPerson: r(1.6  / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.spinat.id,      amountPerPerson: r(3.2  / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.eier.id,        amountPerPerson: r(26   / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.zwiebeln.id,    amountPerPerson: r(5    / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.semmelbrosel.id,amountPerPerson: r(0.6  / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.butter.id,      amountPerPerson: r(1.2  / P_MEAT),  unit: 'kg'    },
        { ingredientId: I.bruehe.id,      amountPerPerson: r(10   / P_ALL),   unit: 'l'     },
        { ingredientId: I.kartoffeln.id,  amountPerPerson: r(12   / P_ALL),   unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,    amountPerPerson: r(5    / P_ALL),   unit: 'Stück' },
        { ingredientId: I.kopfsalat.id,   amountPerPerson: r(10   / P_ALL),   unit: 'Stück' },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.nudelteig.id,   amountPerPerson: r(7    / P_VEGGIE),unit: 'Stück' },
        { ingredientId: I.spinat.id,      amountPerPerson: r(2    / P_VEGGIE),unit: 'kg'    },
        { ingredientId: I.kartoffeln.id,  amountPerPerson: r(3    / P_VEGGIE),unit: 'kg'    },
        { ingredientId: I.schafskäse.id,  amountPerPerson: r(1.5  / P_VEGGIE),unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,    amountPerPerson: r(10   / P_VEGGIE),unit: 'Stück' },
        { ingredientId: I.eier.id,        amountPerPerson: r(3    / P_VEGGIE),unit: 'Stück' },
        { ingredientId: I.bruehe.id,      amountPerPerson: r(10   / P_ALL),   unit: 'l'     },
        { ingredientId: I.kartoffeln.id,  amountPerPerson: r(12   / P_ALL),   unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,    amountPerPerson: r(5    / P_ALL),   unit: 'Stück' },
        { ingredientId: I.kopfsalat.id,   amountPerPerson: r(10   / P_ALL),   unit: 'Stück' },
      ]}},
    ]}
  }})

  // ── Abendessen-Extras ────────────────────────────────────────────────────
  // 11. Paprikacreme (So 03.08 + Di 05.08 Abends)
  const paprikacreme = await prisma.recipe.create({ data: {
    name: 'Paprikacreme (Abendessen-Extra)',
    category: 'Abendessen',
    tags: 'aufstrich,vegetarisch',
    allergens: 'Milch',
    notes: 'Aufs Buffet zum Abendessen stellen. Gut mit Brot.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.frischkaese.id,   amountPerPerson: r(1.7   / P_ALL), unit: 'kg'    },
        { ingredientId: I.cremefraiche.id,  amountPerPerson: r(0.675 / P_ALL), unit: 'kg'    },
        { ingredientId: I.rotePaprika.id,   amountPerPerson: r(6     / P_ALL), unit: 'Stück' },
        { ingredientId: I.tomatenmark.id,   amountPerPerson: r(0.35  / P_ALL), unit: 'kg'    },
        { ingredientId: I.zwiebeln.id,      amountPerPerson: r(3.5   / P_ALL), unit: 'Stück' },
      ]}
    }]}
  }})

  // 12. Tomaten-Mozzarella (Mo 04.08 Abends)
  const tomatenMozzarella = await prisma.recipe.create({ data: {
    name: 'Tomaten-Mozzarella (Abendessen-Extra)',
    category: 'Abendessen',
    tags: 'italienisch,vegetarisch',
    allergens: 'Milch',
    notes: 'Paar Tomaten ohne Mozzarella für Allergiker. Basilikum-Topf kaufen, so bleiben die Blätter frisch. Mit Balsamico und Olivenöl anrichten.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.tomaten.id,      amountPerPerson: r(50  / P_ALL), unit: 'Stück' },
        { ingredientId: I.mozzarella.id,   amountPerPerson: r(2   / P_ALL), unit: 'kg'    },
        { ingredientId: I.basilikum.id,    amountPerPerson: r(1   / P_ALL), unit: 'Topf'  },
        { ingredientId: I.olivenoel.id,    amountPerPerson: r(0.1 / P_ALL), unit: 'l'     },
      ]}
    }]}
  }})

  // 13. Currywurst (Mi 06.08 Abends)
  const currywurst = await prisma.recipe.create({ data: {
    name: 'Currywurst (Abendessen-Extra)',
    category: 'Abendessen',
    tags: 'streetfood',
    allergens: 'Gluten',
    notes: '2× eigene Brötchen für Allergiker bereitstellen. Chilipulver: etwa 1,7× der ursprünglichen Menge. Brühepulver nach Geschmack.',
    versions: { create: [
      { type: 'MIT_FLEISCH', ingredients: { create: [
        { ingredientId: I.bockwurst.id,         amountPerPerson: r(70    / P_MEAT),  unit: 'Stück' },
        { ingredientId: I.olivenoel.id,         amountPerPerson: r(0.68  / P_ALL),   unit: 'l'     },
        { ingredientId: I.ketchup.id,           amountPerPerson: r(3.4   / P_ALL),   unit: 'l'     },
        { ingredientId: I.zucker.id,            amountPerPerson: r(0.51  / P_ALL),   unit: 'kg'    },
        { ingredientId: I.currypulver.id,       amountPerPerson: r(0.34  / P_ALL),   unit: 'kg'    },
        { ingredientId: I.baguettebroetchen.id, amountPerPerson: r(90    / P_ALL),   unit: 'Stück' },
      ]}},
      { type: 'VEGETARISCH', ingredients: { create: [
        { ingredientId: I.vegWurst.id,          amountPerPerson: r(25    / P_VEGGIE),unit: 'Stück' },
        { ingredientId: I.olivenoel.id,         amountPerPerson: r(0.68  / P_ALL),   unit: 'l'     },
        { ingredientId: I.ketchup.id,           amountPerPerson: r(3.4   / P_ALL),   unit: 'l'     },
        { ingredientId: I.zucker.id,            amountPerPerson: r(0.51  / P_ALL),   unit: 'kg'    },
        { ingredientId: I.currypulver.id,       amountPerPerson: r(0.34  / P_ALL),   unit: 'kg'    },
        { ingredientId: I.baguettebroetchen.id, amountPerPerson: r(90    / P_ALL),   unit: 'Stück' },
      ]}},
    ]}
  }})

  // 14. Couscous-Salat (Fr 08.08 Abends)
  const cousCousSalat = await prisma.recipe.create({ data: {
    name: 'Couscous-Salat (Abendessen-Extra)',
    category: 'Abendessen',
    tags: 'salat,vegetarisch',
    allergens: 'Gluten',
    notes: 'Essig und Öl nach Geschmack (z. B. 5–6 EL Essig, 6–8 EL Sonnenblumenöl).',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.couscous.id,            amountPerPerson: r(1.78 / P_ALL), unit: 'kg'    },
        { ingredientId: I.schlangengurke.id,      amountPerPerson: r(5    / P_ALL), unit: 'Stück' },
        { ingredientId: I.tomaten.id,             amountPerPerson: r(9    / P_ALL), unit: 'Stück' },
        { ingredientId: I.paprikaGelb.id,         amountPerPerson: r(7    / P_ALL), unit: 'Stück' },
        { ingredientId: I.fruehlingszwiebeln.id,  amountPerPerson: r(2.5  / P_ALL), unit: 'Stück' },
      ]}
    }]}
  }})

  // 15. Rührei (Di 05.08 Frühstücks-Extra)
  const ruehrei = await prisma.recipe.create({ data: {
    name: 'Rührei (Frühstücks-Extra)',
    category: 'Frühstück',
    tags: 'extra,warm',
    allergens: 'Ei,Milch',
    notes: 'Zusatz zum Standardfrühstück am Dienstag. 70 Eier für ca. 95 Personen.',
    versions: { create: [{
      type: 'VEGETARISCH',
      ingredients: { create: [
        { ingredientId: I.eier.id, amountPerPerson: r(70 / P_ALL), unit: 'Stück' },
      ]}
    }]}
  }})

  console.log('✅ All 15 recipes created')

  // ── Speiseplaneintragungen ────────────────────────────────────────────────
  console.log('📅 Creating meal plan entries...')

  const d = (s) => new Date(s + 'T00:00:00.000Z')

  const campDates = [
    '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05',
    '2025-08-06', '2025-08-07', '2025-08-08', '2025-08-09',
  ]

  // Mittagessen pro Tag: [recipe, hasMeatVersion]
  const mittagMap = [
    [chili,            true ],  // Sa 02.08.
    [kaesespaetzle,    false],  // So 03.08.
    [curry,            true ],  // Mo 04.08.
    [gefuelltePaprika, false],  // Di 05.08.
    [knoedel,          false],  // Mi 06.08.
    [schnitzelRezept,  true ],  // Do 07.08.
    [spaghetti,        true ],  // Fr 08.08.
    [maultaschen,      true ],  // Sa 09.08.
  ]

  for (let i = 0; i < campDates.length; i++) {
    const [recipe, hasMeat] = mittagMap[i]
    await prisma.mealPlanEntry.create({ data: {
      date:              d(campDates[i]),
      mealTime:          'mittag',
      recipeId:          recipe.id,
      personCountMeat:   hasMeat ? P_MEAT : 0,
      personCountVeggie: hasMeat ? P_VEGGIE : P_ALL,
      status:            'geplant',
    }})
  }

  // Frühstück + Abendessen (alle 8 Tage)
  for (const dateStr of campDates) {
    await prisma.mealPlanEntry.create({ data: {
      date:              d(dateStr),
      mealTime:          'fruehstueck',
      recipeId:          fruehstueck.id,
      personCountMeat:   0,
      personCountVeggie: P_ALL,
      status:            'geplant',
    }})
    await prisma.mealPlanEntry.create({ data: {
      date:              d(dateStr),
      mealTime:          'abend',
      recipeId:          abendessen.id,
      personCountMeat:   P_MEAT,
      personCountVeggie: P_VEGGIE,
      status:            'geplant',
    }})
  }

  // Abendessen-Extras auf spezifische Tage
  const abendExtras = [
    ['2025-08-03', paprikacreme.id   ],  // So 03.08.
    ['2025-08-04', tomatenMozzarella.id],// Mo 04.08.
    ['2025-08-05', paprikacreme.id   ],  // Di 05.08.
    ['2025-08-06', currywurst.id     ],  // Mi 06.08.
    ['2025-08-08', cousCousSalat.id  ],  // Fr 08.08.
  ]
  for (const [dateStr, recipeId] of abendExtras) {
    const hasMeat = recipeId === currywurst.id
    await prisma.mealPlanEntry.create({ data: {
      date:              d(dateStr),
      mealTime:          'abend',
      recipeId,
      personCountMeat:   hasMeat ? P_MEAT : 0,
      personCountVeggie: hasMeat ? P_VEGGIE : P_ALL,
      status:            'geplant',
    }})
  }

  // Rührei: Frühstücks-Extra Di 05.08.
  await prisma.mealPlanEntry.create({ data: {
    date:              d('2025-08-05'),
    mealTime:          'fruehstueck',
    recipeId:          ruehrei.id,
    personCountMeat:   0,
    personCountVeggie: P_ALL,
    status:            'geplant',
  }})

  console.log('✅ Meal plan entries created')
  console.log('')
  console.log('🎉 Seed abgeschlossen!')
  console.log(`   Rezepte:          15`)
  console.log(`   Speiseplanzeilen: ${campDates.length * 3 + abendExtras.length + 1}  (Frühstück + Mittag + Abend × 8 + Extras)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
