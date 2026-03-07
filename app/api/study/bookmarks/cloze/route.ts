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

  const { data: rows, error } = await supabase
    .from("cloze_user_progress")
    .select(
      "question_id, cloze_questions (id, question_text, choice_1, choice_2, choice_3, choice_4, correct_choice)",
    )
    .eq("user_id", user.id)
    .eq("bookmarked", true)
    .order("last_answered_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  const questions = (rows ?? [])
    .map((r) => (r as { cloze_questions: Record<string, unknown> | null }).cloze_questions)
    .filter(
      (q): q is { id: string; question_text: string; choice_1: string; choice_2: string; choice_3: string; choice_4: string; correct_choice: number } =>
        q != null && typeof (q as { id?: string }).id === "string",
    );

  return NextResponse.json({ ok: true, questions });
}
