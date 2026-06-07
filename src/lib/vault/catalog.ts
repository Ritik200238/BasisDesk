import type { VaultDef } from "./types";

// The launch vaults. Kept deliberately narrow (one deep loop before breadth, CLAUDE.md
// Section 4): BTC and ETH market-neutral. Both map to live SoDEX perp markets.
export const VAULTS: VaultDef[] = [
  {
    id: "btc-neutral",
    name: "BTC Market-Neutral",
    symbol: "BTC-USD",
    baseAsset: "BTC",
    targetLeverage: 3,
    blurb:
      "Hold BTC spot and short the BTC-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding the short collects each hour.",
  },
  {
    id: "eth-neutral",
    name: "ETH Market-Neutral",
    symbol: "ETH-USD",
    baseAsset: "ETH",
    targetLeverage: 3,
    blurb:
      "Hold ETH spot and short the ETH-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding the short collects each hour.",
  },
  {
    id: "sol-neutral",
    name: "SOL Market-Neutral",
    symbol: "SOL-USD",
    baseAsset: "SOL",
    targetLeverage: 3,
    blurb:
      "Hold SOL spot and short the SOL-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding the short collects each hour.",
  },
];

export function getVaultById(id: string): VaultDef | undefined {
  return VAULTS.find((v) => v.id === id);
}
