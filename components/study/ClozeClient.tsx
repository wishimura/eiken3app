'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ClozeQuestion = {
  id: string;
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
};

type NextResponse =
  | { ok: true; question: ClozeQuestion }
  | { ok: false; error: string };

type AnswerResponse = {
  ok: boolean;
  correct?: boolean;
  correctChoice?: number;
  explanation?: string | null;
  nextQuestion?: ClozeQuestion | null;
  error?: string;
};

export function ClozeClient() {
  const [question, setQuestion] = useState<ClozeQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
   const [bookmarked, setBookmarked] = useState(false);

  async function loadNext() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/study/cloze/next");
      const json = (await response.json()) as NextResponse;
      if (!response.ok || !json.ok) {
        setError(
          "error" in json ? json.error : "Failed to load cloze question",
        );
        setQuestion(null);
        return;
      }
      setQuestion(json.question);
      setFeedback(null);
      setBookmarked(false);
    } catch {
      setError("Unexpected error while loading cloze question");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNext();
  }, []);

  async function answer(choice: number) {
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/study/cloze/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId: question.id, choice }),
      });
      const json = (await response.json().catch(() => null)) as
        | AnswerResponse
        | null;

      if (!response.ok || !json?.ok) {
        setError(json?.error ?? "Failed to record answer");
        return;
      }

      const correctChoice = json.correctChoice ?? 0;
      const correctText =
        question[
          `choice_${correctChoice}` as
            | "choice_1"
            | "choice_2"
            | "choice_3"
            | "choice_4"
        ];

      if (json.correct) {
        setFeedback("Correct! よくできました。");
      } else {
        setFeedback(
          `Incorrect. 正解は「${correctText}」${
            json.explanation ? ` – ${json.explanation}` : ""
          }`,
        );
      }

      if (json.nextQuestion) {
        setQuestion(json.nextQuestion);
        setBookmarked(false);
      } else {
        await loadNext();
      }
    } catch {
      setError("Unexpected error while recording answer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          穴埋め問題
        </h1>
      </header>

      <Card className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-md sm:p-8">
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Cloze question
        </div>

        <div className="min-h-[140px]">
          <p className="text-base leading-relaxed text-foreground sm:text-lg">
            {loading && !question
              ? "Loading..."
              : question
                ? question.question_text
                : "No questions available"}
          </p>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2 sm:gap-4 sm:pt-4">
          {[1, 2, 3, 4].map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              className="min-h-[44px] justify-start rounded-xl border-border text-left text-sm font-medium sm:text-base"
              disabled={loading || !question}
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

        <div className="flex justify-end border-t border-border pt-4">
          <Button
            type="button"
            size="sm"
            variant={bookmarked ? "secondary" : "ghost"}
            className="min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground"
            disabled={loading || !question}
            onClick={async () => {
              if (!question) return;
              const next = !bookmarked;
              setBookmarked(next);
              try {
                const response = await fetch("/api/study/cloze/bookmark", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    questionId: question.id,
                    bookmarked: next,
                  }),
                });
                if (!response.ok) {
                  setError("Failed to update bookmark");
                }
              } catch {
                setError("Failed to update bookmark");
              }
            }}
          >
            {bookmarked ? "★ Bookmark" : "☆ Bookmark"}
          </Button>
        </div>

        {feedback && (
          <p className="pt-1 text-sm text-foreground sm:pt-2">{feedback}</p>
        )}
        {error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}

