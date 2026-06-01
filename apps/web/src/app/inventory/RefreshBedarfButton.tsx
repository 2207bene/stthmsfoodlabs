"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshBedarfButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleRefresh}
      disabled={loading}
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      Bedarf aktualisieren
    </Button>
  );
}
