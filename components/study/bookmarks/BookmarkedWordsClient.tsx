"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { playCorrectSound, playFlipSound, playLaterSound, speakEnglish } from "@/lib/sounds";

type Word = { id: string; english: string; japanese: string };

function pickRandomFromPool(pool: Word[], excludeId?: string): Word | null {
  const candidates =
    excludeId && pool.length > 1 ? pool.filter((w) => w.id !== excludeId) : pool;
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)]! : null;
}

export function BookmarkedWordsClient() {
  const [mode, setMode] = useState<"EN_TO_JA" | "JA_TO_EN">("EN_TO_JA");
  const [pool, setPool] = useState<Word[]>([]);
  const [word, setWord] = useState<Word | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [nextWordReady, setNextWordReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/bookmarks/words");
      const json = (await res.json()) as { ok?: boolean; error?: string; words?: Word[] };
      if (!res.ok || !json.ok || !json.words?.length) {
        setError(json?.error ?? "ブックマークがありません");
        setPool([]);
        setWord(null);
        return;
      }
      setPool(json.words);
      setWord(pickRandomFromPool(json.words));
      setShowAnswer(false);
      setLastResult(null);
      setNextWordReady(true);
    } catch {
      setError("読み込みに失敗しました");
      setPool([]);
      setWord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  async function submitAnswer(correct: boolean) {
    if (!word) return;
    setError(null);
    setNextWordReady(false);
    if (correct) {
      playCorrectSound();
      setLastResult("correct");
      setStreak((s) => s + 1);
    } else {
      playLaterSound();
      setLastResult("wrong");
      setStreak(0);
    }

    const currentWordId = word.id;

    await fetch("/api/study/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: currentWordId, correct, mode }),
    });

    const remaining = correct
      ? pool.filter((w) => w.id !== currentWordId)
      : [...pool];
    if (correct) {
      await fetch("/api/study/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: currentWordId, bookmarked: false }),
      });
      setPool(remaining);
    }

    const next =
      remaining.length > 0
        ? remaining[Math.floor(Math.random() * remaining.length)]!
        : null;
    setWord(next);
    setShowAnswer(false);
    setNextWordReady(true);
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    dismissTimeoutRef.current = setTimeout(() => {
      dismissTimeoutRef.current = null;
      setLastResult(null);
    }, 2000);
  }

  const frontText = mode === "EN_TO_JA" ? word?.english ?? "…" : word?.japanese ?? "…";
  const backText = mode === "EN_TO_JA" ? word?.japanese ?? "…" : word?.english ?? "…";

  if (loading && pool.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-2">
        <p className="text-muted-foreground">読み込み中…</p>
      </div>
    );
  }

  if (error && pool.length === 0) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4 px-2">
        <p className="text-destructive">{error}</p>
        <Link href="/me" className="text-sm text-primary hover:underline">
          ← マイページへ
        </Link>
      </div>
    );
  }

  if (pool.length === 0 && !word) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4 px-2">
        <p className="text-muted-foreground">ブックマーク単語がありません。</p>
        <Link href="/me" className="text-sm text-primary hover:underline">
          ← マイページへ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-2 sm:gap-6 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            ブックマーク単語
          </h1>
          {streak >= 2 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
              <Flame className="h-3.5 w-3.5 streak-fire" />
              {streak}連続!
            </span>
          )}
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
              disabled={!!lastResult}
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
              disabled={!!lastResult}
            >
              日→英
            </Button>
          </div>
        </div>
      </header>

      <Card className="relative flex flex-col gap-5 card-study border-0 bg-card p-4 sm:p-8">
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
              <span className="text-base font-bold">
                {lastResult === "correct" ? "正解!" : "あとで練習"}
              </span>
            </div>
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
        )}

        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          今の単語（残り {pool.length}）
        </div>

        <div
          className="relative h-[240px] w-full sm:h-[280px] [perspective:1000px]"
          style={{ perspective: "1000px" }}
        >
          <button
            type="button"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0"
            disabled={!!lastResult || !word}
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
            <span className="sr-only">{showAnswer ? "問題を表示" : "タップしてめくる"}</span>
          </button>
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            style={{ transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-card [backface-visibility:hidden]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <p className="text-center text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                  {word ? frontText : "—"}
                </p>
              </div>
              {word && !showAnswer && (
                <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
                  タップしてめくる
                </p>
              )}
            </div>
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-muted/50 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
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

        <div className="flex gap-3 pt-1 sm:gap-4 sm:pt-2">
          <Button
            variant="outline"
            className="min-h-[48px] flex-1 rounded-xl border-border py-4 text-base font-medium transition-transform active:scale-[0.97] sm:py-6"
            type="button"
            disabled={!!lastResult || !word}
            onClick={() => void submitAnswer(false)}
          >
            あとで練習
          </Button>
          <Button
            className="btn-primary-gradient min-h-[48px] flex-1 rounded-xl border-0 py-4 text-base font-medium shadow-sm transition-transform active:scale-[0.95] sm:py-6"
            type="button"
            disabled={!!lastResult || !word}
            onClick={() => void submitAnswer(true)}
          >
            知ってる!
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
            ← マイページ
          </Link>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  );
}
