"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const GLOBAL_PASSWORD = process.env.GLOBAL_PASSWORD || "stthms2026";

export async function login(prevState: { error: string }, formData: FormData) {
  const password = formData.get("password") as string;

  if (password === GLOBAL_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("stthms_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    redirect("/mealplan");
  } else {
    return { error: "Falsches Passwort" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("stthms_auth");
  redirect("/login");
}
