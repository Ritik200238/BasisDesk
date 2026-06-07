import { Badge, type BadgeVariant, Card, ErrorState, Stat, ValueWithProvenance } from "@/components/ui";
import { formatBps, formatPercent, formatPrice } from "@/lib/format";
import type { SodexErrorKind } from "@/lib/sodex";
import type { VaultQuoteResult } from "@/lib/vault";

const RISK_VARIANT: Record<string, BadgeVariant> = {
  calm: "calm",
  watch: "watch",
  derisk: "derisk",
};
const RISK_LABEL: Record<string, string> = {
  calm: "Calm",
  watch: "Watch",
  derisk: "De-risk",
};

function minutesUntil(ts: number, fromIso: string): number | null {
  const from = Date.parse(fromIso);
  if (Number.isNaN(from)) return null;
  return Math.max(0, Math.round((ts - from) / 60_000));
}

function errorDetail(kind: SodexErrorKind): string {
  switch (kind) {
    case "rate_limited":
      return "SoDEX rate limit reached; this refreshes on the next load.";
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

export function VaultQuoteCard({ result }: { result: VaultQuoteResult }) {
  if (!result.ok) {
    return (
      <Card title={result.vault.name} subtitle={result.vault.symbol}>
        <ErrorState message="Live funding unavailable" detail={errorDetail(result.error.kind)} />
      </Card>
    );
  }

  const q = result.quote;
  const apr = q.fundingAprOnNotional;
  const tone = apr >= 0 ? "up" : "down";
  const mins = minutesUntil(q.nextFundingTime, q.asOf);

  return (
    <Card
      title={q.vault.name}
      subtitle={q.vault.symbol}
      actions={<Badge variant={RISK_VARIANT[q.risk.state]}>{RISK_LABEL[q.risk.state]}</Badge>}
    >
      <div className="flex flex-col gap-4">
        <Stat
          label="Funding APR (annualized, live)"
          value={
            <ValueWithProvenance
              value={formatPercent(apr)}
              source={q.sources.markPrice}
              asOf={q.asOf}
              freshness="live"
            />
          }
          context={`from the current ${formatBps(q.fundingRatePerInterval, { dp: 2, signed: true })}/hr rate — varies`}
          tone={tone}
          size="display"
        />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label={`Net on capital, ${q.vault.targetLeverage}x`} value={formatPercent(q.fundingAprOnCapital)} />
          <Field label="Mark price" value={formatPrice(q.markPrice, { dp: 0 })} />
          <Field label="Short liquidation room" value={formatPercent(q.liquidationDistance)} />
          <Field label="Next funding" value={mins == null ? "—" : `in ${mins}m`} />
        </div>

        <p className="text-micro leading-5 text-muted">{q.vault.blurb}</p>
      </div>
    </Card>
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
