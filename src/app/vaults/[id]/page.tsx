import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, type BadgeVariant, Card, ErrorState, Stat, ValueWithProvenance } from "@/components/ui";
import { DepositPreview } from "@/components/vault/DepositPreview";
import type { RiskState } from "@/lib/core";
import { escalateForFlow, getFlowRegime, getTopFlowNews, type FlowNewsResult } from "@/lib/flows";
import { getHistorySummary, type HistorySummary } from "@/lib/history";
import { formatBps, formatCompactUsd, formatPercent, formatPrice, formatSignedUsd } from "@/lib/format";
import { getVaultById, getVaultQuote } from "@/lib/vault";
import { getKlines, getTicker, type Kline, type SodexResult, type Ticker } from "@/lib/sodex";
import { PriceChart } from "@/components/vault/PriceChart";
import { NeutralitySimulator } from "@/components/vault/NeutralitySimulator";
import { cn } from "@/lib/cn";
import { Suspense } from "react";
import { VaultNarration, VaultNarrationSkeleton } from "@/components/vault/VaultNarration";
import type { NarrationInput } from "@/lib/ai/narrate";

export const dynamic = "force-dynamic";

const RISK_VARIANT: Record<RiskState, BadgeVariant> = { calm: "calm", watch: "watch", derisk: "derisk" };
const RISK_LABEL: Record<RiskState, string> = { calm: "Calm", watch: "Watch", derisk: "De-risk" };

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vault = getVaultById(id);
  if (!vault) notFound();

  const [quoteRes, flow, news, history, tickerRes, klinesRes] = await Promise.all([
    getVaultQuote(vault),
    getFlowRegime(vault.baseAsset),
    getTopFlowNews(vault.baseAsset),
    getHistorySummary(vault.baseAsset),
    getTicker(vault.symbol),
    getKlines(vault.symbol, "1h", 48),
  ]);

  const flowStance = flow.state === "ok" ? flow.regime.stance : undefined;
  const badgeState: RiskState = quoteRes.ok
    ? escalateForFlow(quoteRes.quote.risk.state, flowStance)
    : "calm";

  const narrationInput: NarrationInput | null = quoteRes.ok
    ? {
        vaultName: vault.name,
        symbol: vault.symbol,
        fundingAprPct: quoteRes.quote.fundingAprOnNotional * 100,
        fundingRateBpsPerHour: quoteRes.quote.fundingRatePerInterval * 10000,
        riskState: badgeState,
        riskReasons: quoteRes.quote.risk.reasons,
        liquidationDistancePct: quoteRes.quote.liquidationDistance * 100,
        flow:
          flow.state === "ok"
            ? {
                headline: flow.regime.headline,
                stance: flow.regime.stance,
                latestNetInflowUsdM: flow.regime.latestNetInflowUsd / 1_000_000,
              }
            : null,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/" className="text-micro text-muted transition-colors hover:text-foreground">
          ← All vaults
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-stat font-semibold tracking-tight text-foreground">{vault.name}</h1>
            <p className="text-body text-muted">
              {vault.symbol} · {vault.targetLeverage}x short hedge
            </p>
          </div>
          {quoteRes.ok && <Badge variant={RISK_VARIANT[badgeState]}>{RISK_LABEL[badgeState]}</Badge>}
        </div>
      </div>

      {!quoteRes.ok ? (
        <Card>
          <ErrorState
            message="Live data unavailable"
            detail="Could not read the SoDEX mark price for this market. Try again shortly."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Stat
              label="Funding APR (live, mainnet)"
              value={
                <ValueWithProvenance
                  value={formatPercent(quoteRes.quote.fundingAprOnNotional)}
                  source={quoteRes.quote.sources.markPrice}
                  asOf={quoteRes.quote.asOf}
                  freshness="live"
                />
              }
              context={`${quoteRes.quote.fundingPositive ? "Short earns" : "Short pays"} · ${formatBps(quoteRes.quote.fundingRatePerInterval, { dp: 2, signed: true })}/hr — varies`}
              tone={quoteRes.quote.fundingAprOnNotional >= 0 ? "up" : "down"}
              size="display"
            />

            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <SummaryField
                label={`Net on capital, ${vault.targetLeverage}x`}
                value={formatPercent(quoteRes.quote.fundingAprOnCapital)}
              />
              <SummaryField label="Mark price" value={formatPrice(quoteRes.quote.markPrice, { dp: 0 })} />
              <SummaryField
                label="Short liquidation room"
                value={formatPercent(quoteRes.quote.liquidationDistance)}
              />
              <SummaryField
                label="Maintenance margin"
                value={formatPercent(quoteRes.quote.maintenanceMarginRate)}
              />
            </div>

            <MarketBlock symbol={vault.symbol} ticker={tickerRes} klines={klinesRes} />

            <FlowBlock flow={flow} news={news} />

            {narrationInput && (
              <Suspense fallback={<VaultNarrationSkeleton />}>
                <VaultNarration input={narrationInput} />
              </Suspense>
            )}

            <p className="text-micro leading-5 text-muted">{vault.blurb}</p>

            <TrackRecord history={history} />
          </div>

          <DepositPreview
            vaultName={vault.name}
            symbol={vault.symbol}
            symbolId={quoteRes.quote.symbolId}
            baseAsset={vault.baseAsset}
            markPrice={quoteRes.quote.markPrice}
            leverage={vault.targetLeverage}
            maintenanceMarginRate={quoteRes.quote.maintenanceMarginRate}
            takerFee={quoteRes.quote.takerFee}
            fundingAprOnCapital={quoteRes.quote.fundingAprOnCapital}
          />
          </div>

          <NeutralitySimulator
            symbol={vault.symbol}
            baseAsset={vault.baseAsset}
            entryPrice={quoteRes.quote.markPrice}
            leverage={vault.targetLeverage}
            maintenanceMarginRate={quoteRes.quote.maintenanceMarginRate}
            takerFee={quoteRes.quote.takerFee}
            fundingAprOnNotional={quoteRes.quote.fundingAprOnNotional}
          />
        </div>
      )}
    </div>
  );
}

