"use client";

import { useState, useTransition } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  Trash2,
  User,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} from "../actions/tasks";

type Task = {
  id: string;
  description: string;
  dueDate: Date | null;
  responsibility: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function TaskDashboard({ initialTasks }: { initialTasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  // Create Form State
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newResp, setNewResp] = useState("");

  // Edit Dialog State
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editResp, setEditResp] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    startTransition(async () => {
      await createTask({
        description: newDesc.trim(),
        dueDate: newDueDate || null,
        responsibility: newResp.trim() || null,
      });
      // Reset form
      setNewDesc("");
      setNewDueDate("");
      setNewResp("");
    });
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditDesc(task.description);
    setEditDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    setEditResp(task.responsibility || "");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editDesc.trim()) return;

    startTransition(async () => {
      await updateTask(editingTask.id, {
        description: editDesc.trim(),
        dueDate: editDueDate || null,
        responsibility: editResp.trim() || null,
      });
      setEditOpen(false);
      setEditingTask(null);
    });
  };

  const handleToggle = (id: string, completed: boolean) => {
    startTransition(async () => {
      await toggleTask(id, completed);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchtest du diese Aufgabe wirklich löschen?")) {
      startTransition(async () => {
        await deleteTask(id);
      });
    }
  };

  // Group tasks
  const openTasks = initialTasks.filter((t) => !t.completed);
  const completedTasks = initialTasks.filter((t) => t.completed);

  // Statistics
  const totalTasksCount = initialTasks.length;
  const openTasksCount = openTasks.length;
  const completedTasksCount = completedTasks.length;
  
  const overdueTasksCount = openTasks.filter((t) => {
    if (!t.dueDate) return false;
    return isBefore(startOfDay(new Date(t.dueDate)), startOfDay(new Date()));
  }).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/50">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-sky-600 dark:text-sky-400">Aufgaben Gesamt</p>
              <h3 className="text-3xl font-bold mt-1 text-sky-900 dark:text-sky-100">{totalTasksCount}</h3>
            </div>
            <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-full text-sky-600 dark:text-sky-400">
              <ClipboardList className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Offen</p>
              <h3 className="text-3xl font-bold mt-1 text-amber-900 dark:text-amber-100">{openTasksCount}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Erledigt</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">{completedTasksCount}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-rose-100 dark:border-rose-900/50 ${overdueTasksCount > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'bg-muted/50'}`}>
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Überfällig</p>
              <h3 className="text-3xl font-bold mt-1 text-rose-900 dark:text-rose-100">{overdueTasksCount}</h3>
            </div>
            <div className={`p-3 rounded-full ${overdueTasksCount > 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-muted text-muted-foreground'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Task Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Neue Aufgabe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="desc">Beschreibung / Aufgabe *</Label>
                  <Input
                    id="desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="z.B. Brötchen bestellen, Müll rausbringen..."
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resp">Verantwortlich</Label>
                  <Input
                    id="resp"
                    value={newResp}
                    onChange={(e) => setNewResp(e.target.value)}
                    placeholder="z.B. Küchenteam, Max, Alle"
                    disabled={isPending}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Erstellt..." : "Hinzufügen"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Task Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Offene Aufgaben ({openTasksCount})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openTasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Super! Keine offenen Aufgaben mehr.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {openTasks.map((task) => {
                    const isOverdue = task.dueDate && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));
                    return (
                      <div
                        key={task.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="pt-0.5">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={task.completed}
                              onCheckedChange={(checked) =>
                                handleToggle(task.id, checked === true)
                              }
                              disabled={isPending}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`task-${task.id}`}
                              className="font-medium text-base text-foreground break-words cursor-pointer"
                            >
                              {task.description}
                            </Label>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}`}>
                                  <Calendar className="w-3.5 h-3.5" />
                                  Bis {format(new Date(task.dueDate), "dd.MM.yyyy", { locale: de })}
                                  {isOverdue && " (Überfällig)"}
                                </span>
                              )}
                              {task.responsibility && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {task.responsibility}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(task)}
                            disabled={isPending}
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(task.id)}
                            disabled={isPending}
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Card className="opacity-75">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between text-muted-foreground">
                  <span>Erledigte Aufgaben ({completedTasksCount})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="divide-y divide-border">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="pt-0.5">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={(checked) =>
                              handleToggle(task.id, checked === true)
                            }
                            disabled={isPending}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`task-${task.id}`}
                            className="font-medium text-base text-muted-foreground line-through break-words cursor-pointer"
                          >
                            {task.description}
                          </Label>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Erledigt (Fällig am {format(new Date(task.dueDate), "dd.MM.yyyy", { locale: de })})
                              </span>
                            )}
                            {task.responsibility && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {task.responsibility}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(task)}
                          disabled={isPending}
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(task.id)}
                          disabled={isPending}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="editDesc">Beschreibung *</Label>
              <Input
                id="editDesc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDueDate">Fälligkeitsdatum</Label>
              <Input
                id="editDueDate"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editResp">Verantwortlich</Label>
              <Input
                id="editResp"
                value={editResp}
                onChange={(e) => setEditResp(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingTask(null);
              }}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
