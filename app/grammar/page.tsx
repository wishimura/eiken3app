import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GrammarClient } from "@/components/grammar/GrammarClient";

export const dynamic = "force-dynamic";

const PLAYLIST_ID = "PL4XvPDGlQIXzcAw-I7w8LNsyblSUr7KLR";

export default async function GrammarPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: progressRows } = await supabase
    .from("video_progress")
    .select("video_id");

  const watchedIds = (progressRows ?? []).map((r) => r.video_id as string);

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <GrammarClient
          playlistId={PLAYLIST_ID}
          initialWatchedIds={watchedIds}
        />
      </div>
    </div>
  );
}
