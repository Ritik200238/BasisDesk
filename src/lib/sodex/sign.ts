// SoDEX order signing, ported from the official Go SDK (github.com/sodex-tech/sodex-go-sdk-public,
// common/types/eip712.go + perps/types/new_order_request.go). This is the real scheme, not a guess.
//
// Pipeline:
//   1. payloadHash = keccak256( compact JSON of { type, params } )   // Go json.Marshal order, omitempty, decimals as strings
//   2. EIP-712 sign ExchangeAction(bytes32 payloadHash, uint64 nonce) under domain
//      { name: "futures", version: "1", chainId, verifyingContract: 0x0 }
//   3. wire signature = 0x01 (SignatureTypeEIP712) ++ 65-byte ECDSA signature   // 66 bytes
//
// viem's signTypedData computes the identical digest, so signing is non-custodial (the user's
// wallet signs); this module never sees a private key.

import { type Hex, keccak256, toBytes } from "viem";

export const PERPS_DOMAIN_NAME = "futures";
export const VALUECHAIN_TESTNET_CHAIN_ID = 138565;
export const VALUECHAIN_MAINNET_CHAIN_ID = 286623;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function perpsDomain(chainId: number) {
  return { name: PERPS_DOMAIN_NAME, version: "1", chainId, verifyingContract: ZERO_ADDRESS } as const;
}

// The single EIP-712 struct the user actually signs (the action data is hashed into payloadHash).
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
  // Decimal fields are JSON strings to match the server's string-typed API. omitempty.
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

// Build a RawOrder object with keys in the exact Go struct-field order, omitting unset
// omitempty fields, so JSON.stringify reproduces Go's json.Marshal byte-for-byte (our field
// values never contain &, <, or > so JS and Go escaping agree).
function rawOrderCanonical(o: RawOrderInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  out.clOrdID = o.clOrdID;
  out.modifier = o.modifier;
  out.side = o.side;
  out.type = o.type;
  out.timeInForce = o.timeInForce;
  if (o.price !== undefined) out.price = o.price;
  if (o.quantity !== undefined) out.quantity = o.quantity;
  if (o.funds !== undefined) out.funds = o.funds;
  if (o.stopPrice !== undefined) out.stopPrice = o.stopPrice;
  if (o.stopType !== undefined) out.stopType = o.stopType;
  if (o.triggerType !== undefined) out.triggerType = o.triggerType;
  out.reduceOnly = o.reduceOnly;
  out.positionSide = o.positionSide;
  return out;
}

// The exact JSON that is keccak256-hashed into payloadHash.
export function newOrderActionPayloadJson(req: NewOrderRequestInput): string {
  const params = {
    accountID: req.accountID,
    symbolID: req.symbolID,
    orders: req.orders.map(rawOrderCanonical),
  };
  return JSON.stringify({ type: "newOrder", params });
}

export function computePayloadHash(actionJson: string): Hex {
  return keccak256(toBytes(actionJson));
}

// A wallet-agnostic typed-data signer (wagmi's signTypedData, a viem walletClient/account, etc.).
export type SignTypedDataFn = (args: {
  domain: { name: string; version: string; chainId: number; verifyingContract: Hex };
  types: typeof EXCHANGE_ACTION_TYPES;
  primaryType: "ExchangeAction";
  message: { payloadHash: Hex; nonce: bigint };
}) => Promise<Hex>;

// Sign a perps newOrder. Returns the 66-byte wire signature (0x01 ++ 65-byte ECDSA) and the
// payloadHash. Submission (attaching X-API-Key/X-API-Sign/X-API-Nonce and POSTing) is a thin
// layer gated on a whitelisted API key.
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
  // Prepend SignatureTypeEIP712 (0x01) to the 65-byte ECDSA signature.
  const wireSignature = `0x01${signature.slice(2)}` as Hex;
  return { wireSignature, payloadHash, payloadJson };
}

// Convenience: a single-leg market order. The vault's short hedge is a market SELL on the
// SHORT position side. symbolID is the numeric market id from GET /markets/symbols; accountID
// and the nonce come from the user's SoDEX account (both require testnet access).
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
