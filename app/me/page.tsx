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

  const bookmarked =
    (bookmarkedRows ?? []) as {
      word_id: number;
      correct_count: number | null;
      wrong_count: number | null;
      bookmarked: boolean;
      words:
        | {
            english: string | null;
            japanese: string | null;
          }
        | null;
    }[];

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
                      <TableCell>{row.words?.english}</TableCell>
                      <TableCell>{row.words?.japanese}</TableCell>
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
      </div>
    </div>
  );
}

