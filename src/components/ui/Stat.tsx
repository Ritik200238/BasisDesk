import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatTone = "neutral" | "up" | "down" | "warn" | "accent";

const toneClass: Record<StatTone, string> = {
  neutral: "text-foreground",
  up: "text-up",
  down: "text-down",
  warn: "text-warn",
  accent: "text-accent",
};

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  // Inline context line: unit, timeframe, and/or provenance. CLAUDE.md Section 5 forbids
  // a bare number, so callers pass the qualifier here (e.g. "7d funding avg").
  context?: ReactNode;
  tone?: StatTone;
  size?: "stat" | "display";
  className?: string;
}

// A single labelled figure. The value renders in tabular monospace so digits never reflow.
export function Stat({ label, value, context, tone = "neutral", size = "stat", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          size === "display" ? "text-display" : "text-stat",
          toneClass[tone],
        )}
      >
        {value}
      </span>
      {context != null && <span className="text-micro text-faint">{context}</span>}
    </div>
  );
}
