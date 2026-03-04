import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AnswerBody = {
  wordId?: string;
  correct?: boolean;
  mode?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as AnswerBody;
  const wordId = body.wordId;
  const correct = body.correct ?? false;

  if (!wordId) {
    return NextResponse.json(
      { ok: false, error: "wordId is required" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      correct_count: correct ? 1 : 0,
      wrong_count: correct ? 0 : 1,
      last_answered_at: now,
    },
    {
      onConflict: "user_id,word_id",
      ignoreDuplicates: false,
    },
  );

  if (upsertError) {
    // If conflict, try to increment existing row instead
    if (upsertError.code === "23505") {
      const field = correct ? "correct_count" : "wrong_count";
      const { error: updateError } = await supabase
        .from("user_progress")
        .update({
          [field]: supabase.rpc("noop") || undefined,
          last_answered_at: now,
        })
        .eq("user_id", user.id)
        .eq("word_id", wordId);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: updateError.message },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

