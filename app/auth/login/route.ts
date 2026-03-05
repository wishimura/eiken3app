import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_credentials", request.url)
    );
  }

  // Let Supabase's onAuthStateChange write session to our cookie store
  await new Promise((r) => setTimeout(r, 0));

  const url = new URL(request.url);
  const redirectUrl = new URL("/study", url.origin);
  const response = NextResponse.redirect(redirectUrl);
  return applyCookiesToResponse(response);
}

