"use server";

import { prisma } from "@kjg/database";
import { revalidatePath } from "next/cache";

export async function createTask(data: {
  description: string;
  dueDate: string | null;
  responsibility: string | null;
}) {
  const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null;

  await prisma.task.create({
    data: {
      description: data.description,
      dueDate: parsedDueDate,
      responsibility: data.responsibility || null,
      completed: false,
    },
  });

  revalidatePath("/tasks");
}

export async function updateTask(
  id: string,
  data: {
    description: string;
    dueDate: string | null;
    responsibility: string | null;
  }
) {
  const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null;

  await prisma.task.update({
    where: { id },
    data: {
      description: data.description,
      dueDate: parsedDueDate,
      responsibility: data.responsibility || null,
    },
  });

  revalidatePath("/tasks");
}

export async function toggleTask(id: string, completed: boolean) {
  await prisma.task.update({
    where: { id },
    data: { completed },
  });

  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });

  revalidatePath("/tasks");
}
