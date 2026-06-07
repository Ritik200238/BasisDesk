import { describe, it, expect } from "vitest";
import {
  fundingsSchema,
  markPricesSchema,
  perpSymbolsSchema,
  positionsDataSchema,
} from "./schemas";

// Fixtures below are trimmed from the LIVE testnet responses (not the stale docs), so the
// tests pin our schemas to the real API shapes.

describe("SoDEX schemas accept the live API shapes", () => {
  it("parses /markets/symbols with margin tiers and fees", () => {
    const sample = [
      {
        id: 1,
        name: "BTC-USD",
        displayName: "BTC-USD",
        baseCoin: "BTC",
        quoteCoin: "vUSDC",
        pricePrecision: 0,
        tickSize: "1",
        quantityPrecision: 5,
        stepSize: "0.00001",
        minNotional: "10",
        maxNotional: "4000000",
        maxLeverage: 25,
        initLeverage: 20,
        marginTiers: [
          { maxNotionalValue: "4000000", maintenanceMarginRate: "0.02", maxLeverage: 25, maintenanceDeduction: "0" },
        ],
        fundingInterval: 3600,
        maxFundingRate: "0.04",
        minFundingRate: "-0.04",
        makerFee: "0.00012",
        takerFee: "0.0004",
        status: "TRADING",
      },
    ];
    const parsed = perpSymbolsSchema.parse(sample);
    expect(parsed[0].name).toBe("BTC-USD");
    expect(parsed[0].maxLeverage).toBe(25);
    expect(parsed[0].marginTiers?.[0].maintenanceMarginRate).toBe("0.02");
    expect(parsed[0].takerFee).toBe("0.0004");
  });

  it("parses /markets/mark-prices using the real fundingRate field", () => {
    const sample = [
      {
        symbol: "BTC-USD",
        openInterest: "220.5369",
        markPrice: "62725",
        indexPrice: "62758",
        fundingRate: "0.0000125",
        nextFundingTime: 1780826400000,
      },
    ];
    const parsed = markPricesSchema.parse(sample);
    expect(parsed[0].markPrice).toBe("62725");
    expect(parsed[0].fundingRate).toBe("0.0000125");
    expect(parsed[0].nextFundingTime).toBe(1780826400000);
  });

  it("parses /accounts/{addr}/positions", () => {
    const sample = {
      positions: [
        {
          symbol: "BTC-USD",
          positionID: 7,
          size: "-0.01",
          entryPrice: "64000",
          unrealizedPnL: "2.10",
          liquidationPrice: "70400",
          leverage: 5,
          marginType: "ISOLATED",
        },
      ],
    };
    const parsed = positionsDataSchema.parse(sample);
    expect(parsed.positions[0].liquidationPrice).toBe("70400");
  });

  it("parses /accounts/{addr}/fundings", () => {
    const sample = [{ symbol: "BTC-USD", fundingAmount: "0.44", fundingTime: 1780826400000 }];
    expect(fundingsSchema.parse(sample)[0].fundingAmount).toBe("0.44");
  });

  it("rejects mark-prices missing the funding rate", () => {
    const bad = [{ symbol: "BTC-USD", markPrice: "62725", nextFundingTime: 1 }];
    expect(markPricesSchema.safeParse(bad).success).toBe(false);
  });
});
