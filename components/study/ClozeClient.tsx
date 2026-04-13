'use client';

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Flame } from "lucide-react";
import { playCorrectSound, playWrongSound, playXpGainSound, playStreakBonusSound } from "@/lib/sounds";
import {
  calculateXpGain,
  addXp,
  incrementDailyCount,
  recordStudyDay,
  isMilestoneStreak,
} from "@/lib/gamification";
import { pickFromDeck } from "@/lib/deck";

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

export function ClozeClient() {
  const [questionsPool, setQuestionsPool] = useState<ClozeQuestion[] | null>(null);
  const [question, setQuestion] = useState<ClozeQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [correctChoice, setCorrectChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const nextQuestionRef = useRef<ClozeQuestion | null>(null);
  const recentIdsRef = useRef<Set<string>>(new Set());

  function pickNextQuestion(pool: ClozeQuestion[]): ClozeQuestion | null {
    return pickFromDeck(pool, recentIdsRef.current, (q) => q.id);
  }

  const loadAllQuestions = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/study/cloze/questions");
      const json = (await response.json()) as QuestionsResponse;
      if (!response.ok || !json.ok) {
        setDownloadError("error" in json ? json.error : "読み込みに失敗しました");
        return;
      }
      const list = "questions" in json ? json.questions : [];
      if (list.length === 0) {
        setDownloadError("問題がありません");
        return;
      }
      setQuestionsPool(list);
      setQuestion(pickNextQuestion(list));
      setFeedback(null);
      setFeedbackType(null);
      setBookmarked(false);
    } catch {
      setDownloadError("ダウンロードに失敗しました");
    } finally {
      setDownloadLoading(false);
    }
  }, []);

  function goToNextQuestion() {
    if (nextQuestionRef.current) {
      setQuestion(nextQuestionRef.current);
      nextQuestionRef.current = null;
    }
    setFeedback(null);
    setFeedbackType(null);
    setSelectedChoice(null);
    setCorrectChoice(null);
    setAnswered(false);
    setBookmarked(false);
  }

  async function answer(choice: number) {
    if (!question || answered) return;
    setError(null);

    const correct = choice === question.correct_choice;
    setSelectedChoice(choice);
    setCorrectChoice(question.correct_choice);
    setAnswered(true);

    if (correct) {
      playCorrectSound();
      setFeedbackType("correct");
      setFeedback("正解! よくできました");
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
      playWrongSound();
      setFeedbackType("wrong");
      setStreak(0);
      incrementDailyCount();
      window.dispatchEvent(new Event("daily-progress-update"));
      const correctText =
        question[
          `choice_${question.correct_choice}` as
            | "choice_1"
            | "choice_2"
            | "choice_3"
            | "choice_4"
        ];
      setFeedback(
        `不正解。正解は「${correctText}」${
          question.explanation ? ` — ${question.explanation}` : ""
        }`,
      );
    }

    const currentId = question.id;
    const pool = questionsPool ?? [];
    const next = pickNextQuestion(pool);
    nextQuestionRef.current = next ?? (pool.length > 0 ? pool[0]! : null);

    void fetch("/api/study/cloze/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: currentId, choice }),
    });
  }

  if (questionsPool === null) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-2 sm:gap-8 sm:px-0">
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          穴埋め問題
        </h1>
        <Card className="card-study flex flex-col items-center justify-center gap-6 border-0 p-8 sm:p-12">
          <p className="text-center text-sm font-medium text-foreground">
            まず問題をダウンロード
          </p>
          <p className="text-center text-muted-foreground">
            下のボタンで問題を読み込んでから始めましょう。読み込み後はスムーズに解けます。
          </p>
          <Button
            className="btn-primary-gradient min-h-[48px] rounded-xl px-8 text-base font-medium transition-transform active:scale-[0.97]"
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
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-2 sm:gap-6 sm:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            穴埋め問題
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
      </header>

      <Card className="flex flex-col gap-5 card-study border-0 bg-card p-4 sm:p-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          穴埋め問題
        </div>

        <div className="min-h-[120px]">
          <p className="text-base leading-relaxed text-foreground sm:text-lg">
            {loading && !question
              ? "読み込み中..."
              : question
                ? question.question_text
                : "問題がありません"}
          </p>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-2 sm:gap-4 sm:pt-2">
          {[1, 2, 3, 4].map((n) => {
            const isCorrectChoice = answered && n === correctChoice;
            const isSelectedWrong = answered && n === selectedChoice && n !== correctChoice;

            return (
              <Button
                key={n}
                type="button"
                variant="outline"
                className={`min-h-[52px] justify-start rounded-xl border-2 px-4 text-left text-sm font-medium transition-all sm:text-base
                  ${isCorrectChoice
                    ? "border-[oklch(0.55_0.16_145)] bg-[oklch(0.55_0.16_145/0.08)] text-foreground"
                    : ""}
                  ${isSelectedWrong
                    ? "border-[oklch(0.55_0.18_30)] bg-[oklch(0.55_0.18_30/0.08)] text-foreground"
                    : ""}
                  ${!answered && !isCorrectChoice && !isSelectedWrong
                    ? "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                    : ""}
                `}
                disabled={loading || !question || answered}
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

        {/* Feedback panel */}
        {feedback && (
          <div
            className={`slide-up rounded-2xl px-5 py-3 ${
              feedbackType === "correct" ? "feedback-correct" : "feedback-wrong"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {feedbackType === "correct" ? "✓" : "✗"}
                </span>
                <p className="text-sm font-medium">{feedback}</p>
              </div>
              {xpGained !== null && feedbackType === "correct" && (
                <span className="text-sm font-bold opacity-90">+{xpGained} XP</span>
              )}
            </div>
          </div>
        )}

        {/* Next question button */}
        {answered && (
          <Button
            className="btn-primary-gradient min-h-[48px] rounded-xl text-base font-medium transition-transform active:scale-[0.97]"
            onClick={goToNextQuestion}
          >
            次の問題へ
          </Button>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            variant={bookmarked ? "secondary" : "ghost"}
            className="min-h-[44px] min-w-[44px] gap-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            disabled={loading || !question}
            onClick={async () => {
              if (!question) return;
              const next = !bookmarked;
              setBookmarked(next);
              try {
                const response = await fetch("/api/study/cloze/bookmark", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    questionId: question.id,
                    bookmarked: next,
                  }),
                });
                if (!response.ok) {
                  setError("ブックマークの更新に失敗しました");
                }
              } catch {
                setError("ブックマークの更新に失敗しました");
              }
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
          <p className="text-sm text-destructive" aria-live="polite">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
