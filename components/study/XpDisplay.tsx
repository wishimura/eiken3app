"use client";

import { useEffect, useState } from "react";
import { getTotalXp, getLevelInfo } from "@/lib/gamification";
import { Star } from "lucide-react";

export function XpDisplay() {
  const [levelInfo, setLevelInfo] = useState(() => getLevelInfo(0));
  const [xpPopup, setXpPopup] = useState<number | null>(null);

  useEffect(() => {
    setLevelInfo(getLevelInfo(getTotalXp()));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { gained: number };
      setLevelInfo(getLevelInfo(getTotalXp()));
      setXpPopup(detail.gained);
      setTimeout(() => setXpPopup(null), 1000);
    };
    window.addEventListener("xp-gained", handler);
    return () => window.removeEventListener("xp-gained", handler);
  }, []);

  const progressPct = Math.round(levelInfo.progressToNext * 100);

  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-white">
        <Star className="h-3 w-3" fill="currentColor" />
        <span className="text-[11px] font-bold">Lv.{levelInfo.level}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-foreground">
            {levelInfo.rank}
          </span>
          <span className="text-muted-foreground">{levelInfo.totalXp} XP</span>
        </div>
        {levelInfo.next && (
          <div className="daily-progress-bar h-1.5 w-20">
            <div
              className="daily-progress-fill h-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
      {xpPopup !== null && (
        <span className="xp-float absolute -top-5 right-0 text-xs">
          +{xpPopup} XP
        </span>
      )}
    </div>
  );
}
