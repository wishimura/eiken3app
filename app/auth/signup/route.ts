import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) {
    return NextResponse.redirect(
      new URL("/signup?error=signup_failed", request.url)
    );
  }

  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL("/signup?error=signup_failed", request.url)
    );
  }

  // Let Supabase's onAuthStateChange write session to our cookie store
  await new Promise((r) => setTimeout(r, 100));

  const url = new URL(request.url);
  const redirectUrl = new URL("/study", url.origin);
  const response = NextResponse.redirect(redirectUrl);
  return applyCookiesToResponse(response);
}
