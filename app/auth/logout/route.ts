import { NextResponse } from "next/server";
import { createSupabaseClientForRoute } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  const { supabase, applyCookiesToResponse } =
    createSupabaseClientForRoute(request);
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login", url.origin));
  return applyCookiesToResponse(response);
}
