// zod schemas for SoSoValue OpenAPI responses.
// ETF summary-history confirmed from docs:
//   https://sosovalue-1.gitbook.io/sosovalue-api-doc/2.-etf/summary-history
// Flow/AUM values are USD magnitudes (millions to tens of billions) used for display and
// regime math, so a JS number is safe (well within 2^53). News shape is doc-derived and
// kept lenient until verified against a live key.

import { z } from "zod";

// GET /etfs/summary-history?symbol=BTC&country_code=US
export const etfSummaryRecordSchema = z.object({
  date: z.string(),
  total_net_inflow: z.coerce.number(),
  total_value_traded: z.coerce.number().optional(),
  total_net_assets: z.coerce.number().optional(),
  cum_net_inflow: z.coerce.number().optional(),
});
export type EtfSummaryRecord = z.infer<typeof etfSummaryRecordSchema>;
export const etfSummaryHistorySchema = z.array(etfSummaryRecordSchema);

// GET /news/featured — fields used for the grounded "why". Doc-derived; verify with a key.
export const newsItemSchema = z.object({
  title: z.string().optional(),
  source_link: z.string().optional(),
  release_time: z.coerce.number().optional(),
  matched_currencies: z.array(z.unknown()).optional(),
});
export type NewsItem = z.infer<typeof newsItemSchema>;
// The list may be a bare array or { list: [...] }; accept either.
export const newsListSchema = z.union([
  z.array(newsItemSchema),
  z.object({ list: z.array(newsItemSchema) }).transform((o) => o.list),
]);
