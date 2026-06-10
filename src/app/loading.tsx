// Route-level loading UI: shown instantly on navigation while a page's server components fetch
// live data, so navigation never feels frozen.
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2 text-muted">
        <span className="size-2 animate-pulse rounded-sm bg-accent" aria-hidden />
        <span className="text-body">Loading live data…</span>
      </div>
    </div>
  );
}
