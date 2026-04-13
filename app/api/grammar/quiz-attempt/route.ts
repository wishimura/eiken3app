import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  videoId?: string;
  correctCount?: number;
  totalCount?: number;
};

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as Body;
  const videoId = body.videoId?.trim();
  const correctCount = body.correctCount ?? 0;
  const totalCount = body.totalCount ?? 0;

  if (!videoId || totalCount < 1) {
    return NextResponse.json(
      { ok: false, error: "invalid payload" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("video_quiz_attempts").upsert(
    {
      user_id: user.id,
      video_id: videoId,
      correct_count: correctCount,
      total_count: totalCount,
      last_attempted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
