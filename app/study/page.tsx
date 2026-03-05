import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StudySwitcher } from "@/components/study/StudySwitcher";

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
      <StudySwitcher />
    </div>
  );
}

