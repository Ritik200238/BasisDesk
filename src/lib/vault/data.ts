// Server-side data layer: fetch live SoDEX data and build vault quotes. Imported by server
// components only (it calls the SoDEX gateway directly).

import { getExecutionSymbolMap, getMarkPrice, getMarketSpec, type SodexError } from "@/lib/sodex";
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

export async function getAllVaultQuotes(): Promise<VaultQuoteResult[]> {
  // Fetch the testnet execution id map once for the whole board.
  const execMap = await getExecutionSymbolMap();
  return Promise.all(VAULTS.map((v) => getVaultQuote(v, execMap)));
}
