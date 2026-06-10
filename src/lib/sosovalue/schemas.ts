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

// GET /news/featured?pageNum=&pageSize= — verified against a live key. Items carry per-language
// content (we surface English) and matchedCurrencies tags; the response is paginated under
// data.list. We normalize each item to a flat, UI-friendly shape at parse time.
export const newsItemSchema = z
  .object({
    id: z.string().optional(),
    sourceLink: z.string().optional(),
    releaseTime: z.coerce.number().optional(),
    matchedCurrencies: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          fullName: z.string().optional(),
        }),
      )
      .optional(),
    multilanguageContent: z
      .array(
        z.object({
          language: z.string(),
          title: z.string().optional(),
          content: z.string().optional(),
        }),
      )
      .optional(),
  })
  .transform((r) => {
    const en = r.multilanguageContent?.find((m) => m.language === "en") ?? r.multilanguageContent?.[0];
    return {
      id: r.id ?? null,
      title: en?.title ?? null,
      content: en?.content ?? null,
      sourceLink: r.sourceLink ?? null,
      releaseTime: r.releaseTime ?? null,
      currencies: (r.matchedCurrencies ?? []).map((c) => ({ name: c.name ?? null, fullName: c.fullName ?? null })),
    };
  });
export type NewsItem = z.infer<typeof newsItemSchema>;
// The response paginates under data.list; also accept a bare array for resilience.
export const newsListSchema = z.union([
  z.array(newsItemSchema),
  z.object({ list: z.array(newsItemSchema) }).transform((o) => o.list),
]);
