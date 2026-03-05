import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("cloze_questions")
    .select("id, question_text, choice_1, choice_2, choice_3, choice_4")
    .limit(50);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No cloze questions available" },
      { status: 404 },
    );
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  const question = data[randomIndex]!;

  return NextResponse.json({ ok: true, question });
}

