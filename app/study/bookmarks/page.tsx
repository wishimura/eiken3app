import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BookmarkedPracticeSwitcherWithSuspense } from "@/components/study/bookmarks/BookmarkedPracticeSwitcher";

export const dynamic = "force-dynamic";

export default async function StudyBookmarksPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <BookmarkedPracticeSwitcherWithSuspense />
    </div>
  );
}
