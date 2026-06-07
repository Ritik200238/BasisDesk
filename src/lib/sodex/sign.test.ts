import { describe, it, expect } from "vitest";
import { recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  EXCHANGE_ACTION_TYPES,
  OrderModifier,
  OrderSide,
  OrderType,
  PositionSide,
  TimeInForce,
  buildPerpMarketOrder,
  computePayloadHash,
  newOrderActionPayloadJson,
  newOrderBodyJson,
  normalizeDecimalString,
  perpsDomain,
  signNewOrder,
  type NewOrderRequestInput,
} from "./sign";

const TEST_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123" as const;
const TESTNET_CHAIN = 138565;

// Reconstruct viem's 65-byte signature (v -> 27/28) from a 66-byte SoDEX wire signature
// (0x01 ++ r ++ s ++ v[0/1]) so we can recover the signer.
function wireToViemSignature(wire: `0x${string}`): `0x${string}` {
  const body = wire.slice(4); // drop 0x01
  const rs = body.slice(0, 128);
  const v = (Number.parseInt(body.slice(128, 130), 16) + 27).toString(16);
  return `0x${rs}${v}`;
}

const exampleReq: NewOrderRequestInput = {
  accountID: 1001,
  symbolID: 1,
  orders: [
    {
      clOrdID: "my-order-001",
      modifier: OrderModifier.NORMAL,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      timeInForce: TimeInForce.GTC,
      price: "50000",
      quantity: "0.1",
      reduceOnly: false,
      positionSide: PositionSide.LONG,
    },
  ],
};

describe("SoDEX order signing", () => {
  it("matches the official auth-doc signing example byte-for-byte", () => {
    // From references/authentication.md (a market buy). This pins our canonical JSON to spec.
    const docReq: NewOrderRequestInput = {
      accountID: 12345,
      symbolID: 1,
      orders: [
        {
          clOrdID: "my-order-1",
          modifier: OrderModifier.NORMAL,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          timeInForce: TimeInForce.IOC,
          quantity: "0.001",
          reduceOnly: false,
          positionSide: PositionSide.BOTH,
        },
      ],
    };
    expect(newOrderActionPayloadJson(docReq)).toBe(
      '{"type":"newOrder","params":{"accountID":12345,"symbolID":1,"orders":[{"clOrdID":"my-order-1","modifier":1,"side":1,"type":2,"timeInForce":3,"quantity":"0.001","reduceOnly":false,"positionSide":1}]}}',
    );
    // The HTTP body is the params only (no type wrapper).
    expect(newOrderBodyJson(docReq)).toBe(
      '{"accountID":12345,"symbolID":1,"orders":[{"clOrdID":"my-order-1","modifier":1,"side":1,"type":2,"timeInForce":3,"quantity":"0.001","reduceOnly":false,"positionSide":1}]}',
    );
  });

  it("strips trailing zeros from decimal strings (the server rejects them)", () => {
    expect(normalizeDecimalString("0.4060")).toBe("0.406");
    expect(normalizeDecimalString("0.0100")).toBe("0.01");
    expect(normalizeDecimalString("50000.00")).toBe("50000");
    expect(normalizeDecimalString("50000")).toBe("50000");
    const json = newOrderActionPayloadJson({
      ...exampleReq,
      orders: [{ ...exampleReq.orders[0], price: "50000.00", quantity: "0.1000" }],
    });
    expect(json).toContain('"price":"50000"');
    expect(json).toContain('"quantity":"0.1"');
  });

  it("omits unset omitempty fields (a market short keeps no price)", () => {
    const json = newOrderActionPayloadJson({
      accountID: 1001,
      symbolID: 1,
      orders: [
        {
          clOrdID: "hedge-1",
          modifier: OrderModifier.NORMAL,
          side: OrderSide.SELL,
          type: OrderType.MARKET,
          timeInForce: TimeInForce.IOC,
          quantity: "0.01",
          reduceOnly: false,
          positionSide: PositionSide.SHORT,
        },
      ],
    });
    expect(json).not.toContain("price");
    expect(json).toContain('"side":2'); // SELL
    expect(json).toContain('"positionSide":3'); // SHORT
  });

  it("produces a stable bytes32 payloadHash", () => {
    expect(computePayloadHash(newOrderActionPayloadJson(exampleReq))).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("signs to a 66-byte wire signature with a 0/1 v byte and round-trips the signer", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const nonce = BigInt(1);
    const { wireSignature, payloadHash } = await signNewOrder({
      request: exampleReq,
      nonce,
      chainId: TESTNET_CHAIN,
      signTypedData: (args) => account.signTypedData(args),
    });

    // 0x01 prefix + 64-byte r,s + a normalized v of 00 or 01.
    expect(wireSignature).toMatch(/^0x01[0-9a-f]{128}(00|01)$/);

    const recovered = await recoverTypedDataAddress({
      domain: perpsDomain(TESTNET_CHAIN),
      types: EXCHANGE_ACTION_TYPES,
      primaryType: "ExchangeAction",
      message: { payloadHash, nonce },
      signature: wireToViemSignature(wireSignature),
    });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("binds the signature to the nonce (replay protection)", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const a = await signNewOrder({ request: exampleReq, nonce: BigInt(1), chainId: TESTNET_CHAIN, signTypedData: (x) => account.signTypedData(x) });
    const b = await signNewOrder({ request: exampleReq, nonce: BigInt(2), chainId: TESTNET_CHAIN, signTypedData: (x) => account.signTypedData(x) });
    expect(a.wireSignature).not.toBe(b.wireSignature);
  });

  it("builds and signs a vault short-hedge market order, round-tripping the signer", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const req = buildPerpMarketOrder({
      accountID: 1001,
      symbolID: 1,
      clOrdID: "hedge-btc-1",
      side: OrderSide.SELL,
      quantity: "0.01",
    });
    expect(req.orders[0].type).toBe(OrderType.MARKET);
    expect(req.orders[0].side).toBe(OrderSide.SELL);
    expect(req.orders[0].positionSide).toBe(PositionSide.BOTH); // one-way mode (verified live)

    const nonce = BigInt(5);
    const { wireSignature, payloadHash } = await signNewOrder({
      request: req,
      nonce,
      chainId: TESTNET_CHAIN,
      signTypedData: (x) => account.signTypedData(x),
    });
    const recovered = await recoverTypedDataAddress({
      domain: perpsDomain(TESTNET_CHAIN),
      types: EXCHANGE_ACTION_TYPES,
      primaryType: "ExchangeAction",
      message: { payloadHash, nonce },
      signature: wireToViemSignature(wireSignature),
    });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });
});
