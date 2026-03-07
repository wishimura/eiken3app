"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, Suspense, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookmarkedWordsClient } from "./BookmarkedWordsClient";
import { BookmarkedClozeClient } from "./BookmarkedClozeClient";

type Tab = "words" | "cloze";

export function BookmarkedPracticeSwitcher() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabParam === "cloze" ? "cloze" : "words",
  );

  const setWords = useCallback(() => setTab("words"), []);
  const setCloze = useCallback(() => setTab("cloze"), []);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/study"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Study
        </Link>
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "words" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 text-xs font-medium sm:h-9 sm:px-5"
            onClick={setWords}
          >
            単語
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "cloze" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 text-xs font-medium sm:h-9 sm:px-5"
            onClick={setCloze}
          >
            穴埋め
          </Button>
        </div>
      </div>

      {tab === "words" ? <BookmarkedWordsClient /> : <BookmarkedClozeClient />}
    </div>
  );
}

export function BookmarkedPracticeSwitcherWithSuspense() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <BookmarkedPracticeSwitcher />
    </Suspense>
  );
}
