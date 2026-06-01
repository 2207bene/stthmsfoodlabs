"use client"

import { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PersonDetailed } from "@/app/actions/campflow"
import { deleteCampflowPerson, updateCampflowPerson } from "@/app/actions/campflow"

type SortKey = "name" | "age" | "ageGroup" | "gender" | "diet" | "intolerances"
type SortDir = "asc" | "desc"

const ageGroupOrder: Record<PersonDetailed["ageGroup"], number> = {
  klein: 0,
  mittel: 1,
  groß: 2,
  unbekannt: 3,
}

type Props = {
  persons: PersonDetailed[]
  byGender: Record<string, number>
  byDiet: { meat: number; veggie: number }
  byAgeGroup: { klein: number; mittel: number; groß: number; unbekannt: number }
}

function normalizeGenderToOption(gender: string | null): "" | "male" | "female" | "diverse" {
  if (!gender) return ""
  const g = gender.toLowerCase()
  if (["male", "männlich", "m"].includes(g)) return "male"
  if (["female", "weiblich", "f", "w"].includes(g)) return "female"
  if (["diverse", "divers"].includes(g)) return "diverse"
  return ""
}

function formatGender(gender: string | null): string {
  if (!gender) return "Unbekannt"
  const map: Record<string, string> = {
    male: "Männlich",
    female: "Weiblich",
    diverse: "Divers",
    divers: "Divers",
    männlich: "Männlich",
    weiblich: "Weiblich",
    m: "Männlich",
    f: "Weiblich",
    w: "Weiblich",
    unbekannt: "Unbekannt",
  }
  return map[gender.toLowerCase()] ?? gender
}

function formatDiet(diet: string): string {
  const diets = diet.split(",").map(d => d.trim()).filter(Boolean)
  if (diets.includes("vegan")) return "Vegan"
  if (diets.includes("vegetarian")) return "Vegetarisch"
  return "Mit Fleisch"
}

const ageGroupLabel: Record<PersonDetailed["ageGroup"], string> = {
  klein: "Klein (7–12)",
  mittel: "Mittel (12–15)",
  groß: "Groß (16+)",
  unbekannt: "Unbekannt",
}

const ageGroupColor: Record<PersonDetailed["ageGroup"], string> = {
  klein: "bg-blue-100 text-blue-800",
  mittel: "bg-yellow-100 text-yellow-800",
  groß: "bg-green-100 text-green-800",
  unbekannt: "bg-gray-100 text-gray-600",
}

