import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", url.origin));
  }

  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", url.origin));
  }

  const response = NextResponse.redirect(new URL("/study", url.origin));
  return applyCookiesToResponse(response);
}
