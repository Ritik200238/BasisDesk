import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Omit the native `title` attribute so our richer ReactNode title does not collide with
// the DOM string `title`.
interface CardProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Panel container. Optional header row holds a title/subtitle on the left and actions
// (e.g. a timeframe toggle) on the right.
export function Card({ title, subtitle, actions, className, children, ...rest }: CardProps) {
  const hasHeader = title != null || actions != null;
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)} {...rest}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title != null && <h3 className="text-body font-medium text-foreground">{title}</h3>}
            {subtitle != null && <p className="mt-0.5 text-micro text-muted">{subtitle}</p>}
          </div>
          {actions != null && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
