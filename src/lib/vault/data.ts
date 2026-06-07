// Server-side data layer: fetch live SoDEX data and build vault quotes. Imported by server
// components only (it calls the SoDEX gateway directly).

import { getMarkPrice, getMarketSpec, type SodexError } from "@/lib/sodex";
import { VAULTS } from "./catalog";
import { buildVaultQuote } from "./quote";
import type { VaultDef, VaultQuote } from "./types";

export type VaultQuoteResult =
  | { ok: true; quote: VaultQuote }
  | { ok: false; vault: VaultDef; error: SodexError };

export async function getVaultQuote(vault: VaultDef): Promise<VaultQuoteResult> {
  const [markRes, specRes] = await Promise.all([
    getMarkPrice(vault.symbol),
    getMarketSpec(vault.symbol),
  ]);
  if (!markRes.ok) return { ok: false, vault, error: markRes.error };
  if (!specRes.ok) return { ok: false, vault, error: specRes.error };
  return { ok: true, quote: buildVaultQuote(vault, markRes.data, specRes.data, markRes.asOf) };
}

export async function getAllVaultQuotes(): Promise<VaultQuoteResult[]> {
  return Promise.all(VAULTS.map(getVaultQuote));
}
