"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function GuestLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        setError("ゲストログインに失敗しました");
        return;
      }
      router.push("/study");
      router.refresh();
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-border py-6 text-base font-medium transition-transform active:scale-[0.97]"
        disabled={loading}
        onClick={handleGuestLogin}
      >
        {loading ? "ログイン中…" : "ゲストとして始める"}
      </Button>
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