export function CampflowPersonsDetail({ persons: initialPersons, byGender, byDiet, byAgeGroup }: Props) {
  const [persons, setPersons] = useState(initialPersons)
  const [expanded, setExpanded] = useState(false)
  const [newIntolerance, setNewIntolerance] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const genderEntries = Object.entries(byGender).sort((a, b) => b[1] - a[1])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtered = q
      ? persons.filter(p => {
          const name = [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase()
          const diet = formatDiet(p.diet).toLowerCase()
          const gender = formatGender(p.gender).toLowerCase()
          const intolerances = (p.intolerances ?? "").toLowerCase()
          const age = String(p.age ?? "")
          return (
            name.includes(q) ||
            diet.includes(q) ||
            gender.includes(q) ||
            intolerances.includes(q) ||
            age.includes(q) ||
            ageGroupLabel[p.ageGroup].toLowerCase().includes(q)
          )
        })
      : persons

    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name": {
          const na = [a.firstName, a.lastName].filter(Boolean).join(" ")
          const nb = [b.firstName, b.lastName].filter(Boolean).join(" ")
          cmp = na.localeCompare(nb, "de")
          break
        }
        case "age":
          cmp = (a.age ?? -1) - (b.age ?? -1)
          break
        case "ageGroup":
          cmp = ageGroupOrder[a.ageGroup] - ageGroupOrder[b.ageGroup]
          break
        case "gender":
          cmp = formatGender(a.gender).localeCompare(formatGender(b.gender), "de")
          break
        case "diet":
          cmp = formatDiet(a.diet).localeCompare(formatDiet(b.diet), "de")
          break
        case "intolerances":
          cmp = (a.intolerances ?? "").localeCompare(b.intolerances ?? "", "de")
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [persons, search, sortKey, sortDir])

  function handleDelete(id: string) {
    setPersons(prev => prev.filter(p => p.id !== id))
    startTransition(async () => {
      await deleteCampflowPerson(id)
    })
  }

  function handleGenderChange(id: string, gender: string) {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, gender } : p))
    startTransition(async () => {
      await updateCampflowPerson(id, { gender })
    })
  }

  function handleDietChange(id: string, diet: string) {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, diet } : p))
    startTransition(async () => {
      await updateCampflowPerson(id, { diet })
    })
  }

  function handleAddIntolerance(id: string) {
    const val = (newIntolerance[id] ?? "").trim()
    if (!val) return
    const person = persons.find(p => p.id === id)
    if (!person) return
    const existing = person.intolerances
      ? person.intolerances.split(",").map(s => s.trim()).filter(Boolean)
      : []
    if (!existing.includes(val)) existing.push(val)
    const updated = existing.join(", ")
    setPersons(prev => prev.map(p => p.id === id ? { ...p, intolerances: updated } : p))
    setNewIntolerance(prev => ({ ...prev, [id]: "" }))
    startTransition(async () => {
      await updateCampflowPerson(id, { intolerances: updated })
    })
  }

  if (persons.length === 0) return null

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Detailübersicht Campflow-Personen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-semibold mb-2 text-gray-700">Geschlecht</p>
            <div className="space-y-1">
              {genderEntries.map(([gender, count]) => (
                <div key={gender} className="flex justify-between text-sm">
                  <span className="text-gray-600">{formatGender(gender)}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-gray-700">Ernährung</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mit Fleisch</span>
                <span className="font-medium">{byDiet.meat}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vegetarisch/Vegan</span>
                <span className="font-medium">{byDiet.veggie}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-gray-700">Altersgruppe</p>
            <div className="space-y-1">
              {(["klein", "mittel", "groß", "unbekannt"] as const).map(group => {
                const count = byAgeGroup[group]
                if (count === 0 && group === "unbekannt") return null
                return (
                  <div key={group} className="flex justify-between text-sm">
                    <span className="text-gray-600">{ageGroupLabel[group]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(v => !v)}
            className="w-full"
          >
            {expanded ? "▲" : "▼"} Alle {persons.length} Personen{" "}
            {expanded ? "ausblenden" : "anzeigen"}
          </Button>

          {expanded && (
            <div className="mt-4 space-y-3">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Personen suchen (Name, Ernährung, Unverträglichkeit …)"
                className="h-8 text-sm"
              />
              <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b text-left text-gray-500">
                    {(
                      [
                        ["name", "Name"],
                        ["age", "Alter"],
                        ["ageGroup", "Altersgruppe"],
                        ["gender", "Geschlecht"],
                        ["diet", "Ernährung"],
                        ["intolerances", "Unverträglichkeiten"],
                      ] as [SortKey, string][]
                    ).map(([key, label]) => (
                      <th
                        key={key}
                        className="px-3 py-2 font-medium cursor-pointer select-none whitespace-nowrap hover:text-gray-800"
                        onClick={() => handleSort(key)}
                      >
                        {label}{" "}
                        <span className="inline-block w-3 text-xs">
                          {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-gray-400 text-sm">
                        Keine Personen gefunden.
                      </td>
                    </tr>
                  )}
                  {filteredAndSorted.map(p => {
                    const diet = formatDiet(p.diet)
                    return (
                      <tr
                        key={p.id}
                        className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2 font-medium whitespace-nowrap">
                          {[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{p.age ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${ageGroupColor[p.ageGroup]}`}
                          >
                            {ageGroupLabel[p.ageGroup].split(" ")[0]}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={normalizeGenderToOption(p.gender)}
                            onChange={e => handleGenderChange(p.id, e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 bg-white"
                          >
                            <option value="">Unbekannt</option>
                            <option value="male">Männlich</option>
                            <option value="female">Weiblich</option>
                            <option value="diverse">Divers</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={
                              p.diet.includes("vegan")
                                ? "vegan"
                                : p.diet.includes("vegetarian")
                                ? "vegetarian"
                                : ""
                            }
                            onChange={e => handleDietChange(p.id, e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 bg-white"
                          >
                            <option value="">Mit Fleisch</option>
                            <option value="vegetarian">Vegetarisch</option>
                            <option value="vegan">Vegan</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 items-center min-w-[160px]">
                            {p.intolerances
                              ? p.intolerances.split(",").map(s => s.trim()).filter(Boolean).map(item => (
                                <span
                                  key={item}
                                  className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap"
                                >
                                  {item}
                                </span>
                              ))
                              : <span className="text-gray-400 text-xs">—</span>
                            }
                            <form
                              onSubmit={e => { e.preventDefault(); handleAddIntolerance(p.id) }}
                              className="flex gap-1 items-center"
                            >
                              <Input
                                value={newIntolerance[p.id] ?? ""}
                                onChange={e => setNewIntolerance(prev => ({ ...prev, [p.id]: e.target.value }))}
                                placeholder="+ hinzufügen"
                                className="h-6 text-xs px-1.5 w-24"
                              />
                            </form>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleDelete(p.id)}
                          >
                            Löschen
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
