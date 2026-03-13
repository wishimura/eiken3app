import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnbookmarkWordButton } from "@/components/me/UnbookmarkWordButton";
import { UnbookmarkClozeButton } from "@/components/me/UnbookmarkClozeButton";
import { AccuracyCircle } from "@/components/me/AccuracyCircle";
import { LearningCalendar } from "@/components/me/LearningCalendar";
import { MeClientStats } from "@/components/me/MeClientStats";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows } = await supabase
    .from("user_progress")
    .select(
      "word_id, correct_count, wrong_count, last_answered_at, bookmarked, words (english, japanese)",
    )
    .order("last_answered_at", { ascending: false })
    .limit(200);

  const totalCorrect =
    rows?.reduce((sum, r) => sum + (r.correct_count ?? 0), 0) ?? 0;
  const totalWrong =
    rows?.reduce((sum, r) => sum + (r.wrong_count ?? 0), 0) ?? 0;
  const totalAnswers = totalCorrect + totalWrong;
  const accuracy =
    totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  const { data: bookmarkedRows } = await supabase
    .from("user_progress")
    .select(
      "word_id, correct_count, wrong_count, bookmarked, words (english, japanese)",
    )
    .eq("bookmarked", true)
    .order("last_answered_at", { ascending: false });

  const bookmarked = (bookmarkedRows ?? []) as any[];

  const { data: clozeRows } = await supabase
    .from("cloze_user_progress")
    .select("correct_count, wrong_count");

  const clozeCorrect =
    clozeRows?.reduce((sum, r) => sum + (r.correct_count ?? 0), 0) ?? 0;
  const clozeWrong =
    clozeRows?.reduce((sum, r) => sum + (r.wrong_count ?? 0), 0) ?? 0;
  const clozeTotal = clozeCorrect + clozeWrong;
  const clozeAccuracy =
    clozeTotal > 0 ? Math.round((clozeCorrect / clozeTotal) * 100) : 0;

  const { data: clozeBookmarkedRows } = await supabase
    .from("cloze_user_progress")
    .select(
      "question_id, correct_count, wrong_count, bookmarked, cloze_questions (question_text, choice_1, choice_2, choice_3, choice_4, correct_choice)",
    )
    .eq("bookmarked", true)
    .order("last_answered_at", { ascending: false });

  const clozeBookmarked = (clozeBookmarkedRows ?? []) as any[];

  return (
    <div className="min-h-screen bg-background px-4 py-8 pb-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            マイページ
          </h1>
        </header>

        {/* Accuracy circles */}
        <Card className="card-study border-0 p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <AccuracyCircle percentage={accuracy} label="単語 正答率" />
            <AccuracyCircle percentage={clozeAccuracy} label="穴埋め 正答率" />
          </div>
        </Card>

        {/* Client-side gamification stats */}
        <MeClientStats />

        {/* Learning calendar */}
        <Card className="card-study border-0 p-6">
          <LearningCalendar />
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-study border-0 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              総回答数
            </div>
            <div className="mt-1.5 text-2xl font-bold text-foreground">
              {totalAnswers}
            </div>
          </Card>
          <Card className="card-study border-0 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              正解数
            </div>
            <div className="mt-1.5 text-2xl font-bold text-primary">
              {totalCorrect}
            </div>
          </Card>
          <Card className="card-study border-0 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              穴埋め回答数
            </div>
            <div className="mt-1.5 text-2xl font-bold text-foreground">
              {clozeTotal}
            </div>
            <div className="text-xs text-muted-foreground">
              ({clozeCorrect}正解)
            </div>
          </Card>
        </div>

        {/* Bookmarked words */}
        <Card className="card-study border-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              ブックマーク単語
            </h2>
            {bookmarked.length > 0 && (
              <Link
                href="/study/bookmarks?tab=words"
                className="text-xs font-medium text-primary hover:underline"
              >
                ブックマークだけ練習 →
              </Link>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>英語</TableHead>
                  <TableHead>日本語</TableHead>
                  <TableHead className="w-24 text-right">スコア</TableHead>
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookmarked.length > 0 ? (
                  bookmarked.map((row) => (
                    <TableRow key={row.word_id}>
                      <TableCell>{row.words?.english ?? "—"}</TableCell>
                      <TableCell>{row.words?.japanese ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {row.correct_count} /{" "}
                        {row.correct_count + row.wrong_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <UnbookmarkWordButton wordId={row.word_id} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      ブックマークはまだありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Bookmarked cloze */}
        <Card className="card-study border-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              ブックマーク穴埋め
            </h2>
            {clozeBookmarked.length > 0 && (
              <Link
                href="/study/bookmarks?tab=cloze"
                className="text-xs font-medium text-primary hover:underline"
              >
                ブックマークだけ練習 →
              </Link>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>問題</TableHead>
                  <TableHead className="w-24 text-right">スコア</TableHead>
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clozeBookmarked.length > 0 ? (
                  clozeBookmarked.map((row) => {
                    const q = row.cloze_questions;
                    if (!q) return null;
                    const correctChoice = q.correct_choice as number;
                    const correctText =
                      q[
                        `choice_${correctChoice}` as
                          | "choice_1"
                          | "choice_2"
                          | "choice_3"
                          | "choice_4"
                      ];
                    return (
                      <TableRow key={row.question_id}>
                        <TableCell className="max-w-md">
                          {q.question_text.replace("( )", `(${correctText})`)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {row.correct_count} /{" "}
                          {row.correct_count + row.wrong_count}
                        </TableCell>
                        <TableCell className="text-right">
                          <UnbookmarkClozeButton questionId={row.question_id} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      ブックマークはまだありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Logout */}
        <form action="/auth/logout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="w-full rounded-xl border-destructive/30 py-6 text-base font-medium text-destructive hover:bg-destructive/5"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </form>
      </div>
    </div>
  );
}
