'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StudyClient } from "./StudyClient";
import { ClozeClient } from "./ClozeClient";

type Tab = "vocab" | "cloze";

export function StudySwitcher() {
  const [tab, setTab] = useState<Tab>("vocab");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:gap-6">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "vocab" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 text-xs font-medium sm:h-9 sm:px-5"
            onClick={() => setTab("vocab")}
          >
            単語カード
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "cloze" ? "default" : "ghost"}
            className="h-8 rounded-full px-4 text-xs font-medium sm:h-9 sm:px-5"
            onClick={() => setTab("cloze")}
          >
            穴埋め
          </Button>
        </div>
      </div>

      {tab === "vocab" ? <StudyClient /> : <ClozeClient />}
    </div>
  );
}

