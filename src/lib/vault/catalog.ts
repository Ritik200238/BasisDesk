import type { VaultDef } from "./types";

// The vault board: one delta-neutral basis trade per SoDEX perp market. The funding rate (live,
// mainnet) decides which trades are paying right now — the board ranks them and shows whether the
// short earns or pays. All five markets also exist on the testnet sandbox, where execution runs.
export const VAULTS: VaultDef[] = [
  {
    id: "btc-neutral",
    name: "BTC Market-Neutral",
    symbol: "BTC-USD",
    baseAsset: "BTC",
    targetLeverage: 3,
    blurb:
      "Hold BTC spot and short the BTC-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short — positive when longs are crowded.",
  },
  {
    id: "eth-neutral",
    name: "ETH Market-Neutral",
    symbol: "ETH-USD",
    baseAsset: "ETH",
    targetLeverage: 3,
    blurb:
      "Hold ETH spot and short the ETH-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short — positive when longs are crowded.",
  },
  {
    id: "sol-neutral",
    name: "SOL Market-Neutral",
    symbol: "SOL-USD",
    baseAsset: "SOL",
    targetLeverage: 3,
    blurb:
      "Hold SOL spot and short the SOL-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short — positive when longs are crowded.",
  },
  {
    id: "gold-neutral",
    name: "Gold Market-Neutral",
    symbol: "XAUT-USD",
    baseAsset: "XAUT",
    targetLeverage: 3,
    blurb:
      "Hold tokenized gold (XAUT) and short the XAUT-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short.",
  },
  {
    id: "link-neutral",
    name: "LINK Market-Neutral",
    symbol: "LINK-USD",
    baseAsset: "LINK",
    targetLeverage: 3,
    blurb:
      "Hold LINK spot and short the LINK-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short.",
  },
];

export function getVaultById(id: string): VaultDef | undefined {
  return VAULTS.find((v) => v.id === id);
}
