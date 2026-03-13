import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return NextResponse.redirect(
      new URL("/signup?error=signup_failed", request.url),
    );
  }

  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/signup?error=signup_failed", request.url),
    );
  }

  const url = new URL(request.url);

  // If no session is returned, email confirmation is required
  if (!data.session) {
    const redirectUrl = new URL("/signup?status=check_email", url.origin);
    const response = NextResponse.redirect(redirectUrl);
    return applyCookiesToResponse(response);
  }

  const redirectUrl = new URL("/study", url.origin);
  const response = NextResponse.redirect(redirectUrl);
  return applyCookiesToResponse(response);
}