function FlowBlock({
  flow,
  news,
}: {
  flow: Awaited<ReturnType<typeof getFlowRegime>>;
  news: FlowNewsResult;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <span className="text-micro uppercase tracking-wide text-muted">
        Institutional flow · SoSoValue
      </span>
      {flow.state === "ok" ? (
        <div className="mt-1.5 flex flex-col gap-1">
          <ValueWithProvenance
            value={<span className="font-mono text-body text-foreground">{flow.regime.headline}</span>}
            source="SoSoValue /etfs/summary-history"
            asOf={flow.asOf}
            freshness="recent"
          />
          <span className="text-micro text-muted">
            Latest{" "}
            <span className={flow.regime.latestNetInflowUsd >= 0 ? "text-up" : "text-down"}>
              {formatSignedUsd(flow.regime.latestNetInflowUsd, { compact: true, dp: 1 })}
            </span>
            {flow.regime.aumUsd != null ? ` · AUM ${formatCompactUsd(flow.regime.aumUsd)}` : ""}
          </span>
        </div>
      ) : flow.state === "not_configured" ? (
        <p className="mt-1.5 text-micro leading-5 text-muted">
          Add a SoSoValue API key to drive de-risk from live ETF flows.
        </p>
      ) : flow.state === "empty" ? (
        <p className="mt-1.5 text-micro text-muted">No recent ETF-flow data for this asset.</p>
      ) : (
        <p className="mt-1.5 text-micro text-muted">SoSoValue flow unavailable ({flow.error.kind}).</p>
      )}
      {news.state === "ok" && news.item.title && (
        <a
          href={news.item.sourceLink ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block border-t border-border pt-2 text-micro leading-5 text-muted transition-colors hover:text-accent"
        >
          <span className="text-faint">Why: </span>
          {news.item.title}
        </a>
      )}
    </div>
  );
}

function MarketBlock({
  symbol,
  ticker,
  klines,
}: {
  symbol: string;
  ticker: SodexResult<Ticker>;
  klines: SodexResult<Kline[]>;
}) {
  // klines arrive newest-first; reverse to read left-to-right in time.
  const series = klines.ok
    ? klines.data
        .map((k) => Number(k.c))
        .filter((n) => Number.isFinite(n))
        .reverse()
    : [];
  const mark = ticker.ok ? Number(ticker.data.markPrice) : null;
  const oiNotional =
    ticker.ok && ticker.data.openInterest && mark ? Number(ticker.data.openInterest) * mark : null;
  const vol = ticker.ok && ticker.data.quoteVolume ? Number(ticker.data.quoteVolume) : null;
  const changePct = ticker.ok ? ticker.data.changePct ?? null : null;

  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-micro uppercase tracking-wide text-muted">
          {symbol} · last 48h · SoDEX
        </span>
        {changePct != null && (
          <span className={cn("font-mono text-micro", changePct >= 0 ? "text-up" : "text-down")}>
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>
      {series.length >= 2 ? (
        <PriceChart points={series} className="mt-2" />
      ) : (
        <p className="mt-2 text-micro text-muted">Price history unavailable.</p>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2">
        <MiniStat label="Mark" value={mark != null ? formatPrice(mark, { dp: 0 }) : "—"} />
        <MiniStat label="Open interest" value={oiNotional != null ? formatCompactUsd(oiNotional) : "—"} />
        <MiniStat label="24h volume" value={vol != null ? formatCompactUsd(vol) : "—"} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-micro uppercase tracking-wide text-faint">{label}</span>
      <span className="font-mono text-body text-foreground">{value}</span>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-lead text-foreground">{value}</span>
    </div>
  );
}

function TrackRecord({ history }: { history: HistorySummary }) {
  if (history.count === 0) {
    return (
      <p className="text-micro leading-5 text-faint">
        Track record begins now. BasisDesk logs each funding reading to build history beyond
        SoSoValue&apos;s ~30-day window.
      </p>
    );
  }
  const since = history.firstTs ? new Date(history.firstTs).toISOString().slice(0, 10) : "—";
  return (
    <p className="text-micro leading-5 text-muted">
      {history.count} funding readings logged since {since}
      {history.fundingAprChange != null
        ? ` · ${formatPercent(history.fundingAprChange, { signed: true })} since the last reading`
        : ""}
      .
    </p>
  );
}
