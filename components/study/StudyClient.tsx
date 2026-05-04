'use client';

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Flame } from "lucide-react";
import { playCorrectSound, playFlipSound, playLaterSound, playXpGainSound, playStreakBonusSound, speakEnglish } from "@/lib/sounds";
import {
  calculateXpGain,
  addXp,
  incrementDailyCount,
  recordStudyDay,
  isMilestoneStreak,
} from "@/lib/gamification";
import { pickFromDeck } from "@/lib/deck";

type StudyMode = "EN_TO_JA" | "JA_TO_EN";

type Word = {
  id: string;
  english: string;
  japanese: string;
};

type NextWordResponse =
  | { ok: true; word: Word }
  | { ok: false; error: string };

type WordsResponse =
  | { ok: true; words: Word[] }
  | { ok: false; error: string };

export function StudyClient() {
  const [mode, setMode] = useState<StudyMode>("EN_TO_JA");
  const [wordsPool, setWordsPool] = useState<Word[] | null>(null);
  const [word, setWord] = useState<Word | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [nextWordReady, setNextWordReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentIdsRef = useRef<Set<string>>(new Set());

  function pickNextWord(pool: Word[]): Word | null {
    return pickFromDeck(pool, recentIdsRef.current, (w) => w.id);
  }

  const loadAllWords = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/study/words");
      const json = (await response.json()) as WordsResponse;
      if (!response.ok || !json.ok) {
        setDownloadError("error" in json ? json.error : "読み込みに失敗しました");
        return;
      }
      const list = "words" in json ? json.words : [];
      if (list.length === 0) {
        setDownloadError("単語がありません");
        return;
      }
      setWordsPool(list);
      setWord(pickNextWord(list));
      setBookmarked(false);
      setShowAnswer(false);
    } catch {
      setDownloadError("ダウンロードに失敗しました");
    } finally {
      setDownloadLoading(false);
    }
  }, []);

  const isPoolMode = wordsPool !== null && wordsPool.length > 0;

  async function submitAnswer(correct: boolean) {
    if (!word) return;
    setError(null);
    setNextWordReady(false);

    if (correct) {
      playCorrectSound();
      setLastResult("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      setSessionScore((n) => n + 1);

      const xp = calculateXpGain(newStreak);
      addXp(xp);
      incrementDailyCount();
      recordStudyDay();
      setXpGained(xp);
      setTimeout(() => setXpGained(null), 1000);
      playXpGainSound();

      window.dispatchEvent(new CustomEvent("xp-gained", { detail: { gained: xp } }));
      window.dispatchEvent(new Event("daily-progress-update"));

      if (isMilestoneStreak(newStreak)) {
        playStreakBonusSound();
      }
    } else {
      playLaterSound();
      setLastResult("wrong");
      setStreak(0);
      incrementDailyCount();
      window.dispatchEvent(new Event("daily-progress-update"));
    }

    const currentWordId = word.id;

    if (isPoolMode && wordsPool) {
      const next = pickNextWord(wordsPool);
      if (!next) return;
      setWord(next);
      setBookmarked(false);
      setShowAnswer(false);
      setNextWordReady(true);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = setTimeout(() => {
        dismissTimeoutRef.current = null;
        setLastResult(null);
      }, 2000);
      void fetch("/api/study/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: currentWordId, correct, mode }),
      }).then((res) => {
        if (!res.ok) return;
        if (!correct) {
          void fetch("/api/study/bookmark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wordId: currentWordId, bookmarked: true }),
          });
        }
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/study/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: currentWordId, correct, mode }),
      });

      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; word?: Word }
        | null;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "記録に失敗しました");
        setLastResult(null);
        return;
      }
      if (!correct) {
        await fetch("/api/study/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wordId: currentWordId, bookmarked: true }),
        });
      }
      if (json.word) {
        setWord(json.word);
        setBookmarked(false);
        setShowAnswer(false);
      } else {
        const res = await fetch("/api/study/next");
        const nextJson = (await res.json()) as NextWordResponse;
        if (res.ok && nextJson.ok) {
          setWord(nextJson.word);
          setBookmarked(false);
          setShowAnswer(false);
        }
      }
      setNextWordReady(true);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = setTimeout(() => {
        dismissTimeoutRef.current = null;
        setLastResult(null);
      }, 2000);
    } catch {
      setError("エラーが発生しました");
      setLastResult(null);
    } finally {
      setLoading(false);
    }
  }

  const frontText =
    mode === "EN_TO_JA" ? word?.english ?? "…" : word?.japanese ?? "…";
  const backText =
    mode === "EN_TO_JA" ? word?.japanese ?? "…" : word?.english ?? "…";

  async function toggleBookmark() {
    if (!word) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const response = await fetch("/api/study/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id, bookmarked: next }),
      });
      if (!response.ok) {
        setError("ブックマークの更新に失敗しました");
      }
    } catch {
      setError("ブックマークの更新に失敗しました");
    }
  }

  if (wordsPool === null) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          単語カード
        </h1>
        <Card className="card-study flex flex-col items-center justify-center gap-6 border-0 p-8 sm:p-12">
          <p className="text-center text-muted-foreground">
            単語をダウンロードしてから始めましょう。読み込み後はオフラインでスムーズに学習できます。
          </p>
          <Button
            className="btn-primary-gradient min-h-[48px] rounded-xl px-8 text-base font-medium transition-transform active:scale-[0.97]"
            disabled={downloadLoading}
            onClick={() => void loadAllWords()}
          >
            {downloadLoading ? "ダウンロード中…" : "単語をダウンロード"}
          </Button>
          {downloadError && (
            <p className="text-center text-sm text-destructive">{downloadError}</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-2 sm:gap-6 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            単語カード
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">スコア: {sessionScore}</span>
            {streak >= 2 && (
              <span className="flex items-center gap-1 font-semibold text-orange-500">
                <Flame className="h-3.5 w-3.5 streak-fire" />
                {streak}連続!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "EN_TO_JA" ? "default" : "ghost"}
              className={`h-8 rounded-md px-3 text-xs font-medium ${
                mode === "EN_TO_JA" ? "btn-primary-gradient border-0" : ""
              }`}
              onClick={() => setMode("EN_TO_JA")}
              disabled={loading}
            >
              英→日
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "JA_TO_EN" ? "default" : "ghost"}
              className={`h-8 rounded-md px-3 text-xs font-medium ${
                mode === "JA_TO_EN" ? "btn-primary-gradient border-0" : ""
              }`}
              onClick={() => setMode("JA_TO_EN")}
              disabled={loading}
            >
              日→英
            </Button>
          </div>
        </div>
      </header>

      <Card className="relative flex flex-col gap-5 card-study border-0 bg-card p-4 sm:p-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          今の単語
        </div>

        {/* Tap-to-flip card */}
        <div
          className="relative h-[240px] w-full sm:h-[280px] [perspective:1000px]"
          style={{ perspective: "1000px" }}
        >
          <button
            type="button"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0"
            disabled={loading || !word}
            onClick={() => {
              if (!word) return;
              const next = !showAnswer;
              setShowAnswer(next);
              if (next) {
                playFlipSound();
                speakEnglish(word.english);
              }
            }}
            aria-label={showAnswer ? "問題を表示" : "答えをめくる"}
          >
            <span className="sr-only">
              {showAnswer ? "問題を表示" : "タップしてめくる"}
            </span>
          </button>
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            style={{
              transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front face */}
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-card [backface-visibility:hidden]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <p className="text-center text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                  {loading && !word
                    ? "読み込み中..."
                    : word
                      ? frontText
                      : "単語がありません"}
                </p>
              </div>
              {word && !showAnswer && (
                <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
                  タップしてめくる
                </p>
              )}
            </div>
            {/* Back face */}
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-muted/50 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <p className="text-center text-xl font-medium leading-snug text-foreground sm:text-2xl">
                  {word ? backText : "—"}
                </p>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
                タップして戻す
              </p>
            </div>
          </div>
        </div>

        {/* Slide-in feedback banner */}
        {lastResult && (
          <div
            className={`slide-up flex items-center justify-between rounded-2xl px-5 py-3 ${
              lastResult === "correct" ? "feedback-correct" : "feedback-wrong"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {lastResult === "correct" ? "✓" : "✗"}
              </span>
              <div className="flex flex-col">
                <span className="text-base font-bold">
                  {lastResult === "correct" ? "正解!" : "あとで練習"}
                </span>
                {lastResult === "correct" && streak >= 2 && (
                  <span className="text-xs opacity-90">{streak}連続正解!</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {xpGained !== null && lastResult === "correct" && (
                <span className="text-sm font-bold opacity-90">+{xpGained} XP</span>
              )}
              <button
                type="button"
                className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/30"
                onClick={() => {
                  if (!nextWordReady) return;
                  if (dismissTimeoutRef.current) {
                    clearTimeout(dismissTimeoutRef.current);
                    dismissTimeoutRef.current = null;
                  }
                  flushSync(() => setLastResult(null));
                }}
              >
                次へ
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1 sm:gap-4 sm:pt-2">
          <Button
            variant="outline"
            className="min-h-[48px] flex-1 rounded-xl border-border py-4 text-base font-medium transition-transform active:scale-[0.97] sm:py-6"
            type="button"
            disabled={loading || !word}
            onClick={() => void submitAnswer(false)}
          >
            あとで練習
          </Button>
          <Button
            className="btn-primary-gradient min-h-[48px] flex-1 rounded-xl border-0 py-4 text-base font-medium shadow-sm transition-transform active:scale-[0.95] sm:py-6"
            type="button"
            disabled={loading || !word}
            onClick={() => void submitAnswer(true)}
          >
            知ってる!
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            variant={bookmarked ? "secondary" : "ghost"}
            className="min-h-[44px] min-w-[44px] gap-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            disabled={loading || !word}
            onClick={(e) => {
              e.stopPropagation();
              void toggleBookmark();
            }}
          >
            <Star
              className="h-4 w-4"
              fill={bookmarked ? "currentColor" : "none"}
            />
            ブックマーク
          </Button>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
      </Card>
    </div>
  );
}
