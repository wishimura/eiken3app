"use client";

import { useEffect, useState } from "react";
import { getStudyHistory, getStreakDays } from "@/lib/gamification";
import { Flame } from "lucide-react";

export function LearningCalendar() {
  const [history, setHistory] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    setHistory(getStudyHistory());
    setStreakDays(getStreakDays());
  }, []);

  const days: { date: string; label: string; active: boolean }[] = [];
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      label: dayNames[d.getDay()],
      active: history.includes(dateStr),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <span className="text-sm font-bold text-foreground">
          {streakDays}日連続学習
        </span>
      </div>
      <div className="flex gap-2">
        {days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {day.label}
            </span>
            <div
              className={`h-8 w-8 rounded-lg transition-colors ${
                day.active
                  ? "bg-[oklch(0.55_0.16_145)]"
                  : "bg-muted"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
