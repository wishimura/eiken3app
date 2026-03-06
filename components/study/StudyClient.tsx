'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

type StudyMode = "EN_TO_JA" | "JA_TO_EN";

type Word = {
  id: string;
  english: string;
  japanese: string;
};

type NextWordResponse =
  | {
      ok: true;
      word: Word;
    }
  | {
      ok: false;
      error: string;
    };

export function StudyClient() {
  const [mode, setMode] = useState<StudyMode>("EN_TO_JA");
  const [word, setWord] = useState<Word | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);

  const loadNextWord = useCallback(
    async (options?: { keepMode?: boolean }) => {
      setLoading(true);
      setError(null);
      setShowAnswer(false);

      try {
        const response = await fetch("/api/study/next");
        const json = (await response.json()) as NextWordResponse;

        if (!response.ok || !json.ok) {
          setError("error" in json ? json.error : "Failed to load next word");
          setWord(null);
          return;
        }

        setWord(json.word);
        setBookmarked(false);
      } catch {
        setError("Unexpected error while loading next word");
        setWord(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadNextWord({ keepMode: true });
  }, [loadNextWord]);

  async function submitAnswer(correct: boolean) {
    if (!word) return;
    setError(null);
    if (correct) {
      playCorrectSound();
      setLastResult("correct");
      setStreak((s) => s + 1);
      setSessionScore((n) => n + 1);
    } else {
      playWrongSound();
      setLastResult("wrong");
      setStreak(0);
    }
    setLoading(true);
    try {
      const response = await fetch("/api/study/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wordId: word.id,
          correct,
          mode,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; word?: Word }
        | null;
      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Failed to record answer");
        setLastResult(null);
        return;
      }
      if (json.word) {
        setWord(json.word);
        setBookmarked(false);
        setShowAnswer(false);
      } else {
        await loadNextWord();
      }
      setTimeout(() => setLastResult(null), 400);
    } catch {
      setError("Unexpected error while recording answer");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wordId: word.id, bookmarked: next }),
      });
      if (!response.ok) {
        setError("Failed to update bookmark");
      }
    } catch {
      setError("Failed to update bookmark");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Study
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Score: {sessionScore}</span>
            {streak >= 2 && (
              <span className="animate-pulse font-medium text-amber-600">
                🔥 {streak} in a row!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Mode</span>
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "EN_TO_JA" ? "default" : "ghost"}
              className="h-8 rounded-md px-3 text-xs font-medium"
              onClick={() => setMode("EN_TO_JA")}
              disabled={loading}
            >
              EN → JA
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "JA_TO_EN" ? "default" : "ghost"}
              className="h-8 rounded-md px-3 text-xs font-medium"
              onClick={() => setMode("JA_TO_EN")}
              disabled={loading}
            >
              JA → EN
            </Button>
          </div>
        </div>
      </header>

      <Card className="relative flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-md sm:p-8">
        {/* Instant feedback overlay */}
        {lastResult && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl transition-opacity duration-150 ${
              lastResult === "correct"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted-foreground/85 text-background"
            }`}
            aria-live="polite"
          >
            <span className="text-4xl sm:text-5xl">
              {lastResult === "correct" ? "✓" : "✗"}
            </span>
            <span className="text-xl font-bold sm:text-2xl">
              {lastResult === "correct" ? "Correct!" : "Wrong"}
            </span>
            {lastResult === "correct" && streak >= 2 && (
              <span className="text-sm font-medium opacity-90">
                {streak} in a row! 🎉
              </span>
            )}
          </div>
        )}

        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Current word
        </div>

        {/* Tap-to-flip card: fixed height so inner centering works */}
        <div
          className="relative h-[240px] w-full sm:h-[280px] [perspective:1000px]"
          style={{ perspective: "1000px" }}
        >
          <button
            type="button"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0"
            disabled={loading || !word}
            onClick={() => word && setShowAnswer((v) => !v)}
            aria-label={showAnswer ? "Show question" : "Reveal answer"}
          >
            <span className="sr-only">
              {showAnswer ? "Show question" : "Tap to reveal answer"}
            </span>
          </button>
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            style={{
              transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front face: word absolutely centered, hint at bottom */}
            <div
              className="absolute inset-0 rounded-2xl border border-border bg-card [backface-visibility:hidden]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <p className="text-center text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                  {loading && !word
                    ? "Loading..."
                    : word
                      ? frontText
                      : "No words available"}
                </p>
              </div>
              {word && !showAnswer && (
                <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
                  Tap to flip
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
            disabled={loading || !word}
            onClick={() => void submitAnswer(false)}
          >
            Wrong
          </Button>
          <Button
            className="btn-primary-gradient min-h-[48px] flex-1 rounded-xl border-0 py-4 text-base font-medium shadow-sm sm:py-6"
            type="button"
            disabled={loading || !word}
            onClick={() => void submitAnswer(true)}
          >
            Correct
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <Button
            type="button"
            size="sm"
            variant={bookmarked ? "secondary" : "ghost"}
            className="min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground"
            disabled={loading || !word}
            onClick={(e) => {
              e.stopPropagation();
              void toggleBookmark();
            }}
          >
            {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </Button>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
      </Card>
    </div>
  );
}

