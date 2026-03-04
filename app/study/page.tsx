import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StudyClient } from "@/components/study/StudyClient";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <StudyClient />
    </div>
  );
}

