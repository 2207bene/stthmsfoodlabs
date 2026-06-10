"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative h-16 w-48 aspect-[3/1]">
              <Image
                src="/logo.png"
                alt="STTHMS Food Labs"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login
          </CardTitle>
          <CardDescription>
            Bitte gib das globale Passwort für den Küchenchef ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
