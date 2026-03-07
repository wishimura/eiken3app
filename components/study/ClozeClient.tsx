'use client';

import { useCallback, useState } from "react";
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
  explanation?: string | null;
};

type QuestionsResponse =
  | { ok: true; questions: ClozeQuestion[] }
  | { ok: false; error: string };

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

export function ClozeClient() {
  const [questionsPool, setQuestionsPool] = useState<ClozeQuestion[] | null>(null);
  const [question, setQuestion] = useState<ClozeQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const loadAllQuestions = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/study/cloze/questions");
      const json = (await response.json()) as QuestionsResponse;
      if (!response.ok || !json.ok) {
        setDownloadError("error" in json ? json.error : "Failed to load questions");
        return;
      }
      const list = "questions" in json ? json.questions : [];
      if (list.length === 0) {
        setDownloadError("No questions available");
        return;
      }
      setQuestionsPool(list);
      setQuestion(pickRandomFromPool(list));
      setFeedback(null);
      setBookmarked(false);
    } catch {
      setDownloadError("Failed to download questions");
    } finally {
      setDownloadLoading(false);
    }
  }, []);

  const isPoolMode = questionsPool !== null && questionsPool.length > 0;

  async function answer(choice: number) {
    if (!question) return;
    setError(null);
    setFeedback(null);

    const correct = choice === question.correct_choice;
    if (correct) {
      playCorrectSound();
      setFeedback("Correct! よくできました。");
    } else {
      playWrongSound();
      const correctText =
        question[
          `choice_${question.correct_choice}` as
            | "choice_1"
            | "choice_2"
            | "choice_3"
            | "choice_4"
        ];
      setFeedback(
        `Incorrect. 正解は「${correctText}」${
          question.explanation ? ` – ${question.explanation}` : ""
        }`,
      );
    }

    const currentId = question.id;
    const pool = questionsPool ?? [];
    const next = pickRandomFromPool(pool, currentId);
    setQuestion(next ?? (pool.length > 0 ? pool[0]! : null));
    setBookmarked(false);

    void fetch("/api/study/cloze/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: currentId, choice }),
    });
  }

  if (questionsPool === null) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          穴埋め問題
        </h1>
        <Card className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-border p-8 shadow-md sm:p-12">
          <p className="text-center text-muted-foreground">
            問題をダウンロードしてから始めましょう。読み込み後はスムーズに解けます。
          </p>
          <Button
            className="btn-primary-gradient min-h-[48px] rounded-xl px-8 text-base font-medium"
            disabled={downloadLoading}
            onClick={() => void loadAllQuestions()}
          >
            {downloadLoading ? "ダウンロード中…" : "問題をダウンロード"}
          </Button>
          {downloadError && (
            <p className="text-center text-sm text-destructive">{downloadError}</p>
          )}
        </Card>
      </div>
    );
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
