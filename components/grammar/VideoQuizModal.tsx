"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, Circle } from "lucide-react";
import {
  calculateXpGain,
  addXp,
  incrementDailyCount,
  recordStudyDay,
} from "@/lib/gamification";
import {
  playCorrectSound,
  playLaterSound,
  playXpGainSound,
} from "@/lib/sounds";

type QuizQuestion = {
  id: string;
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: number;
  explanation: string | null;
};

type Props = {
  videoId: string;
  videoTitle?: string;
  onClose: () => void;
  onCompleted?: (correctCount: number, total: number) => void;
};

export function VideoQuizModal({
  videoId,
  videoTitle,
  onClose,
  onCompleted,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/grammar/quiz/${encodeURIComponent(videoId)}`,
        );
        const json = (await res.json()) as
          | { ok: true; questions: QuizQuestion[] }
          | { ok: false; error: string };
        if (!alive) return;
        if (!res.ok || !json.ok) {
          setError("error" in json ? json.error : "読み込みに失敗しました");
          setLoading(false);
          return;
        }
        setQuestions(json.questions);
        setLoading(false);
      } catch {
        if (!alive) return;
        setError("ネットワークエラーが発生しました");
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [videoId]);

  const current = questions[index];
  const total = questions.length;

  const submitAttempt = useCallback(
    async (correct: number) => {
      try {
        await fetch("/api/grammar/quiz-attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            correctCount: correct,
            totalCount: total,
          }),
        });
      } catch {
        // ignore
      }
    },
    [videoId, total],
  );

  const handleReveal = () => {
    if (selected === null || !current) return;
    setRevealed(true);
    const isCorrect = selected === current.correct_choice;
    if (isCorrect) {
      playCorrectSound();
      setCorrectCount((n) => n + 1);
      const xp = calculateXpGain(0);
      addXp(xp);
      incrementDailyCount();
      recordStudyDay();
      playXpGainSound();
      window.dispatchEvent(
        new CustomEvent("xp-gained", { detail: { gained: xp } }),
      );
      window.dispatchEvent(new Event("daily-progress-update"));
    } else {
      playLaterSound();
      incrementDailyCount();
      window.dispatchEvent(new Event("daily-progress-update"));
    }
  };

  const handleNext = async () => {
    if (index + 1 >= total) {
      setFinished(true);
      await submitAttempt(correctCount);
      onCompleted?.(correctCount, total);
      return;
    }
    setIndex((n) => n + 1);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-background shadow-2xl sm:rounded-[28px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              確認テスト
            </span>
            {videoTitle && (
              <span className="truncate text-sm font-medium text-foreground">
                {videoTitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              問題を読み込み中…
            </p>
          )}
          {error && (
            <p className="py-6 text-center text-sm text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && questions.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                この動画にはまだテストが用意されていません。
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            !finished &&
            current &&
            questions.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>
                    {index + 1} / {total} 問目
                  </span>
                  <span>
                    正解 {correctCount} / {index + (revealed ? 1 : 0)}
                  </span>
                </div>

                <div className="daily-progress-bar mb-5 h-1.5">
                  <div
                    className="daily-progress-fill h-full"
                    style={{ width: `${((index + 1) / total) * 100}%` }}
                  />
                </div>

                <p className="mb-4 text-base font-medium leading-relaxed text-foreground">
                  {current.question_text}
                </p>

                <ul className="flex flex-col gap-2.5">
                  {[1, 2, 3, 4].map((n) => {
                    const choiceText = current[
                      `choice_${n}` as keyof QuizQuestion
                    ] as string;
                    const isSelected = selected === n;
                    const isCorrect = current.correct_choice === n;
                    const showCorrect = revealed && isCorrect;
                    const showWrong = revealed && isSelected && !isCorrect;

                    return (
                      <li key={n}>
                        <button
                          type="button"
                          disabled={revealed}
                          onClick={() => setSelected(n)}
                          className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
                            showCorrect
                              ? "border-[oklch(0.55_0.16_145)] bg-[oklch(0.55_0.16_145)]/10"
                              : showWrong
                                ? "border-destructive bg-destructive/10"
                                : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-card"
                          } ${revealed ? "" : "active:scale-[0.98]"}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              showCorrect
                                ? "bg-[oklch(0.55_0.16_145)] text-white"
                                : showWrong
                                  ? "bg-destructive text-white"
                                  : isSelected
                                    ? "bg-primary text-white"
                                    : "bg-muted text-foreground"
                            }`}
                          >
                            {showCorrect ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : showWrong ? (
                              <X className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              <Circle className="h-2 w-2" fill="currentColor" />
                            )}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {choiceText}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {revealed && current.explanation && (
                  <div className="mt-4 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-foreground">
                    <span className="font-semibold text-primary">解説: </span>
                    {current.explanation}
                  </div>
                )}
              </>
            )}

          {finished && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-8 w-8" strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-foreground">完了!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctCount} / {total} 問正解
              </p>
              {correctCount === total && (
                <p className="mt-2 text-sm font-semibold text-[oklch(0.55_0.16_145)]">
                  🎉 全問正解!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && questions.length > 0 && !finished && (
          <div className="border-t border-border p-4">
            {!revealed ? (
              <Button
                onClick={handleReveal}
                disabled={selected === null}
                className="btn-primary-gradient min-h-[48px] w-full rounded-xl border-0 text-base font-medium"
              >
                答え合わせ
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="btn-primary-gradient min-h-[48px] w-full rounded-xl border-0 text-base font-medium"
              >
                {index + 1 >= total ? "結果を見る" : "次の問題"}
              </Button>
            )}
          </div>
        )}
        {finished && (
          <div className="border-t border-border p-4">
            <Button
              onClick={onClose}
              className="btn-primary-gradient min-h-[48px] w-full rounded-xl border-0 text-base font-medium"
            >
              閉じる
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
