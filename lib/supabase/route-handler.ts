import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function setCookieHeader(
  name: string,
  value: string,
  options: Record<string, unknown> = {}
): string {
  const maxAge = value ? 60 * 60 * 24 * 7 : 0;
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type CookieEntry = { name: string; value: string; options?: Record<string, unknown> };

function parseRequestCookies(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const [name, ...v] = part.trim().split("=");
    if (name) map.set(name, v.join("=").trim());
  }
  return map;
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
      get(name: string) {
        return requestCookies.get(name) ?? null;
      },
      async set(name: string, value: string, options?: Record<string, unknown>) {
        cookiesToSet.push({ name, value, options });
      },
      async remove(name: string, options?: Record<string, unknown>) {
        cookiesToSet.push({ name, value: "", options });
      },
    },
  });

  function applyCookiesToResponse(response: NextResponse): NextResponse {
    for (const { name, value, options } of cookiesToSet) {
      response.headers.append(
        "Set-Cookie",
        setCookieHeader(name, value, (options as Record<string, unknown>) ?? {})
      );
    }
    return response;
  }

  return { supabase, applyCookiesToResponse };
}
