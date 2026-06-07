import { cn } from "@/lib/cn";

// Loading placeholder. Used while a real fetch is in flight — never as a stand-in for
// data that failed or is absent (those get ErrorState / EmptyState).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-ink-800", className)} aria-hidden />;
}
