"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [answering, setAnswering] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [correctChoiceNum, setCorrectChoiceNum] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const nextQuestionRef = useRef<ClozeQuestion | null>(null);

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
      setFeedbackType(null);
    } catch {
      setError("読み込みに失敗しました");
      setPool([]);
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  function goToNextQuestion() {
    if (nextQuestionRef.current) {
      setQuestion(nextQuestionRef.current);
      nextQuestionRef.current = null;
    }
    setFeedback(null);
    setFeedbackType(null);
    setSelectedChoice(null);
    setCorrectChoiceNum(null);
    setAnswered(false);
  }

  async function answer(choice: number) {
    if (!question || answered) return;
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
        setError(data?.error ?? "記録に失敗しました");
        return;
      }

      const correct = data.correct ?? false;
      setSelectedChoice(choice);
      setCorrectChoiceNum(data.correctChoice ?? question.correct_choice);
      setAnswered(true);

      if (correct) {
        playCorrectSound();
        setFeedbackType("correct");
        setFeedback("正解! よくできました");
        await fetch("/api/study/cloze/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, bookmarked: false }),
        });
        setPool((prev) => prev.filter((q) => q.id !== question.id));
      } else {
        playWrongSound();
        setFeedbackType("wrong");
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
          `不正解。正解は「${correctText}」${data.explanation ? ` — ${data.explanation}` : ""}`,
        );
      }

      const remaining = correct
        ? pool.filter((q) => q.id !== question.id)
        : [...pool];
      const next =
        remaining.length > 0
          ? remaining[Math.floor(Math.random() * remaining.length)]!
          : null;
      nextQuestionRef.current = next;
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
          ← マイページへ
        </Link>
      </div>
    );
  }

  if (pool.length === 0 && !question) {
    return (
      <div className="mx-auto max-w-lg flex flex-col gap-4 px-2">
        <p className="text-muted-foreground">ブックマーク穴埋めがありません。</p>
        <Link href="/me" className="text-sm text-primary hover:underline">
          ← マイページへ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-2 sm:gap-6 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          ブックマーク穴埋め
        </h1>
      </header>

      <Card className="flex flex-col gap-5 card-study border-0 bg-card p-4 sm:p-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          穴埋め（残り {pool.length}）
        </div>

        <div className="min-h-[120px]">
          <p className="text-base leading-relaxed text-foreground sm:text-lg">
            {question ? question.question_text : "—"}
          </p>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-2 sm:gap-4 sm:pt-2">
          {[1, 2, 3, 4].map((n) => {
            const isCorrectChoice = answered && n === correctChoiceNum;
            const isSelectedWrong = answered && n === selectedChoice && n !== correctChoiceNum;

            return (
              <Button
                key={n}
                type="button"
                variant="outline"
                className={`min-h-[52px] justify-start rounded-xl border-2 px-4 text-left text-sm font-medium transition-all sm:text-base
                  ${isCorrectChoice
                    ? "border-[oklch(0.55_0.16_145)] bg-[oklch(0.55_0.16_145/0.08)]"
                    : ""}
                  ${isSelectedWrong
                    ? "border-[oklch(0.55_0.18_30)] bg-[oklch(0.55_0.18_30/0.08)]"
                    : ""}
                  ${!answered ? "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]" : ""}
                `}
                disabled={answering || !question || answered}
                onClick={() => void answer(n)}
              >
                <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {n}
                </span>
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
                {isCorrectChoice && (
                  <span className="ml-auto text-[oklch(0.55_0.16_145)]">✓</span>
                )}
                {isSelectedWrong && (
                  <span className="ml-auto text-[oklch(0.55_0.18_30)]">✗</span>
                )}
              </Button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`slide-up rounded-2xl px-5 py-3 ${
              feedbackType === "correct" ? "feedback-correct" : "feedback-wrong"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {feedbackType === "correct" ? "✓" : "✗"}
              </span>
              <p className="text-sm font-medium">{feedback}</p>
            </div>
          </div>
        )}

        {answered && (
          <Button
            className="btn-primary-gradient min-h-[48px] rounded-xl text-base font-medium transition-transform active:scale-[0.97]"
            onClick={goToNextQuestion}
          >
            次の問題へ
          </Button>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Link href="/me" className="text-sm text-muted-foreground hover:text-foreground">
            ← マイページ
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
