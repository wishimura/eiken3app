"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("パスワードの更新に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    router.push("/study");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="nav-gradient px-4 pb-14 pt-16 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">
          英検3級 単語マスター
        </h1>
        <p className="mt-1.5 text-sm opacity-80">新しいパスワードを設定</p>
      </div>

      <div className="mx-auto -mt-8 w-full max-w-md px-4">
        <div className="card-study space-y-6 rounded-[20px] bg-card p-8">
          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                新しいパスワード
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="rounded-xl border-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary-gradient w-full rounded-xl border-0 py-6 text-base font-medium transition-transform active:scale-[0.97]"
            >
              {loading ? "更新中..." : "パスワードを更新"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
