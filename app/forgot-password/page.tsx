import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="nav-gradient px-4 pb-14 pt-16 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">
          英検3級 単語マスター
        </h1>
        <p className="mt-1.5 text-sm opacity-80">パスワードの再設定</p>
      </div>

      <div className="mx-auto -mt-8 w-full max-w-md px-4">
        <div className="card-study space-y-6 rounded-[20px] bg-card p-8">
          {sent === "1" ? (
            <div className="space-y-4 text-center">
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                再設定用メールを送信しました。メールをご確認ください。
              </p>
              <a
                href="/login"
                className="block text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                ログインに戻る
              </a>
            </div>
          ) : (
            <>
              {error === "failed" && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  メール送信に失敗しました。メールアドレスを確認してください。
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                登録したメールアドレスを入力すると、パスワード再設定用のリンクをお送りします。
              </p>
              <form className="space-y-5" action="/auth/forgot-password" method="post">
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
                <Button
                  type="submit"
                  className="btn-primary-gradient w-full rounded-xl border-0 py-6 text-base font-medium transition-transform active:scale-[0.97]"
                >
                  再設定メールを送信
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                <a
                  href="/login"
                  className="font-medium text-primary underline underline-offset-2 hover:no-underline"
                >
                  ログインに戻る
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
