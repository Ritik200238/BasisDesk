// SoDEX client (read-only public endpoints). Each endpoint is documented with its source so
// no shape is guessed (CLAUDE.md Section 1).
//
// Docs root: https://sodex.com/documentation/trading-api/trading-api.md
// Endpoints used:
//   GET /markets/symbols       -> rest-v1/sodex-rest-perps-api.md   (perp universe)
//   GET /markets/mark-prices   -> rest-v1/sodex-rest-perps-api.md   (markPrice, estimatedFundingRate, nextFundingTime)
//   GET /accounts/{addr}/positions -> rest-v1/sodex-rest-perps-api.md (size, entryPrice, unrealizedPnL, liquidationPrice)
//   GET /accounts/{addr}/fundings  -> rest-v1/sodex-rest-perps-api.md (realized fundingAmount history)
// Base URLs: https://{testnet,mainnet}-gw.sodex.dev/api/v1/{perps,spot}
// The signed write-path (order placement) is a separate, whitelist-gated module.

export {
  getNetwork,
  getGatewayBase,
  perpsBaseUrl,
  spotBaseUrl,
  perpsUrl,
  spotUrl,
  type SodexNetwork,
} from "./config";
export { getJson, type SodexResult, type SodexError, type SodexErrorKind } from "./http";
export * from "./schemas";
export { getPerpSymbols, getMarketSpec, getMarkPrices, getMarkPrice } from "./markets";
export { getPositions, getFundingHistory } from "./account";
export * from "./sign";
export * from "./submit";
