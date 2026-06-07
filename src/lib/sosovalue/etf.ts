import { ssvUrl } from "./config";
import { getJson, type SsvResult } from "./http";
import { etfSummaryHistorySchema, type EtfSummaryRecord } from "./schemas";

// GET /etfs/summary-history — daily aggregate spot-ETF flows for an asset (BTC, ETH, SOL).
// total_net_inflow is daily USD net flow (negative = outflow); total_net_assets is AUM.
// The API caps the window to the most recent ~1 month (limit max 300).
export function getEtfSummaryHistory(
  symbol: string,
  opts?: { countryCode?: "US" | "HK"; limit?: number; startDate?: string; endDate?: string },
): Promise<SsvResult<EtfSummaryRecord[]>> {
  return getJson(
    ssvUrl("/etfs/summary-history", {
      symbol,
      country_code: opts?.countryCode ?? "US",
      limit: opts?.limit ?? 30,
      start_date: opts?.startDate,
      end_date: opts?.endDate,
    }),
    etfSummaryHistorySchema,
  );
}
