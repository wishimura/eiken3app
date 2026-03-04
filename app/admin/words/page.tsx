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

export default async function AdminWordsPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: words, error } = await supabase
    .from("words")
    .select("id, english, japanese, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // For now show a simple error message in the table area.
    // In a real app you might want nicer error handling.
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6">
          <header className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Vocabulary
            </h1>
            <a
              href="/admin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to admin
            </a>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive shadow-sm">
            Failed to load words: {error.message}
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
            Vocabulary
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
                <TableHead>English</TableHead>
                <TableHead>Japanese</TableHead>
                <TableHead className="w-32 text-right">Created at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words && words.length > 0 ? (
                words.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell>{word.english}</TableCell>
                    <TableCell>{word.japanese}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {word.created_at
                        ? new Date(word.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm">
                    No vocabulary yet. Try importing from CSV.
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

