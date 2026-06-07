// The single central number-formatting module for BasisDesk (CLAUDE.md Section 5:
// "One central formatting module owns price/%/bps/K-M-B/negative/null; no component
// formats numbers itself"). Pure functions, no React, no network.
//
// Money formatting goes through dnum so large USD notionals never lose precision to
// IEEE floats. Rates/percentages are plain `number` ratios by the time they reach the
// edge — the deterministic core (src/lib/core) has already done the exact math — so we
// format them with Intl directly.
//
// Missing data is rendered as an explicit dash, never as "0". A zero is a real measured
// value; a dash means "we do not have this number". Conflating them is a finance bug.

import { format as dnFormat, from as dnFrom, isDnum, type Dnum } from "dnum";

/** The glyph shown when a value is null/undefined/NaN. An en dash, padded for legibility. */
export const MISSING = "—";

/** Anything a formatter might receive for a value that could be absent. */
export type Maybe<T> = T | null | undefined;

/** A monetary value: a dnum (preferred, exact) or a plain number at the display edge. */
export type Money = Dnum | number;

function isMissing(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && !Number.isFinite(value))
  );
}

/**
 * Null/undefined-safe wrapper. Wrap any formatter so absent input renders an explicit
 * dash instead of a fabricated number. This is the enforcement point for "never 0 for
 * missing" — call it at every UI boundary that may lack data.
 *
 *   const usdOrDash = withMissing(formatUsd);
 *   usdOrDash(undefined) // "—"
 */
export function withMissing<A, R>(
  fn: (value: A, ...rest: never[]) => R,
): (value: Maybe<A>) => R | typeof MISSING {
  return (value: Maybe<A>) => (isMissing(value) ? MISSING : fn(value as A));
}

/** Append a timeframe suffix like " (24h)" / " (7d)" when the caller supplies one. */
function withTimeframe(text: string, timeframe?: string): string {
  return timeframe ? `${text} (${timeframe})` : text;
}

// ---------------------------------------------------------------------------
// USD
// ---------------------------------------------------------------------------

export interface UsdOptions {
  /** Fractional digits. Default 2 (cents). Set 0 for whole-dollar notionals. */
  dp?: number;
  /** Show a leading +/- even for positive values. Default false. */
  signed?: boolean;
  /** Compact magnitude (K/M/B) for large notionals. Default false. */
  compact?: boolean;
  /** Drop the "$" prefix (e.g. when the column header already says USD). */
  noSymbol?: boolean;
}

/**
 * Format a USD value. Exact via dnum for dnum inputs; numbers are accepted at the edge.
 *   formatUsd(1234.5)                       // "$1,234.50"
 *   formatUsd(1234.5, { signed: true })     // "+$1,234.50"
 *   formatUsd(-50, { dp: 0 })               // "-$50"
 */
export function formatUsd(value: Money, opts: UsdOptions = {}): string {
  const { dp = 2, signed = false, compact = false, noSymbol = false } = opts;
  const body = dnFormat(coerceDnum(value), {
    digits: dp,
    trailingZeros: dp > 0,
    compact,
    signDisplay: signed ? "exceptZero" : "auto",
  });
  // dnum emits a leading "-" inside `body`; place the symbol after the sign.
  return noSymbol ? body : injectSymbol(body, "$");
}

/** Compact USD with a magnitude suffix: $1.2K / $3.4M / $5.6B. */
export function formatCompactUsd(
  value: Money,
  opts: Omit<UsdOptions, "compact"> = {},
): string {
  return formatUsd(value, { dp: 1, ...opts, compact: true });
}

/** USD that always shows its sign — for deltas, PnL, funding earned. */
export function formatSignedUsd(
  value: Money,
  opts: Omit<UsdOptions, "signed"> = {},
): string {
  return formatUsd(value, { ...opts, signed: true });
}

// ---------------------------------------------------------------------------
// Percent / bps
// ---------------------------------------------------------------------------

export interface PercentOptions {
  /** Fractional digits. Default 2. */
  dp?: number;
  /** Always show a leading +/-. Default false. Use true for change/funding rates. */
  signed?: boolean;
  /**
   * Input is already in percent points (e.g. 2.4 -> "2.40%"). Default false, where the
   * input is a ratio (0.024 -> "2.40%"), matching the core's APR/APY outputs.
   */
  asPercentPoints?: boolean;
  /** Timeframe / provenance suffix the caller attaches, e.g. "24h", "7d funding avg". */
  timeframe?: string;
}

