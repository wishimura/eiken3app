export default function StudyLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 animate-in fade-in duration-150">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Daily progress skeleton */}
        <div className="h-2.5 w-full rounded-full bg-muted/50" />
        {/* XP + tabs */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-28 rounded-full bg-muted/40" />
          <div className="h-9 w-40 rounded-full bg-muted/40" />
        </div>
        {/* Card skeleton */}
        <div className="h-[360px] rounded-[20px] bg-muted/30" />
        {/* Buttons */}
        <div className="flex gap-3">
          <div className="h-14 flex-1 rounded-xl bg-muted/40" />
          <div className="h-14 flex-1 rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
