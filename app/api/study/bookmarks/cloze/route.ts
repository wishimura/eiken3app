import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ClozeQuestion = {
  id: string;
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: number;
};

type ClozeProgressRow = {
  question_id: string;
  cloze_questions: ClozeQuestion | ClozeQuestion[] | null;
};

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

  const raw = (rows ?? []) as ClozeProgressRow[];
  const questions: ClozeQuestion[] = raw.flatMap((r) => {
    const q = r.cloze_questions;
    if (q == null) return [];
    return Array.isArray(q) ? q : [q];
  });

  return NextResponse.json({ ok: true, questions });
}
