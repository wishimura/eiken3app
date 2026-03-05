import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminClozePage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: questions, error } = await supabase
    .from("cloze_questions")
    .select("id, question_text, correct_choice, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6">
          <header className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Cloze questions
            </h1>
            <a
              href="/admin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to admin
            </a>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive shadow-sm">
            Failed to load cloze questions: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Cloze questions
          </h1>
          <a
            href="/admin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to admin
          </a>
        </header>
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="w-16 text-right">Correct</TableHead>
                <TableHead className="w-32 text-right">Created at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions && questions.length > 0 ? (
                questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-md truncate">
                      {q.question_text}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {q.correct_choice}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {q.created_at
                        ? new Date(q.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No cloze questions yet. Try importing from CSV.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

