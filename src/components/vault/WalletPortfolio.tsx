"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPrice, formatSignedUsd, formatUsd } from "@/lib/format";
import {
  OrderSide,
  PositionSide,
  VALUECHAIN_TESTNET_CHAIN_ID,
  buildPerpMarketOrder,
  nextNonce,
  signNewOrder,
} from "@/lib/sodex";

interface PortfolioPosition {
  symbol: string;
  symbolId: number | null;
  size: string;
  entryPrice: string;
  unrealizedPnL?: string;
  liquidationPrice?: string;
  leverage?: number;
}

interface FundingEvent {
  symbol: string;
  fundingAmount: string;
  fundingTime: number;
}

interface PortfolioData {
  ok: boolean;
  aid: number | null;
  equity: { available: string | null; margin: string | null } | null;
  positions: PortfolioPosition[];
  funding: FundingEvent[];
}

export function WalletPortfolio() {
  const { isConnected, address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [closeMsg, setCloseMsg] = useState<{ symbol: string; text: string; ok: boolean } | null>(null);

  // Monotonic request id so a slow earlier response can never overwrite a newer one.
  const reqSeq = useRef(0);

  const load = useCallback(() => {
    if (!address) return;
    const seq = ++reqSeq.current;
    setLoading(true);
    fetch(`/api/sodex/portfolio?address=${address}`)
      .then((r) => r.json())
      .then((d: PortfolioData) => {
        if (seq === reqSeq.current) setData(d);
      })
      .catch(() => {
        if (seq === reqSeq.current) setData(null);
      })
      .finally(() => {
        if (seq === reqSeq.current) setLoading(false);
      });
  }, [address]);

  // Load on mount/address change, then poll while the tab is visible so positions and funding
  // stay live without a manual refresh.
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  async function closePosition(p: PortfolioPosition) {
    if (p.symbolId == null || data?.aid == null) return;
    setCloseMsg(null);
    setClosing(p.symbol);
    try {
      // Close = a reduceOnly market order opposite the position (negative size = short -> buy).
      const isShort = p.size.trim().startsWith("-");
      const qty = p.size.replace("-", "").trim();
      const order = buildPerpMarketOrder({
        accountID: data.aid,
        symbolID: p.symbolId,
        clOrdID: `bd-close-${Date.now()}`,
        side: isShort ? OrderSide.BUY : OrderSide.SELL,
        quantity: qty,
        reduceOnly: true,
        positionSide: PositionSide.BOTH,
      });
      const nonce = nextNonce();
      const { wireSignature } = await signNewOrder({
        request: order,
        nonce,
        chainId: VALUECHAIN_TESTNET_CHAIN_ID,
        signTypedData: (a) => signTypedDataAsync(a),
      });
      const res = await fetch("/api/sodex/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: order,
          wireSignature,
          nonce: nonce.toString(),
          chainId: VALUECHAIN_TESTNET_CHAIN_ID,
        }),
      });
      const j = (await res.json()) as { body?: { code?: number; error?: string } };
      const ok = j.body?.code === 0;
      setCloseMsg({ symbol: p.symbol, text: ok ? "Close order placed." : j.body?.error ?? "Rejected.", ok });
      if (ok) load();
    } catch (err) {
      setCloseMsg({ symbol: p.symbol, text: err instanceof Error ? err.message : "Signing failed.", ok: false });
    } finally {
      setClosing(null);
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <p className="text-body font-medium text-foreground">Your portfolio</p>
        <p className="mt-1 text-micro leading-5 text-muted">
          Connect your wallet (top right) to see your SoDEX account equity, open positions, and the
          funding you have earned.
        </p>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        <p className="text-body text-muted">Reading your SoDEX account…</p>
      </Card>
    );
  }

  const equity = data?.equity;
  const positions = data?.positions ?? [];
  const fundingTotal = (data?.funding ?? []).reduce((sum, f) => sum + Number(f.fundingAmount || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Account id" value={data?.aid != null ? `#${data.aid}` : "—"} />
        <StatBox
          label="Account equity"
          value={equity?.margin != null ? formatUsd(Number(equity.margin), { dp: 2 }) : "—"}
        />
        <StatBox
          label="Funding earned (last 25)"
          value={formatSignedUsd(fundingTotal, { dp: 4 })}
          tone={fundingTotal >= 0 ? "up" : "down"}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-body font-medium text-foreground">Open positions</p>
          <Button variant="ghost" className="h-8 px-2 text-micro" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {positions.length === 0 ? (
          <p className="mt-2 text-micro leading-5 text-muted">
            No open positions yet. Open one from a vault — the hedge appears here, where you can
            track funding and close it with one signature.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {positions.map((p) => {
              const isShort = p.size.trim().startsWith("-");
              const pnl = p.unrealizedPnL != null ? Number(p.unrealizedPnL) : null;
              return (
                <li key={p.symbol} className="rounded-md border border-border bg-surface px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-body text-foreground">
                      {p.symbol} · {isShort ? "Short" : "Long"} {p.size.replace("-", "")}
                    </span>
                    {pnl != null && (
                      <span className={cn("font-mono text-micro", pnl >= 0 ? "text-up" : "text-down")}>
                        {formatSignedUsd(pnl, { dp: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-micro text-muted">
                    <span>Entry {formatPrice(Number(p.entryPrice), { dp: 0 })}</span>
                    {p.liquidationPrice != null && (
                      <span>Liq {formatPrice(Number(p.liquidationPrice), { dp: 0 })}</span>
                    )}
                    {p.leverage != null && <span>{p.leverage}x</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      className="h-8 px-3 text-micro"
                      onClick={() => closePosition(p)}
                      disabled={closing === p.symbol || p.symbolId == null}
                    >
                      {closing === p.symbol ? "Closing…" : "Close position"}
                    </Button>
                    {closeMsg?.symbol === p.symbol && (
                      <span className={cn("text-micro", closeMsg.ok ? "text-up" : "text-warn")}>
                        {closeMsg.text}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-micro leading-5 text-faint">
        Reads are live from SoDEX for your address. Closing a position signs a reduceOnly order in
        your wallet and submits it; it succeeds once your account is funded and whitelisted.
      </p>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <span className="text-micro uppercase tracking-wide text-muted">{label}</span>
      <p
        className={cn(
          "mt-0.5 font-mono text-lead",
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
