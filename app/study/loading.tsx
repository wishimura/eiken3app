export default function StudyLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 animate-in fade-in duration-150">
      <div className="mx-auto max-w-lg">
        <div className="h-8 w-24 rounded-lg bg-muted/60" />
        <div className="mt-8 h-[280px] rounded-2xl border border-border bg-muted/30" />
        <div className="mt-6 flex gap-3">
          <div className="h-14 flex-1 rounded-xl bg-muted/50" />
          <div className="h-14 flex-1 rounded-xl bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
