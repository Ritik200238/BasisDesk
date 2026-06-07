import type { ReactNode } from "react";

// Shows a specific cause and a recovery path. Never renders a generic "Something went
// wrong" (CLAUDE.md Section 5). `message` should name what failed; `detail` carries the
// upstream reason (status code, rate-limit, not-configured).
export function ErrorState({
  message,
  detail,
  retry,
}: {
  message: ReactNode;
  detail?: ReactNode;
  retry?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-down/30 bg-down/5 px-3 py-3">
      <p className="text-body text-down">{message}</p>
      {detail != null && <p className="text-micro text-muted">{detail}</p>}
      {retry != null && <div className="pt-1">{retry}</div>}
    </div>
  );
}
