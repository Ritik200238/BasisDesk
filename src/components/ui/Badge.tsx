import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Variants map to the core RiskState union (calm/watch/derisk) plus neutral/accent.
export type BadgeVariant = "neutral" | "calm" | "watch" | "derisk" | "accent";

const variantClass: Record<BadgeVariant, string> = {
  neutral: "border-border text-muted",
  calm: "border-calm/40 bg-calm/10 text-calm",
  watch: "border-watch/40 bg-watch/10 text-watch",
  derisk: "border-derisk/40 bg-derisk/10 text-derisk",
  accent: "border-accent/40 bg-accent/10 text-accent",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-micro font-medium uppercase tracking-wide",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
