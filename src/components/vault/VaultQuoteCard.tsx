import Link from "next/link";
import { Badge, type BadgeVariant, Card, ErrorState, Stat, ValueWithProvenance } from "@/components/ui";
import type { RiskState } from "@/lib/core";
import { escalateForRegime, type FlowRegimeResult, type FlowStance } from "@/lib/flows";
import { formatBps, formatCompactUsd, formatPercent, formatPrice, formatSignedUsd } from "@/lib/format";
import type { SodexErrorKind } from "@/lib/sodex";
import type { VaultQuoteResult } from "@/lib/vault";
import { cn } from "@/lib/cn";
import { PriceChart } from "./PriceChart";

const RISK_VARIANT: Record<RiskState, BadgeVariant> = { calm: "calm", watch: "watch", derisk: "derisk" };
const RISK_LABEL: Record<RiskState, string> = { calm: "Calm", watch: "Watch", derisk: "De-risk" };

const STANCE_DOT: Record<FlowStance, string> = {
  supportive: "bg-up",
  neutral: "bg-ink-500",
  caution: "bg-down",
};
const STANCE_TEXT: Record<FlowStance, string> = {
  supportive: "text-up",
  neutral: "text-foreground",
  caution: "text-down",
};

function minutesUntil(ts: number, fromIso: string): number | null {
  const from = Date.parse(fromIso);
  if (Number.isNaN(from)) return null;
  return Math.max(0, Math.round((ts - from) / 60_000));
}

function sodexErrorDetail(kind: SodexErrorKind): string {
  switch (kind) {
    case "rate_limited":
      return "SoDEX rate limit reached; refreshes on the next load.";
    case "timeout":
      return "SoDEX did not respond in time.";
    case "network":
      return "Could not reach the SoDEX gateway.";
    case "schema":
      return "SoDEX returned an unexpected response shape.";
    case "unauthorized":
      return "SoDEX rejected the request.";
    default:
      return "SoDEX upstream error.";
  }
}

export function VaultQuoteCard({
  result,
  flow,
  priceSeries,
}: {
  result: VaultQuoteResult;
  flow: FlowRegimeResult;
  priceSeries?: number[];
}) {
  if (!result.ok) {
    return (
      <Card title={result.vault.name} subtitle={result.vault.symbol}>
        <ErrorState message="Live funding unavailable" detail={sodexErrorDetail(result.error.kind)} />
      </Card>
    );
  }

  const q = result.quote;
  const apr = q.fundingAprOnNotional;
  const tone = apr >= 0 ? "up" : "down";
  const mins = minutesUntil(q.nextFundingTime, q.asOf);
  const badgeState = escalateForRegime(q.risk.state, flow.state === "ok" ? flow.regime : undefined);

  return (
    <Card
      title={q.vault.name}
      subtitle={q.vault.symbol}
      actions={<Badge variant={RISK_VARIANT[badgeState]}>{RISK_LABEL[badgeState]}</Badge>}
    >
      <div className="flex flex-col gap-4">
        <Stat
          label="Funding APR (live, mainnet)"
          value={
            <ValueWithProvenance
              value={formatPercent(apr)}
              source={q.sources.markPrice}
              asOf={q.asOf}
              freshness="live"
            />
          }
          context={`${q.fundingPositive ? "Short earns" : "Short pays"} · ${formatBps(q.fundingRatePerInterval, { dp: 2, signed: true })}/hr — varies`}
          tone={tone}
          size="display"
        />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label={`Net on capital, ${q.vault.targetLeverage}x`} value={formatPercent(q.fundingAprOnCapital)} />
          <Field label="Mark price" value={formatPrice(q.markPrice, { dp: 0 })} />
          <Field label="Short liquidation room" value={formatPercent(q.liquidationDistance)} />
          <Field label="Next funding" value={mins == null ? "—" : `in ${mins}m`} />
        </div>

        {priceSeries && priceSeries.length >= 2 && (
          <div className="flex flex-col gap-1">
            <span className="text-micro uppercase tracking-wide text-faint">
              {q.vault.symbol} · 48h · SoDEX
            </span>
            <PriceChart points={priceSeries} className="h-8" />
          </div>
        )}

        <FlowSection flow={flow} />

        <p className="text-micro leading-5 text-muted">{q.vault.blurb}</p>

        <Link
          href={`/vaults/${q.vault.id}`}
          className="text-micro font-medium text-accent transition-colors hover:text-accent-strong"
        >
          Open vault and preview a position →
        </Link>
      </div>
    </Card>
  );
}

function FlowSection({ flow }: { flow: FlowRegimeResult }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/50 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-micro uppercase tracking-wide text-muted">
          Institutional flow · SoSoValue
        </span>
        {flow.state === "ok" && (
          <span className={cn("size-2 rounded-full", STANCE_DOT[flow.regime.stance])} aria-hidden />
        )}
      </div>
      <FlowBody flow={flow} />
    </div>
  );
}

function FlowBody({ flow }: { flow: FlowRegimeResult }) {
  if (flow.state === "not_configured") {
    return (
      <p className="mt-1.5 text-micro leading-5 text-muted">
        Add a SoSoValue API key to drive de-risk from live ETF flows. Funding still updates
        from SoDEX above.
      </p>
    );
  }
  if (flow.state === "empty") {
    return <p className="mt-1.5 text-micro text-muted">No recent ETF-flow data for this asset.</p>;
  }
  if (flow.state === "error") {
    return (
      <p className="mt-1.5 text-micro text-muted">SoSoValue flow unavailable ({flow.error.kind}).</p>
    );
  }

  const r = flow.regime;
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      <ValueWithProvenance
        value={<span className={cn("font-mono text-body", STANCE_TEXT[r.stance])}>{r.headline}</span>}
        source="SoSoValue /etfs/summary-history"
        asOf={flow.asOf}
        freshness="recent"
      />
      <span className="text-micro text-muted">
        Latest{" "}
        <span className={cn("font-mono", r.latestNetInflowUsd >= 0 ? "text-up" : "text-down")}>
          {formatSignedUsd(r.latestNetInflowUsd, { compact: true, dp: 1 })}
        </span>
        {r.aumUsd != null ? ` · AUM ${formatCompactUsd(r.aumUsd)}` : ""}
      </span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <span className="font-mono text-body text-foreground">{value}</span>
    </div>
  );
}
