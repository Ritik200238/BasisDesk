import { Card, Skeleton } from "@/components/ui";
import { getFlowRegime } from "@/lib/flows";
import { getKlines } from "@/lib/sodex";
import { VAULTS, getAllVaultQuotes } from "@/lib/vault";
import { VaultQuoteCard } from "./VaultQuoteCard";

// Async server component: reads live SoDEX funding and SoSoValue ETF flows at request time
// and renders a quote per vault. Funding (SoDEX) needs no key; the flow-driven de-risk signal
// (SoSoValue) lights up once a key is set. No wallet required to view either.
export async function VaultInsight() {
  const [quotes, flows, klines] = await Promise.all([
    getAllVaultQuotes(),
    Promise.all(VAULTS.map((v) => getFlowRegime(v.baseAsset))),
    Promise.all(VAULTS.map((v) => getKlines(v.symbol, "1h", 48))),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live market-neutral yield</h2>
        <p className="text-body text-muted">
          Funding rates from SoDEX testnet, annualized by the deterministic engine. SoSoValue
          ETF flows set the de-risk signal. No wallet needed to look.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((q, i) => {
          const kl = klines[i];
          const series = kl?.ok
            ? kl.data.map((k) => Number(k.c)).filter((n) => Number.isFinite(n)).reverse()
            : undefined;
          return (
            <VaultQuoteCard
              key={q.ok ? q.quote.vault.id : q.vault.id}
              result={q}
              flow={flows[i]}
              priceSeries={series}
            />
          );
        })}
      </div>
    </section>
  );
}

// Loading state shown while the live SoDEX + SoSoValue reads are in flight.
export function VaultInsightSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live market-neutral yield</h2>
        <p className="text-body text-muted">Reading live funding and ETF flows…</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
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
              <Skeleton className="h-12" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
