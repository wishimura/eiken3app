"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnbookmarkWordButton({ wordId }: { wordId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnbookmark() {
    setLoading(true);
    try {
      const res = await fetch("/api/study/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, bookmarked: false }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground"
      disabled={loading}
      onClick={() => void handleUnbookmark()}
    >
      {loading ? "…" : "解除"}
    </Button>
  );
}
