/**
 * Gamification utilities - XP, levels, daily goals, streak tracking.
 * All state persisted to localStorage (client-side only).
 */

// ─── Constants ───
export const XP_PER_CORRECT = 10;
export const XP_STREAK_BONUS_MULTIPLIER = 0.5; // +50% per 5-streak
export const DAILY_GOAL_DEFAULT = 20;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, rank: "ビギナー" },
  { level: 2, xp: 100, rank: "ブロンズ" },
  { level: 3, xp: 300, rank: "シルバー" },
  { level: 4, xp: 600, rank: "ゴールド" },
  { level: 5, xp: 1000, rank: "プラチナ" },
  { level: 6, xp: 1500, rank: "ダイヤモンド" },
] as const;

// ─── XP Calculation ───
export function calculateXpGain(streak: number): number {
  const base = XP_PER_CORRECT;
  const bonusMultiplier = Math.floor(streak / 5) * XP_STREAK_BONUS_MULTIPLIER;
  return Math.round(base * (1 + bonusMultiplier));
}

export function getLevelInfo(totalXp: number) {
  let current: (typeof LEVEL_THRESHOLDS)[number] = LEVEL_THRESHOLDS[0];
  let next: (typeof LEVEL_THRESHOLDS)[number] | null = LEVEL_THRESHOLDS[1] ?? null;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
      break;
    }
  }
  const progressToNext = next
    ? (totalXp - current.xp) / (next.xp - current.xp)
    : 1;
  return { ...current, totalXp, next, progressToNext };
}

// ─── LocalStorage Keys ───
const KEYS = {
  totalXp: "eiken3_total_xp",
  dailyCount: "eiken3_daily_count",
  dailyDate: "eiken3_daily_date",
  streakDays: "eiken3_streak_days",
  lastStudyDate: "eiken3_last_study_date",
  studyHistory: "eiken3_study_history",
} as const;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── XP ───
export function getTotalXp(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEYS.totalXp) ?? "0", 10);
}

export function addXp(amount: number): number {
  const current = getTotalXp();
  const next = current + amount;
  localStorage.setItem(KEYS.totalXp, String(next));
  return next;
}

// ─── Daily Goal ───
export function getDailyProgress(): {
  count: number;
  goal: number;
  date: string;
} {
  if (typeof window === "undefined")
    return { count: 0, goal: DAILY_GOAL_DEFAULT, date: todayStr() };
  const savedDate = localStorage.getItem(KEYS.dailyDate);
  const today = todayStr();
  if (savedDate !== today) {
    localStorage.setItem(KEYS.dailyDate, today);
    localStorage.setItem(KEYS.dailyCount, "0");
    return { count: 0, goal: DAILY_GOAL_DEFAULT, date: today };
  }
  const count = parseInt(localStorage.getItem(KEYS.dailyCount) ?? "0", 10);
  return { count, goal: DAILY_GOAL_DEFAULT, date: today };
}

export function incrementDailyCount(): number {
  const { count } = getDailyProgress();
  const next = count + 1;
  localStorage.setItem(KEYS.dailyCount, String(next));
  localStorage.setItem(KEYS.dailyDate, todayStr());
  return next;
}

// ─── Streak Days ───
export function getStreakDays(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEYS.streakDays) ?? "0", 10);
}

export function recordStudyDay(): {
  streakDays: number;
  isNewDay: boolean;
} {
  const today = todayStr();
  const lastDate = localStorage.getItem(KEYS.lastStudyDate);
  if (lastDate === today)
    return { streakDays: getStreakDays(), isNewDay: false };

  const history: string[] = JSON.parse(
    localStorage.getItem(KEYS.studyHistory) ?? "[]",
  );
  if (!history.includes(today)) history.push(today);
  const recent = history.slice(-30);
  localStorage.setItem(KEYS.studyHistory, JSON.stringify(recent));

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let streak = 1;
  if (lastDate === yesterdayStr) {
    streak = getStreakDays() + 1;
  }
  localStorage.setItem(KEYS.streakDays, String(streak));
  localStorage.setItem(KEYS.lastStudyDate, today);
  return { streakDays: streak, isNewDay: true };
}

export function getStudyHistory(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEYS.studyHistory) ?? "[]");
}

// ─── Milestones ───
export function isMilestoneStreak(streak: number): boolean {
  return streak === 5 || streak === 10 || streak === 20 || streak === 50;
}
