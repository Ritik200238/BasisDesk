"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignTypedData, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatQty, formatUsd } from "@/lib/format";
import {
  OrderSide,
  VALUECHAIN_TESTNET_CHAIN_ID,
  buildPerpMarketOrder,
  nextNonce,
  signNewOrder,
} from "@/lib/sodex";
import { computeDepositPreview } from "@/lib/vault";

interface DepositPreviewProps {
  vaultName: string;
  symbol: string;
  symbolId: number | null;
  baseAsset: string;
  markPrice: number;
  leverage: number;
  maintenanceMarginRate: number;
  takerFee: number;
  fundingAprOnCapital: number;
}

const PRESETS = [500, 1000, 5000];

type ExecState = "idle" | "signing" | "submitting" | "done" | "error";

// Convert a base-unit quantity to a decimal string with no trailing zeros (SoDEX rejects them)
// and no scientific notation.
function qtyToString(q: number): string {
  return q.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

// Interactive position preview + (when a wallet is connected) sign-and-place. The hedge order
// is signed in the user's wallet (non-custodial) and forwarded to SoDEX server-side; the
// response is shown verbatim — a non-whitelisted account returns "account not found".
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
                <Button key={p} variant="ghost" className="h-9 px-2 text-micro" onClick={() => setAmt(String(p))}>
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
          preview && <ConfirmReceipt props={props} preview={preview} onCancel={() => setConfirming(false)} />
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
  const { isConnected, address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain, isPending: switching } = useSwitchChain();
  const router = useRouter();
  const wrongNetwork = isConnected && chainId !== VALUECHAIN_TESTNET_CHAIN_ID;
  const [accountId, setAccountId] = useState("");
  const [aidLoading, setAidLoading] = useState(false);
  const [exec, setExec] = useState<ExecState>("idle");
  const [execMsg, setExecMsg] = useState("");
  const [serverMsg, setServerMsg] = useState("");

  // Auto-resolve the SoDEX account id (aid) from the connected wallet; still editable.
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setAidLoading(true);
    fetch(`/api/sodex/account?address=${address}`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; aid?: number }) => {
        if (!cancelled && d.ok && typeof d.aid === "number") setAccountId(String(d.aid));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAidLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  async function handleExecute() {
    if (props.symbolId == null) {
      setExec("error");
      setExecMsg("SoDEX market id is unavailable for this vault.");
      return;
    }
    const accId = Number(accountId);
    if (!Number.isInteger(accId) || accId <= 0) {
      setExec("error");
      setExecMsg("Enter your numeric SoDEX account id (from your testnet account).");
      return;
    }
    setExecMsg("");
    setServerMsg("");
    try {
      setExec("signing");
      const order = buildPerpMarketOrder({
        accountID: accId,
        symbolID: props.symbolId,
        clOrdID: `bd-${Date.now()}`,
        side: OrderSide.SELL,
        quantity: qtyToString(preview.qty),
      });
      const nonce = nextNonce();
      const { wireSignature } = await signNewOrder({
        request: order,
        nonce,
        chainId: VALUECHAIN_TESTNET_CHAIN_ID,
        signTypedData: (args) => signTypedDataAsync(args),
      });

      setExec("submitting");
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
      const data = (await res.json()) as { body?: { code?: number; error?: string } };
      const code = data.body?.code;
      if (code === 0) {
        setServerMsg("Hedge order placed.");
        router.refresh(); // re-pull live server data now that a position exists
      } else {
        setServerMsg(data.body?.error ?? "SoDEX rejected the order.");
      }
      setExec("done");
    } catch (err) {
      setExec("error");
      setExecMsg(err instanceof Error ? err.message : "Signing was rejected or failed.");
    }
  }

  const busy = exec === "signing" || exec === "submitting";

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
        <li>
          Worst case: a venue outage or a gap through{" "}
          <strong className="text-foreground">{formatPrice(preview.liquidationPrice, { dp: 0 })}</strong> can break the
          hedge before it rebalances.
        </li>
      </ul>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {!isConnected ? (
          <p className="text-micro leading-5 text-muted">
            Connect your wallet (top right) to sign and place the short hedge. Signing happens in
            your wallet — BasisDesk never holds your keys.
          </p>
        ) : (
          <>
            <label htmlFor="acct" className="text-micro uppercase tracking-wide text-muted">
              SoDEX account id {aidLoading ? "· resolving…" : "· auto-filled from your wallet"}
            </label>
            <input
              id="acct"
              inputMode="numeric"
              placeholder="resolving from your wallet…"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="rounded-md border border-border-strong bg-background px-3 py-2 font-mono text-body text-foreground outline-none"
            />
            {wrongNetwork ? (
              <Button
                onClick={() => switchChain({ chainId: VALUECHAIN_TESTNET_CHAIN_ID })}
                disabled={switching}
              >
                {switching ? "Switching…" : "Switch to ValueChain testnet"}
              </Button>
            ) : (
              <Button onClick={handleExecute} disabled={busy}>
                {exec === "signing"
                  ? "Sign in wallet…"
                  : exec === "submitting"
                    ? "Placing…"
                    : "Sign and place hedge"}
              </Button>
            )}
            {exec === "error" && <p className="text-micro text-down">{execMsg}</p>}
            {exec === "done" && (
              <p className={cn("text-micro", serverMsg === "Hedge order placed." ? "text-up" : "text-warn")}>
                {serverMsg}
              </p>
            )}
            <p className="text-micro leading-5 text-faint">
              Submission needs a whitelisted SoDEX testnet account; otherwise the server returns
              account-not-found. The signing and submission are verified against the SoDEX SDK.
            </p>
          </>
        )}
      </div>

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
