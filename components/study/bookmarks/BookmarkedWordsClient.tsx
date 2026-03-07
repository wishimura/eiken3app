"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playCorrectSound, playFlipSound, playLaterSound } from "@/lib/sounds";

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
      setError("Failed to load bookmarks");
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
    } else {
      playLaterSound();
      setLastResult("wrong");
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
          ← My page へ
        </Link>
      </div>
    );
  }

  if (pool.length === 0 && !word) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4 px-2">
        <p className="text-muted-foreground">ブックマーク単語がありません。</p>
        <Link href="/me" className="text-sm text-primary hover:underline">
          ← My page へ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          ブックマーク単語
        </h1>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Mode</span>
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "EN_TO_JA" ? "default" : "ghost"}
              className="h-8 rounded-md px-3 text-xs font-medium"
              onClick={() => setMode("EN_TO_JA")}
              disabled={!!lastResult}
            >
              EN → JA
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "JA_TO_EN" ? "default" : "ghost"}
              className="h-8 rounded-md px-3 text-xs font-medium"
              onClick={() => setMode("JA_TO_EN")}
              disabled={!!lastResult}
            >
              JA → EN
            </Button>
          </div>
        </div>
      </header>

      <Card className="relative flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-md sm:p-8">
        {lastResult && (
          <button
            type="button"
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer border-0 ${
              lastResult === "correct" ? "bg-primary/90 text-primary-foreground" : "bg-primary/75 text-primary-foreground"
            }`}
            aria-live="polite"
            onClick={() => {
              if (!nextWordReady) return;
              if (dismissTimeoutRef.current) {
                clearTimeout(dismissTimeoutRef.current);
                dismissTimeoutRef.current = null;
              }
              flushSync(() => setLastResult(null));
            }}
          >
            {lastResult === "correct" && <span className="text-4xl sm:text-5xl">✓</span>}
            <span className="text-xl font-bold sm:text-2xl">
              {lastResult === "correct" ? "知ってる!" : "あとで練習"}
            </span>
            <span className="text-xs opacity-80 mt-2">
              {nextWordReady ? "タップして次へ" : "…"}
            </span>
          </button>
        )}

        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Current word（残り {pool.length}）
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
              if (next) playFlipSound();
            }}
            aria-label={showAnswer ? "Show question" : "Reveal answer"}
          >
            <span className="sr-only">{showAnswer ? "Show question" : "Tap to reveal answer"}</span>
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
                  Tap to flip
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
                Tap to flip back
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 sm:gap-4 sm:pt-4">
          <Button
            variant="outline"
            className="min-h-[48px] flex-1 rounded-xl border-border py-4 text-base font-medium sm:py-6"
            type="button"
            disabled={!!lastResult || !word}
            onClick={() => void submitAnswer(false)}
          >
            あとで練習
          </Button>
          <Button
            className="btn-primary-gradient min-h-[48px] flex-1 rounded-xl border-0 py-4 text-base font-medium shadow-sm sm:py-6"
            type="button"
            disabled={!!lastResult || !word}
            onClick={() => void submitAnswer(true)}
          >
            知ってる!
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
            ← My page
          </Link>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  );
}
