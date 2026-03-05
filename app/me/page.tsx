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

  // Cloze stats
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
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            My stats
          </h1>
          <a
            href="/study"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to study
          </a>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border border-border p-6 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total answers
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {totalAnswers}
            </div>
          </Card>
          <Card className="rounded-2xl border border-border p-6 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Correct
            </div>
            <div className="mt-2 text-2xl font-semibold text-primary">
              {totalCorrect}
            </div>
          </Card>
          <Card className="rounded-2xl border border-border p-6 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Accuracy
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
              {accuracy}%
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl border border-border p-6 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Cloze accuracy
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="text-2xl font-semibold text-foreground">
              {clozeAccuracy}%
            </div>
            <div className="text-xs text-muted-foreground">
              ({clozeCorrect} correct / {clozeTotal} answers)
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Bookmarked words
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>English</TableHead>
                  <TableHead>Japanese</TableHead>
                  <TableHead className="w-24 text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookmarked.length > 0 ? (
                  bookmarked.map((row) => (
                    <TableRow key={row.word_id}>
                      <TableCell>{row.words?.[0]?.english}</TableCell>
                      <TableCell>{row.words?.[0]?.japanese}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {row.correct_count} /{" "}
                        {row.correct_count + row.wrong_count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No bookmarks yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Bookmarked cloze questions
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-24 text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clozeBookmarked.length > 0 ? (
                  clozeBookmarked.map((row) => {
                    const q = row.cloze_questions?.[0];
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
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No cloze bookmarks yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

