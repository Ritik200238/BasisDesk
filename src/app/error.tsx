"use client";

import { Button } from "@/components/ui";

// Route-segment error boundary: catches render/runtime errors in a page subtree and offers a
// retry, instead of a blank screen. Server errors are logged by the platform; the digest links
// the user-facing event to the server log.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-3">
      <h2 className="text-lead font-medium text-foreground">Something went wrong</h2>
      <p className="max-w-md text-body text-muted">
        A transient error occurred while loading this view. The live reads may have hiccuped — try
        again.
      </p>
      {error.digest && <p className="font-mono text-micro text-faint">ref: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
