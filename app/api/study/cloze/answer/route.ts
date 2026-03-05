import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AnswerBody = {
  questionId?: string;
  choice?: number;
};

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as AnswerBody;
  const questionId = body.questionId;
  const choice = body.choice;

  if (!questionId || typeof choice !== "number") {
    return NextResponse.json(
      { ok: false, error: "questionId and choice are required" },
      { status: 400 },
    );
  }

  const { data: question, error: questionError } = await supabase
    .from("cloze_questions")
    .select(
      "id, question_text, choice_1, choice_2, choice_3, choice_4, correct_choice, explanation",
    )
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) {
    return NextResponse.json(
      { ok: false, error: "Question not found" },
      { status: 404 },
    );
  }

  const correct = choice === question.correct_choice;

  // Update per-user progress
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("cloze_user_progress")
    .select("correct_count, wrong_count")
    .eq("user_id", user.id)
    .eq("question_id", question.id)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("cloze_user_progress")
      .update({
        correct_count: (existing.correct_count ?? 0) + (correct ? 1 : 0),
        wrong_count: (existing.wrong_count ?? 0) + (correct ? 0 : 1),
        last_answered_at: now,
      })
      .eq("user_id", user.id)
      .eq("question_id", question.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 400 },
      );
    }
  } else {
    const { error: insertError } = await supabase
      .from("cloze_user_progress")
      .insert({
        user_id: user.id,
        question_id: question.id,
        correct_count: correct ? 1 : 0,
        wrong_count: correct ? 0 : 1,
        last_answered_at: now,
      });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 400 },
      );
    }
  }

  // Also prepare a next question so the client only needs one round trip.
  const { data: candidates } = await supabase
    .from("cloze_questions")
    .select("id, question_text, choice_1, choice_2, choice_3, choice_4")
    .neq("id", question.id)
    .limit(50);

  const nextQuestion =
    candidates && candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]!
      : null;

  return NextResponse.json({
    ok: true,
    correct,
    correctChoice: question.correct_choice,
    explanation: question.explanation ?? null,
    nextQuestion,
  });
}

