import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { videoId } = await params;
  if (!videoId) {
    return NextResponse.json(
      { ok: false, error: "videoId is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("video_quiz_questions")
    .select(
      "id, question_text, choice_1, choice_2, choice_3, choice_4, correct_choice, explanation, display_order",
    )
    .eq("video_id", videoId)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, questions: data ?? [] });
}
