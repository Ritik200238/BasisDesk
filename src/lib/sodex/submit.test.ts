import { describe, it, expect } from "vitest";
import { OrderSide, PositionSide, buildPerpMarketOrder, newOrderBodyJson } from "./sign";
import { buildPerpsOrderSubmission, nextNonce } from "./submit";

const req = buildPerpMarketOrder({
  accountID: 1001,
  symbolID: 1,
  clOrdID: "hedge-1",
  side: OrderSide.SELL,
  quantity: "0.01",
  positionSide: PositionSide.SHORT,
});

// A placeholder 66-byte wire signature (0x01 + 65 bytes).
const wireSig = `0x01${"ab".repeat(65)}` as `0x${string}`;

describe("buildPerpsOrderSubmission", () => {
  it("POSTs to /api/v1/perps/trade/orders with the params-only body", () => {
    const sub = buildPerpsOrderSubmission({
      request: req,
      wireSignature: wireSig,
      nonce: BigInt(1700000000000),
      chainId: 138565,
      apiKeyName: "my-key",
    });
    expect(sub.method).toBe("POST");
    expect(sub.url).toContain("/api/v1/perps/trade/orders");
    expect(sub.url).toContain("testnet-gw.sodex.dev");
    expect(sub.body).toBe(newOrderBodyJson(req));
    // The body is params only; it must not carry the { type: "newOrder" } signing wrapper.
    expect(sub.body).not.toContain("newOrder");
  });

  it("sets the signature, nonce, chain, and api-key headers", () => {
    const sub = buildPerpsOrderSubmission({
      request: req,
      wireSignature: wireSig,
      nonce: BigInt(1700000000000),
      chainId: 138565,
      apiKeyName: "mm-key",
    });
    expect(sub.headers["X-API-Sign"]).toBe(wireSig);
    expect(sub.headers["X-API-Nonce"]).toBe("1700000000000");
    expect(sub.headers["X-API-Chain"]).toBe("138565");
    expect(sub.headers["X-API-Key"]).toBe("mm-key");
  });

  it("omits X-API-Key when none is given (master-wallet auth)", () => {
    const sub = buildPerpsOrderSubmission({
      request: req,
      wireSignature: wireSig,
      nonce: BigInt(1),
      chainId: 138565,
    });
    expect(sub.headers["X-API-Key"]).toBeUndefined();
  });
});

describe("nextNonce", () => {
  it("is strictly increasing even within the same millisecond", () => {
    const a = nextNonce(1700000000000);
    const b = nextNonce(1700000000000);
    expect(b).toBeGreaterThan(a);
  });
});
