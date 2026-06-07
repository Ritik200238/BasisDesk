import {
  dn,
  shortLiquidationDistance,
  shortLiquidationPrice,
  sizeHedgedPosition,
  toNum,
} from "@/lib/core";

export interface DepositPreviewInput {
  capitalUsd: number;
  markPrice: number;
  leverage: number;
  maintenanceMarginRate: number;
  takerFee: number;
}

// The exact position a deposit would open, computed by the deterministic core. Used by the
// deposit UI and the confirmation receipt so the numbers the user signs for are the same
// numbers that were shown.
export interface DepositPreview {
  capitalUsd: number;
  qty: number;
  spotCostUsd: number;
  marginUsd: number;
  shortNotionalUsd: number;
  liquidationPrice: number;
  liquidationDistance: number;
  entryFeesUsd: number;
  netDeltaUsd: number;
}

export function computeDepositPreview(input: DepositPreviewInput): DepositPreview {
  const pos = sizeHedgedPosition({
    capitalUsd: dn(input.capitalUsd),
    price: dn(input.markPrice),
    leverage: input.leverage,
  });
  const spotCostUsd = toNum(pos.spotCostUsd);
  const shortNotionalUsd = toNum(pos.shortNotionalUsd);
  const liquidationPrice = toNum(
    shortLiquidationPrice(dn(input.markPrice), input.leverage, input.maintenanceMarginRate),
  );
  const liquidationDistance = shortLiquidationDistance(
    dn(input.markPrice),
    dn(input.markPrice),
    input.leverage,
    input.maintenanceMarginRate,
  );
  // Taker fee charged on opening both legs (spot buy + perp short).
  const entryFeesUsd = (spotCostUsd + shortNotionalUsd) * input.takerFee;

  return {
    capitalUsd: input.capitalUsd,
    qty: toNum(pos.qty),
    spotCostUsd,
    marginUsd: toNum(pos.marginUsd),
    shortNotionalUsd,
    liquidationPrice,
    liquidationDistance,
    entryFeesUsd,
    // Long quantity equals short quantity by construction, so entry delta is zero.
    netDeltaUsd: 0,
  };
}
