import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  videoId?: string;
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

  if (!videoId) {
    return NextResponse.json(
      { ok: false, error: "videoId is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("video_progress").upsert(
    {
      user_id: user.id,
      video_id: videoId,
      watched_at: new Date().toISOString(),
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

export async function DELETE(request: Request) {
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

  if (!videoId) {
    return NextResponse.json(
      { ok: false, error: "videoId is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("video_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("video_id", videoId);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
