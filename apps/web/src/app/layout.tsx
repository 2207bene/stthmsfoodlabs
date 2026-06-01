import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Link from "next/link";
import { CalendarDays, BookOpen, Package, Users, ShoppingCart, LogOut } from "lucide-react";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import { cookies } from "next/headers";
import { logout } from "./actions/auth";

const raleway = Raleway({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STTHMS Food Labs",
  description: "Modern Kitchen Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("stthms_auth");
  return (
    <html
      lang="de"
      className={`${raleway.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center px-4 md:px-8">
            <Link href="/" className="flex items-center gap-3 font-bold text-lg mr-8 text-foreground tracking-tight group">
              <div className="relative h-10 w-40">
                <Image 
                  src="/logo.png" 
                  alt="STTHMS Food Labs" 
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                  unoptimized
                />
              </div>
            </Link>
            {isLoggedIn && (
              <>
                <nav className="flex items-center gap-6 text-sm font-medium">
                  <Link href="/mealplan" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Speiseplan</span>
                  </Link>
                  <Link href="/recipes" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Rezepte</span>
                  </Link>
                  <Link href="/inventory" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Lager</span>
                  </Link>
                  <Link href="/shopping-list" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Einkauf</span>
                  </Link>
                  <Link href="/groups" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Gruppen</span>
                  </Link>
                </nav>
                <div className="ml-auto flex items-center">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors cursor-pointer border border-transparent hover:border-border bg-transparent"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Abmelden</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1">
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </main>
      </body>
    </html>
  );
}
