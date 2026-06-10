import { ssvUrl } from "./config";
import { getJson, type SsvResult } from "./http";
import { newsListSchema, type NewsItem } from "./schemas";

// GET /news/featured?pageNum=&pageSize= — featured news feed. Each item's matchedCurrencies tags
// drive the per-asset filter (no request-level currency filter), so we fetch a page and filter
// the response. Used for the grounded "why" behind a flow move.
export async function getFeaturedNews(opts?: {
  pageNum?: number;
  pageSize?: number;
}): Promise<SsvResult<NewsItem[]>> {
  return getJson(
    ssvUrl("/news/featured", { pageNum: opts?.pageNum ?? 1, pageSize: opts?.pageSize ?? 20 }),
    newsListSchema,
  );
}

// Filter featured news to items tagged with a given currency symbol (e.g. "BTC").
export function filterNewsByCurrency(items: NewsItem[], symbol: string): NewsItem[] {
  const want = symbol.toUpperCase();
  return items.filter((item) => item.currencies.some((c) => (c.name ?? "").toUpperCase() === want));
}
