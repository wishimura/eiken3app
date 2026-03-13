'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StudyClient } from "./StudyClient";
import { ClozeClient } from "./ClozeClient";
import { DailyProgress } from "./DailyProgress";
import { XpDisplay } from "./XpDisplay";

type Tab = "vocab" | "cloze";

export function StudySwitcher() {
  const [tab, setTab] = useState<Tab>("vocab");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:gap-6">
      <DailyProgress />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <XpDisplay />
          <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={tab === "vocab" ? "default" : "ghost"}
              className={`h-9 rounded-full px-5 text-xs font-semibold ${
                tab === "vocab" ? "btn-primary-gradient border-0" : ""
              }`}
              onClick={() => setTab("vocab")}
            >
              単語カード
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "cloze" ? "default" : "ghost"}
              className={`h-9 rounded-full px-5 text-xs font-semibold ${
                tab === "cloze" ? "btn-primary-gradient border-0" : ""
              }`}
              onClick={() => setTab("cloze")}
            >
              穴埋め
            </Button>
          </div>
        </div>
        {tab === "cloze" && (
          <p className="text-center text-xs text-muted-foreground">
            下の「問題をダウンロード」ボタンで読み込んでから解けます
          </p>
        )}
      </div>

      {tab === "vocab" ? <StudyClient /> : <ClozeClient />}
    </div>
  );
}
