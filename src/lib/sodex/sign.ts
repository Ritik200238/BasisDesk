// SoDEX order signing, ported from the official SDK (github.com/sodex-tech/sodex-go-sdk-public:
// common/types/eip712.go, perps/types/new_order_request.go, references/authentication.md).
// This is the real scheme, read from source, not guessed.
//
// Pipeline:
//   1. payloadHash = keccak256( compact JSON of { type, params } )   // Go field order, omitempty, decimals as strings (no trailing zeros)
//   2. EIP-712 sign ExchangeAction(bytes32 payloadHash, uint64 nonce) under domain
//      { name: "futures", version: "1", chainId, verifyingContract: 0x0 }
//   3. convert the signature v byte 27/28 -> 0/1, then prepend 0x01 (SignatureTypeEIP712) -> 66-byte wire sig
//
// viem's signTypedData computes the identical digest, so signing is non-custodial (the wallet
// signs; this module never sees a private key). The wire signature goes in the X-API-Sign header.

import { type Hex, keccak256, toBytes } from "viem";

export const PERPS_DOMAIN_NAME = "futures";
export const VALUECHAIN_TESTNET_CHAIN_ID = 138565;
export const VALUECHAIN_MAINNET_CHAIN_ID = 286623;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function perpsDomain(chainId: number) {
  return { name: PERPS_DOMAIN_NAME, version: "1", chainId, verifyingContract: ZERO_ADDRESS } as const;
}

export const EXCHANGE_ACTION_TYPES = {
  ExchangeAction: [
    { name: "payloadHash", type: "bytes32" },
    { name: "nonce", type: "uint64" },
  ],
} as const;

// Enum wire values (integers), from common/enums/*.go.
export const OrderSide = { BUY: 1, SELL: 2 } as const;
export const OrderType = { LIMIT: 1, MARKET: 2 } as const;
export const TimeInForce = { GTC: 1, FOK: 2, IOC: 3, GTX: 4 } as const;
export const OrderModifier = { NORMAL: 1, STOP: 2, BRACKET: 3, ATTACHED_STOP: 4 } as const;
export const PositionSide = { BOTH: 1, LONG: 2, SHORT: 3 } as const;

export interface RawOrderInput {
  clOrdID: string;
  modifier: number;
  side: number;
  type: number;
  timeInForce: number;
  price?: string;
  quantity?: string;
  funds?: string;
  stopPrice?: string;
  stopType?: number;
  triggerType?: number;
  reduceOnly: boolean;
  positionSide: number;
}

export interface NewOrderRequestInput {
  accountID: number;
  symbolID: number;
  orders: RawOrderInput[];
}

// SoDEX rejects decimal strings with trailing zeros ("0.4060" fails, "0.406" works). The
// signing payload and the HTTP body must use identical normalized values.
export function normalizeDecimalString(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/0+$/, "").replace(/\.$/, "");
}

// One RawOrder with keys in the exact Go struct-field order, omitempty fields omitted when
// unset, decimals normalized — so JSON.stringify reproduces Go's json.Marshal byte-for-byte.
function rawOrderCanonical(o: RawOrderInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  out.clOrdID = o.clOrdID;
  out.modifier = o.modifier;
  out.side = o.side;
  out.type = o.type;
  out.timeInForce = o.timeInForce;
  if (o.price !== undefined) out.price = normalizeDecimalString(o.price);
  if (o.quantity !== undefined) out.quantity = normalizeDecimalString(o.quantity);
  if (o.funds !== undefined) out.funds = normalizeDecimalString(o.funds);
  if (o.stopPrice !== undefined) out.stopPrice = normalizeDecimalString(o.stopPrice);
  if (o.stopType !== undefined) out.stopType = o.stopType;
  if (o.triggerType !== undefined) out.triggerType = o.triggerType;
  out.reduceOnly = o.reduceOnly;
  out.positionSide = o.positionSide;
  return out;
}

function newOrderParams(req: NewOrderRequestInput): Record<string, unknown> {
  return { accountID: req.accountID, symbolID: req.symbolID, orders: req.orders.map(rawOrderCanonical) };
}

// The JSON that is keccak256-hashed into payloadHash (includes the { type, params } wrapper).
export function newOrderActionPayloadJson(req: NewOrderRequestInput): string {
  return JSON.stringify({ type: "newOrder", params: newOrderParams(req) });
}

// The HTTP request body: params only, no type wrapper, same field order as the signing payload.
export function newOrderBodyJson(req: NewOrderRequestInput): string {
  return JSON.stringify(newOrderParams(req));
}

export function computePayloadHash(actionJson: string): Hex {
  return keccak256(toBytes(actionJson));
}

export type SignTypedDataFn = (args: {
  domain: { name: string; version: string; chainId: number; verifyingContract: Hex };
  types: typeof EXCHANGE_ACTION_TYPES;
  primaryType: "ExchangeAction";
  message: { payloadHash: Hex; nonce: bigint };
}) => Promise<Hex>;

// Convert a 65-byte viem signature (v = 27/28) into the SoDEX 66-byte wire format:
// 0x01 ++ r ++ s ++ v(0/1).
function toWireSignature(viemSignature: Hex): Hex {
  const hex = viemSignature.slice(2); // 130 hex chars = 65 bytes
  const rs = hex.slice(0, 128);
  const v = Number.parseInt(hex.slice(128, 130), 16);
  const vNormalized = (v >= 27 ? v - 27 : v) & 0x01;
  return `0x01${rs}${vNormalized.toString(16).padStart(2, "0")}` as Hex;
}

export async function signNewOrder(params: {
  request: NewOrderRequestInput;
  nonce: bigint;
  chainId: number;
  signTypedData: SignTypedDataFn;
}): Promise<{ wireSignature: Hex; payloadHash: Hex; payloadJson: string }> {
  const payloadJson = newOrderActionPayloadJson(params.request);
  const payloadHash = computePayloadHash(payloadJson);
  const signature = await params.signTypedData({
    domain: perpsDomain(params.chainId),
    types: EXCHANGE_ACTION_TYPES,
    primaryType: "ExchangeAction",
    message: { payloadHash, nonce: params.nonce },
  });
  return { wireSignature: toWireSignature(signature), payloadHash, payloadJson };
}

// Convenience: a single-leg market order. The vault's short hedge is a market SELL, SHORT side.
// symbolID is the numeric market id from GET /markets/symbols; accountID and the nonce come
// from the user's SoDEX account.
export function buildPerpMarketOrder(params: {
  accountID: number;
  symbolID: number;
  clOrdID: string;
  side: number;
  quantity: string;
  positionSide: number;
  reduceOnly?: boolean;
}): NewOrderRequestInput {
  return {
    accountID: params.accountID,
    symbolID: params.symbolID,
    orders: [
      {
        clOrdID: params.clOrdID,
        modifier: OrderModifier.NORMAL,
        side: params.side,
        type: OrderType.MARKET,
        timeInForce: TimeInForce.IOC,
        quantity: params.quantity,
        reduceOnly: params.reduceOnly ?? false,
        positionSide: params.positionSide,
      },
    ],
  };
}
