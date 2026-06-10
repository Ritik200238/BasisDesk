// SoDEX gateway configuration. Read-only public endpoints only — no signing, no API key.
// Base URLs are env-overridable so we can point at mainnet or a proxy without code changes.
// Verified base paths (CLAUDE.md Appendix B + docs trading-api.md):
//   testnet: https://testnet-gw.sodex.dev/api/v1/{perps,spot}
//   mainnet: https://mainnet-gw.sodex.dev/api/v1/{perps,spot}

export type SodexNetwork = "testnet" | "mainnet";

const DEFAULT_TESTNET_GW = "https://testnet-gw.sodex.dev";
const DEFAULT_MAINNET_GW = "https://mainnet-gw.sodex.dev";

// Execution network defaults to testnet per Prime Directive 5 (SoDEX defaults to testnet;
// real-funds execution only behind an explicit banner). Account reads and the signed
// write-path use this network.
export function getNetwork(): SodexNetwork {
  const raw = (process.env.SODEX_NETWORK ?? "testnet").toLowerCase();
  return raw === "mainnet" ? "mainnet" : "testnet";
}

// Market-data network for public, read-only reads (mark prices, funding, symbols, klines,
// tickers). Defaults to MAINNET so the displayed funding economics are the real, per-asset
// rates — no funds are involved in a read. Execution stays on getNetwork() (testnet).
export function getMarketDataNetwork(): SodexNetwork {
  const raw = (process.env.SODEX_DATA_NETWORK ?? "mainnet").toLowerCase();
  return raw === "testnet" ? "testnet" : "mainnet";
}

// The gateway origin (scheme + host), no path. SODEX_API_BASE overrides everything,
// letting an operator point the client at a self-hosted proxy or a pinned host.
export function getGatewayBase(network: SodexNetwork = getNetwork()): string {
  const override = process.env.SODEX_API_BASE?.trim();
  if (override) return stripTrailingSlash(override);
  return network === "mainnet" ? DEFAULT_MAINNET_GW : DEFAULT_TESTNET_GW;
}

const API_PREFIX = "/api/v1";

export function perpsBaseUrl(network: SodexNetwork = getNetwork()): string {
  return `${getGatewayBase(network)}${API_PREFIX}/perps`;
}

export function spotBaseUrl(network: SodexNetwork = getNetwork()): string {
  return `${getGatewayBase(network)}${API_PREFIX}/spot`;
}

// Join a base with a path and append query params, skipping null/undefined values so we
// never send empty params the venue might reject.
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const url = new URL(`${stripTrailingSlash(base)}/${stripLeadingSlash(path)}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function perpsUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  network: SodexNetwork = getNetwork(),
): string {
  return buildUrl(perpsBaseUrl(network), path, params);
}

export function spotUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  network: SodexNetwork = getNetwork(),
): string {
  return buildUrl(spotBaseUrl(network), path, params);
}

// Shared rate budget (CLAUDE.md Appendix B: 1200 weight/min/IP). Exported for any shared
// limiter the caller wires up; this module itself does not throttle.
export const RATE_LIMIT_WEIGHT_PER_MIN = 1200;

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function stripLeadingSlash(s: string): string {
  return s.replace(/^\/+/, "");
}
