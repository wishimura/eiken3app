import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");

  const url = new URL(request.url);
  const redirectTo = `${url.origin}/auth/callback?type=recovery`;

  const { supabase } = createSupabaseClientForRoute(request);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/forgot-password?error=failed", url.origin)
    );
  }

  return NextResponse.redirect(
    new URL("/forgot-password?sent=1", url.origin)
  );
}
