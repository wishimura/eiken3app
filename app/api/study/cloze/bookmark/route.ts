import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type BookmarkBody = {
  questionId?: string;
  bookmarked?: boolean;
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

  const body = (await request.json().catch(() => ({}))) as BookmarkBody;
  const questionId = body.questionId;
  const bookmarked = body.bookmarked ?? false;

  if (!questionId) {
    return NextResponse.json(
      { ok: false, error: "questionId is required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("cloze_user_progress")
    .select("user_id, question_id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("cloze_user_progress")
      .update({
        bookmarked,
        last_answered_at: now,
      })
      .eq("user_id", user.id)
      .eq("question_id", questionId);

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
        question_id: questionId,
        correct_count: 0,
        wrong_count: 0,
        bookmarked,
        last_answered_at: now,
      });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

