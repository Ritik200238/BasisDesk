import { Card, Skeleton } from "@/components/ui";
import { getAllVaultQuotes } from "@/lib/vault";
import { VaultQuoteCard } from "./VaultQuoteCard";

// Async server component: reads live SoDEX funding at request time and renders a quote per
// vault. No wallet or API key required (public market data), so the cold-stranger first run
// sees real numbers immediately.
export async function VaultInsight() {
  const results = await getAllVaultQuotes();
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live market-neutral yield</h2>
        <p className="text-body text-muted">
          Funding rates read live from SoDEX testnet and annualized by the deterministic
          engine. No wallet needed to look.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => (
          <VaultQuoteCard key={r.ok ? r.quote.vault.id : r.vault.id} result={r} />
        ))}
      </div>
    </section>
  );
}

// Loading state shown while the live SoDEX read is in flight.
export function VaultInsightSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live market-neutral yield</h2>
        <p className="text-body text-muted">Reading live funding from SoDEX testnet…</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-10 w-32" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
