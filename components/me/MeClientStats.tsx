"use client";

import { useEffect, useState } from "react";
import { getTotalXp, getLevelInfo, getStreakDays } from "@/lib/gamification";
import { Trophy, Flame } from "lucide-react";

export function MeClientStats() {
  const [levelInfo, setLevelInfo] = useState(() => getLevelInfo(0));
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setLevelInfo(getLevelInfo(getTotalXp()));
    setStreak(getStreakDays());
  }, []);

  const progressPct = Math.round(levelInfo.progressToNext * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card-study flex items-center gap-4 rounded-[20px] bg-card p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-muted-foreground">
            ランク
          </div>
          <div className="text-lg font-bold text-foreground">
            {levelInfo.rank}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Lv.{levelInfo.level}</span>
            <span>{levelInfo.totalXp} XP</span>
          </div>
          {levelInfo.next && (
            <div className="daily-progress-bar mt-1.5 h-1.5 w-full">
              <div
                className="daily-progress-fill h-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="card-study flex items-center gap-4 rounded-[20px] bg-card p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500">
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-muted-foreground">
            連続学習
          </div>
          <div className="text-lg font-bold text-foreground">{streak}日</div>
        </div>
      </div>
    </div>
  );
}
