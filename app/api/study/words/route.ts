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

  const { data: words, error } = await supabase
    .from("words")
    .select("id, english, japanese");

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  if (!words || words.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No words available", words: [] },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, words });
}
