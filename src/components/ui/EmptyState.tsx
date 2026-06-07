import type { ReactNode } from "react";

// Shown when a fetch succeeded but there is genuinely nothing to display. Always offers a
// next action (CLAUDE.md Section 5: empty states carry a way forward).
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 py-6">
      <p className="text-body text-foreground">{title}</p>
      {hint != null && <p className="text-micro text-muted">{hint}</p>}
      {action != null && <div className="pt-1">{action}</div>}
    </div>
  );
}
