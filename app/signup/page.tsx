import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/study");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            新規登録
          </h1>
          <p className="text-sm text-muted-foreground">
            メールアドレスとパスワードを設定してください
          </p>
        </div>
        {error === "signup_failed" && (
          <p
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            登録に失敗しました。別のメールアドレスか、6文字以上のパスワードを試してください。
          </p>
        )}
        <form
          className="space-y-5"
          action="/auth/signup"
          method="post"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
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
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              パスワード（6文字以上）
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-xl border-border"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl py-6 text-base font-medium"
          >
            登録する
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <a
            href="/login"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            すでにアカウントがある方はログイン
          </a>
        </p>
      </div>
    </div>
  );
}
