import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Freshness of the underlying datapoint relative to now.
export type Freshness = "live" | "recent" | "stale" | "unavailable";

const freshnessDot: Record<Freshness, string> = {
  live: "bg-up",
  recent: "bg-accent",
  stale: "bg-warn",
  unavailable: "bg-ink-600",
};

interface ValueWithProvenanceProps {
  value: ReactNode;
  // The exact source, e.g. "SoDEX /markets/mark-prices" or "SoSoValue /etf/flows".
  source: string;
  asOf?: Date | number | string | null;
  freshness?: Freshness;
  className?: string;
}

// Wraps any datapoint with its source and fetch time. CLAUDE.md Section 2 requires
// provenance on every shown number; rendering through this primitive makes an unsourced
// value structurally impossible — `source` is a required prop.
export function ValueWithProvenance({
  value,
  source,
  asOf,
  freshness = "recent",
  className,
}: ValueWithProvenanceProps) {
  const asOfText = formatAsOf(asOf);
  const title = `Source: ${source}${asOfText ? ` — as of ${asOfText}` : ""} (${freshness})`;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={title}>
      <span>{value}</span>
      <span className={cn("size-1.5 shrink-0 rounded-full", freshnessDot[freshness])} aria-hidden />
    </span>
  );
}

function formatAsOf(asOf?: Date | number | string | null): string | null {
  if (asOf == null) return null;
  const d = asOf instanceof Date ? asOf : new Date(asOf);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toISOString().replace("T", " ").slice(0, 19)}Z`;
}
