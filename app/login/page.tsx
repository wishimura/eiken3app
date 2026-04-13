import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/study");
  }

  const { error, status } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="nav-gradient px-4 pb-14 pt-16 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">
          英検3級 単語マスター
        </h1>
        <p className="mt-1.5 text-sm opacity-80">
          ログインして学習を始めましょう
        </p>
      </div>

      <div className="mx-auto -mt-8 w-full max-w-md px-4">
        <div className="card-study space-y-6 rounded-[20px] bg-card p-8">
          {status === "email_confirmed" && (
            <p
              className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary"
              role="status"
            >
              メールアドレスの確認が完了しました。ログインしてください。
            </p>
          )}
          {error === "invalid_credentials" && (
            <p
              className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              メールアドレスまたはパスワードが違います。
            </p>
          )}
          <form className="space-y-5" action="/auth/login" method="post">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                メールアドレス
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-xl border-border"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                パスワード
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-xl border-border"
              />
            </div>
            <Button
              type="submit"
              className="btn-primary-gradient w-full rounded-xl border-0 py-6 text-base font-medium transition-transform active:scale-[0.97]"
            >
              ログイン
            </Button>
          </form>
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              <a
                href="/forgot-password"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                パスワードをお忘れですか？
              </a>
            </p>
            <p>
              <a
                href="/signup"
                className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                新規登録はこちら
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
