import { prisma } from "@kjg/database"
import { createGroup, getPersonGroupCounts } from "../actions/groups"
import { getCampflowSummary, importFromCampflow, deleteCampflowImport, getCampflowPersonsDetailed } from "../actions/campflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CampflowPersonsDetail } from "./CampflowPersonsDetail"
import { GroupCard } from "./GroupCard"

const selectClass =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

export default async function GroupsPage() {
  const [groups, counts, campflow, campflowDetail] = await Promise.all([
    prisma.personGroup.findMany({ orderBy: { createdAt: "asc" } }),
    getPersonGroupCounts(),
    getCampflowSummary(),
    getCampflowPersonsDetailed(),
  ])

  const totalPersons = counts.meat + counts.veggie

  async function handleImport(formData: FormData) {
    "use server"
    const custom = (formData.get("customListId") as string ?? "").trim()
    const listId = custom || (formData.get("listId") as string)
    await importFromCampflow(listId)
  }

  async function handleDelete(formData: FormData) {
    "use server"
    const custom = (formData.get("customListId") as string ?? "").trim()
    const listId = custom || (formData.get("listId") as string)
    await deleteCampflowImport(listId)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">Gruppen & Personen</h1>

      {/* Gesamtpersonen */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gesamtpersonen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">{totalPersons}</p>
          <p className="text-gray-500 mt-1">
            {counts.meat} mit Fleisch / {counts.veggie} vegetarisch
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Linke Spalte: Campflow-Import ── */}
        <Card>
          <CardHeader>
            <CardTitle>Campflow-Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campflow.total === 0 ? (
              <p className="text-gray-500 text-sm">Noch keine Personen importiert</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-4xl font-bold">{campflow.total}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {campflow.meat} mit Fleisch / {campflow.veggie} vegetarisch
                  </p>
                </div>

                {campflow.lastImport && (
                  <p className="text-sm text-gray-500">
                    Letzter Import:{" "}
                    {new Date(campflow.lastImport).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                )}

                {campflow.intolerances.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1.5">Unverträglichkeiten</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campflow.intolerances.slice(0, 8).map(item => (
                        <span
                          key={item.label}
                          className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full"
                        >
                          {item.label} ({item.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formular */}
            <form className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label>Liste auswählen</Label>
                <select name="listId" className={selectClass}>
                  <option value="lst_f30KdQAvkJC2tZM9ilKW">Sommerlager 2026</option>
                  <option value="member">Mitglieder</option>
                  <option value="contact">Kontakte</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customListId">Andere Event-Listen-ID (lst_…)</Label>
                <Input
                  id="customListId"
                  name="customListId"
                  placeholder="lst_xxxxxxxx (überschreibt Auswahl oben)"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" formAction={handleImport} className="flex-1">
                  Importieren / Aktualisieren
                </Button>
                {campflow.total > 0 && (
                  <Button
                    type="submit"
                    formAction={handleDelete}
                    variant="destructive"
                  >
                    Import löschen
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Rechte Spalte: Manuelle Gruppen ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Gruppen</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-gray-500">Noch keine Gruppen angelegt.</p>
              ) : (
                <div className="space-y-4">
                  {groups.map(group => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Neue Gruppe</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData: FormData) => {
                  "use server"
                  await createGroup({
                    name: formData.get("name") as string,
                    count: parseInt(formData.get("count") as string, 10),
                    ageRange: formData.get("ageRange") as string,
                    gender: formData.get("gender") as string,
                    isVegetarian: formData.get("isVegetarian") === "true",
                    intolerances: formData.get("intolerances") as string,
                  })
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Gruppenname</Label>
                  <Input id="name" name="name" placeholder="z.B. Mädchen Zelt 1" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">Anzahl Personen</Label>
                  <Input id="count" name="count" type="number" min="1" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageRange">Altersgruppe</Label>
                  <select name="ageRange" id="ageRange" className={selectClass} required>
                    <option value="klein">Klein (7–12)</option>
                    <option value="mittel">Mittel (12–15)</option>
                    <option value="groß">Groß (16+)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Geschlecht</Label>
                  <select name="gender" id="gender" className={selectClass} required>
                    <option value="m">Männlich</option>
                    <option value="f">Weiblich</option>
                    <option value="diverse">Gemischt/Divers</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isVegetarian">Ernährung</Label>
                  <select name="isVegetarian" id="isVegetarian" className={selectClass} required>
                    <option value="false">Mit Fleisch</option>
                    <option value="true">Vegetarisch</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intolerances">Unverträglichkeiten (kommasepariert)</Label>
                  <Input
                    id="intolerances"
                    name="intolerances"
                    placeholder="z.B. glutenfrei, laktosefrei"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Hinzufügen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Volle Breite: Campflow-Detailübersicht ── */}
        <CampflowPersonsDetail
          persons={campflowDetail.persons}
          byGender={campflowDetail.byGender}
          byDiet={campflowDetail.byDiet}
          byAgeGroup={campflowDetail.byAgeGroup}
        />
      </div>
    </div>
  )
}
