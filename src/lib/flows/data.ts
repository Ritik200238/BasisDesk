// Server-side: fetch SoSoValue ETF flows and compute the regime. Discriminated result so
// the UI can distinguish "no key yet" from a real upstream error from genuinely empty data.

import { getEtfSummaryHistory, type SsvError } from "@/lib/sosovalue";
import { computeFlowRegime, type FlowRegime } from "./regime";

export type FlowRegimeResult =
  | { state: "ok"; regime: FlowRegime; asOf: string }
  | { state: "not_configured" }
  | { state: "empty" }
  | { state: "error"; error: SsvError };

// `symbol` is the SoSoValue asset symbol (e.g. "BTC", "ETH"), not the SoDEX market name.
export async function getFlowRegime(symbol: string): Promise<FlowRegimeResult> {
  const res = await getEtfSummaryHistory(symbol, { limit: 30 });
  if (!res.ok) {
    if (res.error.kind === "not_configured") return { state: "not_configured" };
    return { state: "error", error: res.error };
  }
  const regime = computeFlowRegime(symbol, res.data);
  if (!regime) return { state: "empty" };
  return { state: "ok", regime, asOf: res.asOf.toISOString() };
}
