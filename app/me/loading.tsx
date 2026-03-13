export default function MeLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 animate-in fade-in duration-150">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Title */}
        <div className="mx-auto h-7 w-24 rounded-lg bg-muted/50" />
        {/* Accuracy circles */}
        <div className="flex justify-around rounded-[20px] bg-muted/20 p-8">
          <div className="h-[130px] w-[130px] rounded-full bg-muted/30" />
          <div className="h-[130px] w-[130px] rounded-full bg-muted/30" />
        </div>
        {/* Rank + Streak */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-20 rounded-[20px] bg-muted/25" />
          <div className="h-20 rounded-[20px] bg-muted/25" />
        </div>
        {/* Calendar */}
        <div className="h-16 rounded-[20px] bg-muted/20" />
        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-20 rounded-[20px] bg-muted/25" />
          <div className="h-20 rounded-[20px] bg-muted/25" />
          <div className="h-20 rounded-[20px] bg-muted/25" />
        </div>
      </div>
    </div>
  );
}
