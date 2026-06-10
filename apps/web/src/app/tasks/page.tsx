import { prisma } from "@kjg/database";
import TaskDashboard from "./TaskDashboard";

// Force dynamic rendering so tasks are always up-to-date.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Aufgabenliste</h1>
        <p className="text-muted-foreground">
          Verwalte To-Dos, Fristen und Zuständigkeiten des Küchenteams
        </p>
      </div>

      <TaskDashboard initialTasks={tasks} />
    </div>
  );
}
