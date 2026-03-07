import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("user_progress")
    .select("word_id, words (id, english, japanese)")
    .eq("user_id", user.id)
    .eq("bookmarked", true)
    .order("last_answered_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  const words = (rows ?? [])
    .map((r) => (r as { words: { id: string; english: string; japanese: string } | null }).words)
    .filter((w): w is { id: string; english: string; japanese: string } => w != null);

  return NextResponse.json({ ok: true, words });
}
