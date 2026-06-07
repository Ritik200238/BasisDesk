"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatQty, formatUsd } from "@/lib/format";
import { computeDepositPreview } from "@/lib/vault";

interface DepositPreviewProps {
  vaultName: string;
  symbol: string;
  baseAsset: string;
  markPrice: number;
  leverage: number;
  maintenanceMarginRate: number;
  takerFee: number;
  fundingAprOnCapital: number;
}

const PRESETS = [500, 1000, 5000];

// Interactive position preview. Everything is computed by the deterministic core from the
// live mark price, so the figures the user reviews are the figures they would sign for.
export function DepositPreview(props: DepositPreviewProps) {
  const [amount, setAmount] = useState("1000");
  const [confirming, setConfirming] = useState(false);

  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  const preview = useMemo(() => {
    if (!valid) return null;
    return computeDepositPreview({
      capitalUsd: parsed,
      markPrice: props.markPrice,
      leverage: props.leverage,
      maintenanceMarginRate: props.maintenanceMarginRate,
      takerFee: props.takerFee,
    });
  }, [parsed, valid, props.markPrice, props.leverage, props.maintenanceMarginRate, props.takerFee]);

  const estAnnualYieldUsd = valid ? parsed * props.fundingAprOnCapital : 0;

  function setAmt(next: string) {
    setAmount(next);
    setConfirming(false);
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-body font-medium text-foreground">Open a position</h3>
        <p className="text-micro text-muted">
          Preview the exact hedged position before you sign. Figures update from the live mark
          price.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="deposit" className="text-micro uppercase tracking-wide text-muted">
            Deposit (USDC)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-md border border-border-strong bg-background px-3">
              <span className="text-muted">$</span>
              <input
                id="deposit"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmt(e.target.value)}
                className="w-28 bg-transparent py-2 font-mono text-body text-foreground outline-none"
              />
            </div>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  className="h-9 px-2 text-micro"
                  onClick={() => setAmt(String(p))}
                >
                  ${p.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          {!valid && amount !== "" && (
            <span className="text-micro text-down">Enter a positive amount.</span>
          )}
        </div>

        {preview && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <Row
              label={`Long ${props.baseAsset} spot`}
              value={`${formatQty(preview.qty, { unit: props.baseAsset, dp: 5 })} · ${formatUsd(preview.spotCostUsd, { dp: 0 })}`}
            />
            <Row
              label={`Short ${props.symbol} · ${props.leverage}x`}
              value={`${formatUsd(preview.shortNotionalUsd, { dp: 0 })} · margin ${formatUsd(preview.marginUsd, { dp: 0 })}`}
            />
            <Row label="Net delta at entry" value="≈ $0 · market-neutral" tone="up" />
            <Row
              label="Est. funding yield"
              value={`${formatPercent(props.fundingAprOnCapital)} · ${formatUsd(estAnnualYieldUsd, { dp: 0 })}/yr`}
            />
            <Row
              label="Short liquidation"
              value={`${formatPrice(preview.liquidationPrice, { dp: 0 })} · ${formatPercent(preview.liquidationDistance)} away`}
            />
            <Row label="Est. entry fees" value={formatUsd(preview.entryFeesUsd, { dp: 2 })} />
          </div>
        )}

        {!confirming ? (
          <Button disabled={!valid} onClick={() => setConfirming(true)}>
            Review deposit
          </Button>
        ) : (
          preview && (
            <ConfirmReceipt
              props={props}
              preview={preview}
              onCancel={() => setConfirming(false)}
            />
          )
        )}
      </div>
    </div>
  );
}

function ConfirmReceipt({
  props,
  preview,
  onCancel,
}: {
  props: DepositPreviewProps;
  preview: ReturnType<typeof computeDepositPreview>;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-accent/30 bg-accent/5 p-3">
      <p className="text-body font-medium text-foreground">Review — {props.vaultName}</p>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-micro leading-5 text-muted">
        <li>
          Deposit <strong className="text-foreground">{formatUsd(preview.capitalUsd, { dp: 0 })}</strong> USDC.
        </li>
        <li>
          Buy <strong className="text-foreground">{formatQty(preview.qty, { unit: props.baseAsset, dp: 5 })}</strong> spot
          and short an equal size on {props.symbol} at {props.leverage}x.
        </li>
        <li>
          Entry fees about <strong className="text-foreground">{formatUsd(preview.entryFeesUsd, { dp: 2 })}</strong>; net
          price exposure ≈ $0.
        </li>
        <li>If funding turns negative, the position pays funding until you redeem or it de-risks.</li>
        <li>
          Worst case: a venue outage or a gap through{" "}
          <strong className="text-foreground">{formatPrice(preview.liquidationPrice, { dp: 0 })}</strong> can break the
          hedge before it rebalances.
        </li>
      </ul>
      <p className="rounded-md border border-border bg-surface px-3 py-2 text-micro leading-5 text-muted">
        Execution opens once SoDEX testnet access is enabled for your wallet. Signing happens in
        your wallet — BasisDesk never holds your keys or funds.
      </p>
      <Button variant="secondary" onClick={onCancel}>
        Back
      </Button>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "up" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <span className={cn("font-mono text-body", tone === "up" ? "text-up" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
