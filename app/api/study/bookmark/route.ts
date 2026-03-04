import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type BookmarkBody = {
  wordId?: string;
  bookmarked?: boolean;
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

  const body = (await request.json().catch(() => ({}))) as BookmarkBody;
  const wordId = body.wordId;
  const bookmarked = body.bookmarked ?? true;

  if (!wordId) {
    return NextResponse.json(
      { ok: false, error: "wordId is required" },
      { status: 400 },
    );
  }

  const { data: existingRows, error: selectError } = await supabase
    .from("user_progress")
    .select("user_id, word_id")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .limit(1);

  if (selectError) {
    return NextResponse.json(
      { ok: false, error: selectError.message },
      { status: 400 },
    );
  }

  if (!existingRows || existingRows.length === 0) {
    const { error: insertError } = await supabase.from("user_progress").insert({
      user_id: user.id,
      word_id: wordId,
      bookmarked,
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 400 },
      );
    }
  } else {
    const { error: updateError } = await supabase
      .from("user_progress")
      .update({ bookmarked })
      .eq("user_id", user.id)
      .eq("word_id", wordId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

