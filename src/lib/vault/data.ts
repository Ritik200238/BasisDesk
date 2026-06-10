// Server-side data layer: fetch live SoDEX data and build vault quotes. Imported by server
// components only (it calls the SoDEX gateway directly).

import {
  getExecutionSymbolMap,
  getMarkPrice,
  getMarkPrices,
  getMarketSpec,
  getPerpSymbols,
  type SodexError,
} from "@/lib/sodex";
import { VAULTS } from "./catalog";
import { buildVaultQuote } from "./quote";
import type { VaultDef, VaultQuote } from "./types";

export type VaultQuoteResult =
  | { ok: true; quote: VaultQuote }
  | { ok: false; vault: VaultDef; error: SodexError };

export async function getVaultQuote(
  vault: VaultDef,
  execMap?: Map<string, number>,
): Promise<VaultQuoteResult> {
  const [markRes, specRes, map] = await Promise.all([
    getMarkPrice(vault.symbol),
    getMarketSpec(vault.symbol),
    execMap ? Promise.resolve(execMap) : getExecutionSymbolMap(),
  ]);
  if (!markRes.ok) return { ok: false, vault, error: markRes.error };
  if (!specRes.ok) return { ok: false, vault, error: specRes.error };
  const execId = map.get(vault.symbol) ?? null;
  return { ok: true, quote: buildVaultQuote(vault, markRes.data, specRes.data, execId, markRes.asOf) };
}

// The whole board in 3 upstream calls (all mark prices + all specs + the testnet id map) instead
// of two-per-vault, which also keeps us well inside SoDEX's shared per-IP rate budget when the
// board auto-refreshes.
export async function getAllVaultQuotes(): Promise<VaultQuoteResult[]> {
  const [marks, specs, execMap] = await Promise.all([
    getMarkPrices(),
    getPerpSymbols(),
    getExecutionSymbolMap(),
  ]);

  return VAULTS.map((vault) => {
    if (!marks.ok) return { ok: false, vault, error: marks.error };
    if (!specs.ok) return { ok: false, vault, error: specs.error };
    const mark = marks.data.find((m) => m.symbol === vault.symbol);
    const spec = specs.data.find((s) => s.name === vault.symbol);
    if (!mark) {
      return { ok: false, vault, error: { kind: "upstream", message: `No mark price for ${vault.symbol}` } };
    }
    if (!spec) {
      return { ok: false, vault, error: { kind: "upstream", message: `No market spec for ${vault.symbol}` } };
    }
    return {
      ok: true,
      quote: buildVaultQuote(vault, mark, spec, execMap.get(vault.symbol) ?? null, marks.asOf),
    };
  });
}
