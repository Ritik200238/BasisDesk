import { Skeleton, ValueWithProvenance } from "@/components/ui";
import { narrateVault, type NarrationInput } from "@/lib/ai/narrate";

// Async server component: a grounded one-line explanation of the vault's state. The model
// only restates figures the engine computed; gated behind NVIDIA_API_KEY.
export async function VaultNarration({ input }: { input: NarrationInput }) {
  const r = await narrateVault(input);
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <span className="text-micro uppercase tracking-wide text-muted">What is happening · AI</span>
      {r.state === "ok" ? (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <p className="text-body leading-5 text-foreground">{r.summary}</p>
          <p className="text-micro text-muted">{r.caveat}</p>
          <ValueWithProvenance
            value={<span className="text-micro text-faint">grounded in {r.basis.join(", ")}</span>}
            source="BasisDesk engine + SoSoValue"
            asOf={r.asOf}
            freshness="recent"
          />
        </div>
      ) : r.state === "not_configured" ? (
        <p className="mt-1.5 text-micro leading-5 text-muted">
          Set NVIDIA_API_KEY to add a grounded one-line explanation. Every figure it cites is
          computed by the engine, not the model.
        </p>
      ) : (
        <p className="mt-1.5 text-micro text-muted">AI explanation unavailable right now.</p>
      )}
    </div>
  );
}

export function VaultNarrationSkeleton() {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <span className="text-micro uppercase tracking-wide text-muted">What is happening · AI</span>
      <div className="mt-2 flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
