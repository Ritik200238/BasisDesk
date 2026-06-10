import { classifyRisk, dn, fundingApr, fundingYieldOnCapital, shortLiquidationDistance } from "@/lib/core";
import type { MarkPrice, PerpSymbol } from "@/lib/sodex";
import type { VaultDef, VaultQuote } from "./types";

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
// Fallbacks only used if the live market spec omits a field; the live SoDEX BTC/ETH specs
// provide all of these, so in practice these defaults are not hit.
const DEFAULT_FUNDING_INTERVAL_SEC = 3600;
const DEFAULT_MAINTENANCE_MARGIN_RATE = 0.02;
const DEFAULT_TAKER_FEE = 0.0004;

// Pure: turn a live SoDEX mark price + market spec into a deterministic vault quote.
// Every figure here is computed by the core math and is reproducible from the inputs.
export function buildVaultQuote(
  vault: VaultDef,
  mark: MarkPrice,
  spec: PerpSymbol,
  executionSymbolId: number | null,
  asOf: Date,
): VaultQuote {
  const markPrice = Number(mark.markPrice);
  const fundingRatePerInterval = Number(mark.fundingRate);
  const fundingIntervalSec = spec.fundingInterval ?? DEFAULT_FUNDING_INTERVAL_SEC;
  const intervalsPerYear = SECONDS_PER_YEAR / fundingIntervalSec;

  const fundingAprOnNotional = fundingApr(fundingRatePerInterval, intervalsPerYear);
  const fundingAprOnCapital = fundingYieldOnCapital(fundingAprOnNotional, vault.targetLeverage);

  const maintenanceMarginRate = Number(
    spec.marginTiers?.[0]?.maintenanceMarginRate ?? DEFAULT_MAINTENANCE_MARGIN_RATE,
  );
  const takerFee = Number(spec.takerFee ?? DEFAULT_TAKER_FEE);

  // At entry the spot and short are equal and priced at the mark, so current == entry.
  const liquidationDistance = shortLiquidationDistance(
    dn(mark.markPrice),
    dn(mark.markPrice),
    vault.targetLeverage,
    maintenanceMarginRate,
  );

  const risk = classifyRisk({
    deltaRatio: 0,
    liquidationDistance,
    fundingApr: fundingAprOnNotional,
  });

  return {
    vault,
    // Execution id from the testnet (sandbox) network, where any order is placed.
    symbolId: executionSymbolId,
    markPrice,
    fundingRatePerInterval,
    fundingIntervalSec,
    fundingAprOnNotional,
    fundingAprOnCapital,
    maintenanceMarginRate,
    takerFee,
    liquidationDistance,
    nextFundingTime: mark.nextFundingTime,
    fundingPositive: fundingRatePerInterval > 0,
    risk,
    asOf: asOf.toISOString(),
    sources: {
      markPrice: "SoDEX mainnet /markets/mark-prices",
      spec: "SoDEX mainnet /markets/symbols",
    },
  };
}
