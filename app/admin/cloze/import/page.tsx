import { Card } from "@/components/ui/card";
import { ClozeImportForm } from "@/components/admin/ClozeImportForm";

export const dynamic = "force-dynamic";

export default async function AdminClozeImportPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Import cloze questions (CSV)
          </h1>
          <a
            href="/admin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to admin
          </a>
        </header>
        <Card className="rounded-2xl border border-border p-8 shadow-sm">
          <ClozeImportForm />
        </Card>
      </div>
    </div>
  );
}

