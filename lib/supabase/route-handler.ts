import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type CookieEntry = { name: string; value: string; options?: CookieOptions };

function parseRequestCookies(
  cookieHeader: string | null,
): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").flatMap((part) => {
    const [name, ...v] = part.trim().split("=");
    if (!name) return [];
    return [{ name, value: v.join("=").trim() }];
  });
}

export function createSupabaseClientForRoute(request: Request): {
  supabase: SupabaseClient;
  applyCookiesToResponse: (response: NextResponse) => NextResponse;
} {
  const cookieHeader = request.headers.get("cookie");
  const requestCookies = parseRequestCookies(cookieHeader);
  const cookiesToSet: CookieEntry[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookies: CookieEntry[]) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  function applyCookiesToResponse(response: NextResponse): NextResponse {
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  return { supabase, applyCookiesToResponse };
}
