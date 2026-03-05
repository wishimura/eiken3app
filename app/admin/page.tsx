import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Admin check is performed server-side via SQL policies.

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-xl min-w-0">
        <Card className="flex flex-col gap-6 rounded-2xl border border-border p-8 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Admin dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage vocabulary for the Eiken Grade 3 flashcards.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full rounded-xl py-6 text-base font-medium">
              <a href="/admin/words">Vocabulary list</a>
            </Button>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-border py-6 text-base font-medium"
              >
                <a href="/admin/import">Import vocabulary CSV</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-border py-6 text-base font-medium"
              >
                <a href="/admin/cloze/import">Import cloze CSV</a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

