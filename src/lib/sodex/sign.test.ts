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
  computePayloadHash,
  newOrderActionPayloadJson,
  perpsDomain,
  signNewOrder,
  type NewOrderRequestInput,
} from "./sign";

// The well-known deterministic test key from the SDK's own signer tests.
const TEST_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123" as const;
const TESTNET_CHAIN = 138565;

// The SDK example: a limit buy of 0.1 at 50000 on symbolID 1, account 1001, long.
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
  it("builds canonical JSON matching the Go struct field order and omitempty", () => {
    expect(newOrderActionPayloadJson(exampleReq)).toBe(
      '{"type":"newOrder","params":{"accountID":1001,"symbolID":1,"orders":[{"clOrdID":"my-order-001","modifier":1,"side":1,"type":1,"timeInForce":1,"price":"50000","quantity":"0.1","reduceOnly":false,"positionSide":2}]}}',
    );
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
    expect(json).toContain('"type":2'); // MARKET
    expect(json).toContain('"positionSide":3'); // SHORT
  });

  it("produces a stable bytes32 payloadHash", () => {
    const h = computePayloadHash(newOrderActionPayloadJson(exampleReq));
    expect(h).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("signs and round-trips to the signer address (the EIP-712 digest is correct)", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const nonce = BigInt(1);
    const { wireSignature, payloadHash } = await signNewOrder({
      request: exampleReq,
      nonce,
      chainId: TESTNET_CHAIN,
      signTypedData: (args) => account.signTypedData(args),
    });

    // 66-byte wire format: 0x01 prefix + 65-byte ECDSA signature.
    expect(wireSignature).toMatch(/^0x01[0-9a-f]{130}$/);

    // Strip the type byte and recover the signer from the same typed data.
    const rawSignature = `0x${wireSignature.slice(4)}` as `0x${string}`;
    const recovered = await recoverTypedDataAddress({
      domain: perpsDomain(TESTNET_CHAIN),
      types: EXCHANGE_ACTION_TYPES,
      primaryType: "ExchangeAction",
      message: { payloadHash, nonce },
      signature: rawSignature,
    });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("binds the signature to the nonce (replay protection)", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const a = await signNewOrder({ request: exampleReq, nonce: BigInt(1), chainId: TESTNET_CHAIN, signTypedData: (x) => account.signTypedData(x) });
    const b = await signNewOrder({ request: exampleReq, nonce: BigInt(2), chainId: TESTNET_CHAIN, signTypedData: (x) => account.signTypedData(x) });
    expect(a.wireSignature).not.toBe(b.wireSignature);
  });
});
