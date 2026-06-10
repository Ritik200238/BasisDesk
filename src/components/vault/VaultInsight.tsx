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

  // Zip each quote with its flow + price series, then rank by funding APR so the trades that pay
  // most lead the board. Errored quotes sort last.
  const rows = quotes.map((q, i) => {
    const kl = klines[i];
    const series = kl?.ok
      ? kl.data.map((k) => Number(k.c)).filter((n) => Number.isFinite(n)).reverse()
      : undefined;
    return { q, flow: flows[i], series };
  });
  rows.sort((a, b) => {
    const fa = a.q.ok ? a.q.quote.fundingAprOnNotional : Number.NEGATIVE_INFINITY;
    const fb = b.q.ok ? b.q.quote.fundingAprOnNotional : Number.NEGATIVE_INFINITY;
    return fb - fa;
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live basis-trade board</h2>
        <p className="text-body text-muted">
          Funding is live from SoDEX mainnet — it decides which delta-neutral trades pay right now,
          ranked here by funding. SoSoValue ETF flows set the de-risk signal. Execution runs on the
          testnet sandbox; no wallet needed to look.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ q, flow, series }) => (
          <VaultQuoteCard
            key={q.ok ? q.quote.vault.id : q.vault.id}
            result={q}
            flow={flow}
            priceSeries={series}
          />
        ))}
      </div>
    </section>
  );
}

// Loading state shown while the live SoDEX + SoSoValue reads are in flight.
export function VaultInsightSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lead font-medium text-foreground">Live basis-trade board</h2>
        <p className="text-body text-muted">Reading live funding and ETF flows…</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
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