/**
 * Format a rate/percentage. Per CLAUDE.md Section 5 every rate carries a sign option and
 * an optional timeframe suffix supplied by the caller, so the UI shows "+2.4% (24h)"
 * rather than a bare "2.4%".
 *   formatPercent(0.024, { signed: true, timeframe: "24h" }) // "+2.40% (24h)"
 *   formatPercent(0.1423, { dp: 2, timeframe: "7d funding avg" }) // "14.23% (7d funding avg)"
 */
export function formatPercent(value: number, opts: PercentOptions = {}): string {
  const { dp = 2, signed = false, asPercentPoints = false, timeframe } = opts;
  const points = asPercentPoints ? value : value * 100;
  const sign = signed && points > 0 ? "+" : "";
  const text = `${sign}${points.toFixed(dp)}%`;
  return withTimeframe(text, timeframe);
}

export interface BpsOptions {
  /** Fractional digits on the bps figure. Default 0. */
  dp?: number;
  /** Always show a leading +/-. Default false. */
  signed?: boolean;
  /** Input is already in bps. Default false (input is a ratio: 0.0001 -> "1 bps"). */
  asBps?: boolean;
  /** Optional timeframe/provenance suffix. */
  timeframe?: string;
}

/**
 * Format a value in basis points. 1 bps = 0.01%. Funding rates are small enough that bps
 * is the honest unit (CLAUDE.md Appendix B: SoDEX funding is hourly, cap 4%/hr).
 *   formatBps(0.0001)                       // "1 bps"
 *   formatBps(0.00005, { signed: true })    // "+0.5 bps"  (with dp: 1)
 */
export function formatBps(value: number, opts: BpsOptions = {}): string {
  const { dp = 0, signed = false, asBps = false, timeframe } = opts;
  const bps = asBps ? value : value * 10000;
  const sign = signed && bps > 0 ? "+" : "";
  const text = `${sign}${bps.toFixed(dp)} bps`;
  return withTimeframe(text, timeframe);
}

// ---------------------------------------------------------------------------
// Price / quantity
// ---------------------------------------------------------------------------

export interface PriceOptions {
  /** Fractional digits. Default 2; raise for low-priced assets. */
  dp?: number;
  /** Drop the "$" symbol. Default false. */
  noSymbol?: boolean;
}

/**
 * Format an instrument mark/entry price. Distinct from formatUsd so price precision can
 * differ from notional precision (e.g. a sub-dollar token may want dp: 4).
 *   formatPrice(64210.5)             // "$64,210.50"
 *   formatPrice(0.0731, { dp: 4 })   // "$0.0731"
 */
export function formatPrice(value: Money, opts: PriceOptions = {}): string {
  const { dp = 2, noSymbol = false } = opts;
  const body = dnFormat(coerceDnum(value), {
    digits: dp,
    trailingZeros: dp > 0,
    signDisplay: "auto",
  });
  return noSymbol ? body : injectSymbol(body, "$");
}

export interface QtyOptions {
  /** Fractional digits. Default 4 — enough for BTC-scale base units. */
  dp?: number;
  /** Token/ticker unit suffix, e.g. "BTC". Rendered as " BTC". */
  unit?: string;
}

/**
 * Format a base-unit quantity (a token amount), not a USD value.
 *   formatQty(0.5)                       // "0.5000"
 *   formatQty(0.5, { unit: "BTC" })      // "0.5000 BTC"
 */
export function formatQty(value: Money, opts: QtyOptions = {}): string {
  const { dp = 4, unit } = opts;
  const body = dnFormat(coerceDnum(value), {
    digits: dp,
    trailingZeros: true,
    signDisplay: "auto",
  });
  return unit ? `${body} ${unit}` : body;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Coerce a Money to a Dnum for dnFormat. dnum's `from` parses a JS number via its decimal
 * string, so the value is captured exactly — no manual scaling, no 2^53 overflow on large
 * notionals. dnFormat then rounds to the requested display digits deterministically.
 */
function coerceDnum(value: Money): Dnum {
  return isDnum(value) ? value : dnFrom(value as number);
}

/** Place a currency symbol after any leading sign: "-1.00" + "$" -> "-$1.00". */
function injectSymbol(body: string, symbol: string): string {
  if (body.startsWith("-")) return `-${symbol}${body.slice(1)}`;
  if (body.startsWith("+")) return `+${symbol}${body.slice(1)}`;
  return `${symbol}${body}`;
}
