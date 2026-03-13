import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="nav-gradient px-4 pb-14 pt-16 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">管理ダッシュボード</h1>
        <p className="mt-1.5 text-sm opacity-80">
          英検3級の単語・穴埋め問題を管理
        </p>
      </div>

      <div className="mx-auto -mt-8 w-full max-w-md px-4">
        <div className="card-study flex flex-col gap-3 rounded-[20px] bg-card p-8">
          <Button
            asChild
            className="btn-primary-gradient w-full rounded-xl border-0 py-6 text-base font-medium transition-transform active:scale-[0.97]"
          >
            <a href="/admin/words">単語リスト</a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-border py-6 text-base font-medium"
          >
            <a href="/admin/import">単語 CSV インポート</a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-border py-6 text-base font-medium"
          >
            <a href="/admin/cloze/import">穴埋め CSV インポート</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

