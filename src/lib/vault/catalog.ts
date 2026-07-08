import type { VaultDef } from "./types";

// The vault board: one delta-neutral basis trade per SoDEX perp market. The funding rate (live,
// mainnet) decides which trades are paying right now — the board ranks them and shows whether the
// short earns or pays. Market data is read from SoDEX mainnet; signed execution runs on the
// testnet sandbox for any market also listed there (whitelist-gated). Assets that SoSoValue also
// tracks spot-ETF flows for (BTC, ETH, SOL, XRP, AVAX, DOGE, LINK, LTC, HBAR) drive the de-risk
// signal; the rest show an honest "no ETF-flow data" state.
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
    id: "xrp-neutral",
    name: "XRP Market-Neutral",
    symbol: "XRP-USD",
    baseAsset: "XRP",
    targetLeverage: 3,
    blurb:
      "Hold XRP spot and short the XRP-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short — positive when longs are crowded.",
  },
  {
    id: "doge-neutral",
    name: "DOGE Market-Neutral",
    symbol: "DOGE-USD",
    baseAsset: "DOGE",
    targetLeverage: 3,
    blurb:
      "Hold DOGE spot and short the DOGE-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short — positive when longs are crowded.",
  },
  {
    id: "avax-neutral",
    name: "AVAX Market-Neutral",
    symbol: "AVAX-USD",
    baseAsset: "AVAX",
    targetLeverage: 3,
    blurb:
      "Hold AVAX spot and short the AVAX-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short.",
  },
  {
    id: "ltc-neutral",
    name: "LTC Market-Neutral",
    symbol: "LTC-USD",
    baseAsset: "LTC",
    targetLeverage: 3,
    blurb:
      "Hold LTC spot and short the LTC-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short.",
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
  {
    id: "hbar-neutral",
    name: "HBAR Market-Neutral",
    symbol: "HBAR-USD",
    baseAsset: "HBAR",
    targetLeverage: 3,
    blurb:
      "Hold HBAR spot and short the HBAR-USD perpetual in equal size. Price exposure nets to zero; the yield is the funding rate on the short.",
  },
  {
    id: "soso-neutral",
    name: "SOSO Market-Neutral",
    symbol: "SOSO-USD",
    baseAsset: "SOSO",
    targetLeverage: 3,
    blurb:
      "Hold SOSO spot and short the SOSO-USD perpetual in equal size — a delta-neutral position on SoSoValue's own token. The yield is the funding rate on the short.",
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
];

export function getVaultById(id: string): VaultDef | undefined {
  return VAULTS.find((v) => v.id === id);
}
