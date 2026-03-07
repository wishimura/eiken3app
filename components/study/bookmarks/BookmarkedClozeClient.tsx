"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

type ClozeQuestion = {
  id: string;
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: number;
};

function pickRandomFromPool(
  pool: ClozeQuestion[],
  excludeId?: string,
): ClozeQuestion | null {
  const candidates =
    excludeId && pool.length > 1 ? pool.filter((q) => q.id !== excludeId) : pool;
  return candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]!
    : null;
}

export function BookmarkedClozeClient() {
  const [pool, setPool] = useState<ClozeQuestion[]>([]);
  const [question, setQuestion] = useState<ClozeQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/bookmarks/cloze");
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        questions?: ClozeQuestion[];
      };
      if (!res.ok || !json.ok || !json.questions?.length) {
        setError(json?.error ?? "ブックマークがありません");
        setPool([]);
        setQuestion(null);
        return;
      }
      setPool(json.questions);
      setQuestion(pickRandomFromPool(json.questions));
      setFeedback(null);
    } catch {
      setError("Failed to load bookmarks");
      setPool([]);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  async function answer(choice: number) {
    if (!question) return;
    setAnswering(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/study/cloze/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, choice }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        correct?: boolean;
        correctChoice?: number;
        explanation?: string | null;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Failed to record answer");
        return;
      }

      const correct = data.correct ?? false;
      if (correct) {
        playCorrectSound();
        await fetch("/api/study/cloze/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, bookmarked: false }),
        });
        setPool((prev) => prev.filter((q) => q.id !== question.id));
      } else {
        playWrongSound();
        const correctChoice = data.correctChoice ?? question.correct_choice;
        const correctText =
          question[
            `choice_${correctChoice}` as
              | "choice_1"
              | "choice_2"
              | "choice_3"
              | "choice_4"
          ];
        setFeedback(
          `正解は「${correctText}」${data.explanation ? ` — ${data.explanation}` : ""}`,
        );
      }

      const remaining = correct
        ? pool.filter((q) => q.id !== question.id)
        : [...pool];
      const next =
        remaining.length > 0
          ? remaining[Math.floor(Math.random() * remaining.length)]!
          : null;
      setQuestion(next);
    } finally {
      setAnswering(false);
    }
  }

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

  if (pool.length === 0 && !question) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4 px-2">
        <p className="text-muted-foreground">ブックマーク穴埋めがありません。</p>
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
          ブックマーク穴埋め
        </h1>
      </header>

      <Card className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-md sm:p-8">
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Cloze（残り {pool.length}）
        </div>

        <div className="min-h-[140px]">
          <p className="text-base leading-relaxed text-foreground sm:text-lg">
            {question ? question.question_text : "—"}
          </p>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2 sm:gap-4 sm:pt-4">
          {[1, 2, 3, 4].map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              className="min-h-[44px] justify-start rounded-xl border-border text-left text-sm font-medium sm:text-base"
              disabled={answering || !question}
              onClick={() => void answer(n)}
            >
              <span className="mr-2 text-xs text-muted-foreground">{n}.</span>
              <span>
                {question
                  ? question[
                      `choice_${n}` as
                        | "choice_1"
                        | "choice_2"
                        | "choice_3"
                        | "choice_4"
                    ]
                  : ""}
              </span>
            </Button>
          ))}
        </div>

        {feedback && (
          <p className="pt-1 text-sm text-foreground sm:pt-2">{feedback}</p>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
            ← My page
          </Link>
        </div>

        {error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
