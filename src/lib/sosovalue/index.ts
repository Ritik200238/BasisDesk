// SoSoValue OpenAPI client — the product's load-bearing data source (CLAUDE.md Directive 1).
// Endpoints (base https://openapi.sosovalue.com/openapi/v1, header x-soso-api-key):
//   GET /etfs/summary-history  -> 2.-etf/summary-history  (daily net inflow, AUM, cumulative)
//   GET /news/featured         -> 6.-feeds/featured-news   (title, source_link, matched_currencies)
// Gated behind SOSOVALUE_API_KEY: without it, calls return { error: not_configured } and the
// UI shows an explicit connect-key state.

export { isConfigured, getBaseUrl, AUTH_HEADER, ssvUrl } from "./config";
export { getJson, type SsvResult, type SsvError, type SsvErrorKind } from "./http";
export * from "./schemas";
export { getEtfSummaryHistory } from "./etf";
export { getFeaturedNews, filterNewsByCurrency } from "./news";
