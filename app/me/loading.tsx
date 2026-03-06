export default function MeLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 animate-in fade-in duration-150">
      <div className="mx-auto max-w-xl">
        <div className="h-8 w-32 rounded-lg bg-muted/60" />
        <div className="mt-8 h-48 rounded-2xl border border-border bg-muted/30" />
        <div className="mt-6 h-64 rounded-2xl border border-border bg-muted/20" />
      </div>
    </div>
  );
}
