import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, type BadgeVariant, Card, ErrorState, Stat, ValueWithProvenance } from "@/components/ui";
import { DepositPreview } from "@/components/vault/DepositPreview";
import type { RiskState } from "@/lib/core";
import { escalateForFlow, getFlowRegime } from "@/lib/flows";
import { formatBps, formatCompactUsd, formatPercent, formatPrice, formatSignedUsd } from "@/lib/format";
import { getVaultById, getVaultQuote } from "@/lib/vault";

export const dynamic = "force-dynamic";

const RISK_VARIANT: Record<RiskState, BadgeVariant> = { calm: "calm", watch: "watch", derisk: "derisk" };
const RISK_LABEL: Record<RiskState, string> = { calm: "Calm", watch: "Watch", derisk: "De-risk" };

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vault = getVaultById(id);
  if (!vault) notFound();

  const [quoteRes, flow] = await Promise.all([
    getVaultQuote(vault),
    getFlowRegime(vault.baseAsset),
  ]);

  const flowStance = flow.state === "ok" ? flow.regime.stance : undefined;
  const badgeState: RiskState = quoteRes.ok
    ? escalateForFlow(quoteRes.quote.risk.state, flowStance)
    : "calm";

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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Stat
              label="Funding APR (annualized, live)"
              value={
                <ValueWithProvenance
                  value={formatPercent(quoteRes.quote.fundingAprOnNotional)}
                  source={quoteRes.quote.sources.markPrice}
                  asOf={quoteRes.quote.asOf}
                  freshness="live"
                />
              }
              context={`current ${formatBps(quoteRes.quote.fundingRatePerInterval, { dp: 2, signed: true })}/hr — varies`}
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

            <FlowBlock flow={flow} />

            <p className="text-micro leading-5 text-muted">{vault.blurb}</p>
          </div>

          <DepositPreview
            vaultName={vault.name}
            symbol={vault.symbol}
            baseAsset={vault.baseAsset}
            markPrice={quoteRes.quote.markPrice}
            leverage={vault.targetLeverage}
            maintenanceMarginRate={quoteRes.quote.maintenanceMarginRate}
            takerFee={quoteRes.quote.takerFee}
            fundingAprOnCapital={quoteRes.quote.fundingAprOnCapital}
          />
        </div>
      )}
    </div>
  );
}

function FlowBlock({ flow }: { flow: Awaited<ReturnType<typeof getFlowRegime>> }) {
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
