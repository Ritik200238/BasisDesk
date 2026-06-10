"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPercent, formatUsd } from "@/lib/format";
import { simulateScenario } from "@/lib/vault";

interface NeutralitySimulatorProps {
  symbol: string;
  baseAsset: string;
  entryPrice: number;
  leverage: number;
  maintenanceMarginRate: number;
  takerFee: number;
  fundingAprOnNotional: number;
}

const CAPITAL = 1000;
const HOLDING_DAYS = 30;
const PCT_MIN = -0.5;
const PCT_MAX = 0.6;

// SVG plot geometry (viewBox units).
const W = 320;
const H = 156;
const PADX = 8;
const PAD_TOP = 10;
const PAD_BOT = 24;

// Interactive proof of market-neutrality. Drag the price and watch the hedged position stay flat
// (and earn funding) while simply holding the asset tracks the price one-for-one. Every figure is
// the deterministic core's simulateScenario — the same math the deposit signs against.
export function NeutralitySimulator(props: NeutralitySimulatorProps) {
  const [pctInt, setPctInt] = useState(-30); // start on a 30% drop to show the contrast

  const base = useMemo(
    () => ({
      capitalUsd: CAPITAL,
      entryPrice: props.entryPrice,
      leverage: props.leverage,
      maintenanceMarginRate: props.maintenanceMarginRate,
      takerFee: props.takerFee,
      fundingAprOnNotional: props.fundingAprOnNotional,
      holdingDays: HOLDING_DAYS,
    }),
    [props.entryPrice, props.leverage, props.maintenanceMarginRate, props.takerFee, props.fundingAprOnNotional],
  );

  const curve = useMemo(() => {
    const N = 60;
    const rows = Array.from({ length: N + 1 }, (_, i) => {
      const pct = PCT_MIN + (i / N) * (PCT_MAX - PCT_MIN);
      const s = simulateScenario({ ...base, newPrice: base.entryPrice * (1 + pct) });
      return { pct, hold: s.holdValueUsd, hedged: s.hedgedValueUsd };
    });
    const vals = rows.flatMap((r) => [r.hold, r.hedged]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo) * 0.08 || 1;
    const liqPct = simulateScenario({ ...base, newPrice: base.entryPrice }).liquidationPrice / base.entryPrice - 1;
    return { rows, vMin: lo - pad, vMax: hi + pad, liqPct };
  }, [base]);

  const pricePct = pctInt / 100;
  const current = simulateScenario({ ...base, newPrice: base.entryPrice * (1 + pricePct) });

  const plotW = W - PADX * 2;
  const plotTop = PAD_TOP;
  const plotH = H - PAD_BOT - PAD_TOP;
  const xOf = (pct: number) => PADX + ((pct - PCT_MIN) / (PCT_MAX - PCT_MIN)) * plotW;
  const yOf = (v: number) => plotTop + (1 - (v - curve.vMin) / (curve.vMax - curve.vMin)) * plotH;

  const pathOf = (key: "hold" | "hedged") =>
    curve.rows.map((r, i) => `${i ? "L" : "M"}${xOf(r.pct).toFixed(1)},${yOf(r[key]).toFixed(1)}`).join(" ");

  const capY = yOf(CAPITAL);
  const curX = xOf(pricePct);
  const liqX = xOf(curve.liqPct);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-body font-medium text-foreground">Prove it stays neutral</h3>
        <p className="text-micro text-muted">
          Drag the {props.baseAsset} price. The hedge holds value where holding would not.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="text-body leading-6 text-foreground">
          {props.baseAsset} moves{" "}
          <span className={cn("font-mono", pricePct >= 0 ? "text-up" : "text-down")}>
            {formatPercent(pricePct, { signed: true })}
          </span>{" "}
          to {formatUsd(base.entryPrice * (1 + pricePct), { dp: 0 })} —{" "}
          {current.liquidated ? (
            <>
              past the short&apos;s liquidation, so the hedge breaks and you are left long {props.baseAsset}.
            </>
          ) : pricePct < 0 ? (
            <>
              holding loses{" "}
              <span className="font-mono text-down">{formatUsd(-current.holdPnlUsd, { dp: 0 })}</span>; BasisDesk keeps{" "}
              <span className="font-mono text-up">{formatUsd(current.hedgedValueUsd, { dp: 0 })}</span>.
            </>
          ) : (
            <>
              both gain, but BasisDesk traded the upside for a flat,{" "}
              <span className="font-mono text-up">{formatPercent(props.fundingAprOnNotional)}</span> funding yield.
            </>
          )}
        </p>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Hedged value versus holding, by price">
          {/* capital reference line */}
          <line x1={PADX} y1={capY} x2={W - PADX} y2={capY} stroke="currentColor" className="text-border-strong" strokeWidth="0.75" strokeDasharray="2 2" />
          {/* liquidation marker */}
          {curve.liqPct < PCT_MAX && (
            <>
              <line x1={liqX} y1={plotTop} x2={liqX} y2={plotTop + plotH} stroke="currentColor" className="text-down/50" strokeWidth="0.75" strokeDasharray="2 2" />
              <text x={Math.min(liqX + 2, W - 40)} y={plotTop + 7} className="fill-down text-[7px]">liq</text>
            </>
          )}
          {/* the two curves */}
          <path d={pathOf("hold")} fill="none" stroke="currentColor" className="text-ink-500" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={pathOf("hedged")} fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" strokeLinejoin="round" />
          {/* current price marker */}
          <line x1={curX} y1={plotTop} x2={curX} y2={plotTop + plotH} stroke="currentColor" className="text-foreground/30" strokeWidth="0.75" />
          <circle cx={curX} cy={yOf(current.holdValueUsd)} r="2.5" className="fill-ink-400" />
          <circle cx={curX} cy={yOf(current.hedgedValueUsd)} r="2.5" className="fill-accent" />
          {/* x-axis labels */}
          <text x={PADX} y={H - 8} className="fill-faint text-[7px]">-50%</text>
          <text x={xOf(0) - 4} y={H - 8} className="fill-faint text-[7px]">0</text>
          <text x={W - PADX - 16} y={H - 8} className="fill-faint text-[7px]">+60%</text>
        </svg>

        <div className="flex items-center gap-3">
          <span className="font-mono text-micro text-muted">-50%</span>
          <input
            type="range"
            min={-50}
            max={60}
            step={1}
            value={pctInt}
            onChange={(e) => setPctInt(Number(e.target.value))}
            aria-label={`${props.baseAsset} price change`}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-strong accent-accent"
          />
          <span className="font-mono text-micro text-muted">+60%</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Outcome
            label={`Hold ${props.baseAsset}`}
            value={formatUsd(current.holdValueUsd, { dp: 0 })}
            sub={formatPercent(current.holdPnlPct, { signed: true })}
            tone={current.holdPnlPct >= 0 ? "up" : "down"}
            muted
          />
          <Outcome
            label="BasisDesk hedged"
            value={formatUsd(current.hedgedValueUsd, { dp: 0 })}
            sub={formatPercent(current.hedgedPnlPct, { signed: true })}
            tone={current.hedgedPnlPct >= 0 ? "up" : "down"}
          />
          <Outcome
            label={`Funding (${HOLDING_DAYS}d)`}
            value={formatUsd(current.fundingEarnedUsd, { dp: 2 })}
            sub="real yield"
            tone="up"
          />
        </div>

        <p className="text-micro leading-5 text-faint">
          ${CAPITAL.toLocaleString()} into the {props.symbol} hedge at {props.leverage}x, held {HOLDING_DAYS} days.
          The hedged line is flat because the spot and short legs cancel — the same price-invariant
          math the deposit is signed against. The amber line is BasisDesk; the grey line is holding.
        </p>
      </div>
    </div>
  );
}

function Outcome({
  label,
  value,
  sub,
  tone,
  muted,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "up" | "down";
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-2.5", muted ? "border-border bg-surface" : "border-accent/30 bg-accent/5")}>
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <p className="mt-0.5 font-mono text-lead text-foreground">{value}</p>
      <p className={cn("font-mono text-micro", tone === "up" ? "text-up" : "text-down")}>{sub}</p>
    </div>
  );
}
