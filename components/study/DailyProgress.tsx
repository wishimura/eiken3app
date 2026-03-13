"use client";

import { useEffect, useState } from "react";
import { getDailyProgress } from "@/lib/gamification";

export function DailyProgress() {
  const [progress, setProgress] = useState({ count: 0, goal: 20 });

  useEffect(() => {
    setProgress(getDailyProgress());
  }, []);

  useEffect(() => {
    const handler = () => setProgress(getDailyProgress());
    window.addEventListener("daily-progress-update", handler);
    return () => window.removeEventListener("daily-progress-update", handler);
  }, []);

  const pct = Math.min((progress.count / progress.goal) * 100, 100);
  const completed = progress.count >= progress.goal;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">今日の進捗</span>
        <span
          className={
            completed
              ? "font-bold text-[oklch(0.55_0.16_145)]"
              : "text-foreground"
          }
        >
          {progress.count} / {progress.goal}
          {completed && " 達成!"}
        </span>
      </div>
      <div className="daily-progress-bar h-2.5">
        <div
          className="daily-progress-fill h-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
