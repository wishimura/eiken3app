import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?status=email_confirmed", url.origin));
  }

  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // PKCEコードの交換失敗（別ブラウザで開いた等）でもメール確認自体は成功している
    // ログイン画面で「メール確認完了、ログインしてください」と表示
    return NextResponse.redirect(new URL("/login?status=email_confirmed", url.origin));
  }

  const type = url.searchParams.get("type");
  const redirectPath = type === "recovery" ? "/update-password" : "/study";
  const response = NextResponse.redirect(new URL(redirectPath, url.origin));
  return applyCookiesToResponse(response);
}
