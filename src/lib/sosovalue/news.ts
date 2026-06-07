import { ssvUrl } from "./config";
import { getJson, type SsvResult } from "./http";
import { newsListSchema, type NewsItem } from "./schemas";

// GET /news/featured — featured news feed. matched_currencies on each item is used to filter
// for a specific asset (no documented request-level currency filter, so we filter the
// response). Used for the grounded "why" behind a flow move.
export async function getFeaturedNews(opts?: {
  page?: number;
  pageSize?: number;
}): Promise<SsvResult<NewsItem[]>> {
  return getJson(
    ssvUrl("/news/featured", { page: opts?.page ?? 1, page_size: opts?.pageSize ?? 20 }),
    newsListSchema,
  );
}

// Filter featured news to items tagged with a given currency symbol (case-insensitive).
export function filterNewsByCurrency(items: NewsItem[], symbol: string): NewsItem[] {
  const want = symbol.toLowerCase();
  return items.filter((item) =>
    (item.matched_currencies ?? []).some((c) => JSON.stringify(c).toLowerCase().includes(want)),
  );
}
