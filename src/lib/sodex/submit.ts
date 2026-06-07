// SoDEX authenticated order submission. Construction is exactly per the SDK source
// (client/perps.go PlacePerpsOrder -> POST /api/v1/perps/trade/orders) and the auth reference
// (X-API-Sign / X-API-Nonce / X-API-Chain / X-API-Key headers; body = params only). The POST is
// accepted only for a real testnet-whitelisted account; the construction below is verified.

import type { Hex } from "viem";
import { perpsUrl } from "./config";
import {
  newOrderBodyJson,
  signNewOrder,
  type NewOrderRequestInput,
  type SignTypedDataFn,
} from "./sign";

export interface OrderSubmission {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
}

export function buildPerpsOrderSubmission(params: {
  request: NewOrderRequestInput;
  wireSignature: Hex;
  nonce: bigint;
  chainId: number;
  apiKeyName?: string;
}): OrderSubmission {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Sign": params.wireSignature,
    "X-API-Nonce": params.nonce.toString(),
    "X-API-Chain": String(params.chainId),
  };
  // Required when signing with an API key (the #1 auth mistake is omitting it).
  if (params.apiKeyName) headers["X-API-Key"] = params.apiKeyName;

  return {
    url: perpsUrl("/trade/orders"),
    method: "POST",
    headers,
    body: newOrderBodyJson(params.request),
  };
}

// The SoDEX nonce is a strictly-increasing millisecond timestamp; no endpoint fetch is needed.
let lastNonce = 0;
export function nextNonce(now = Date.now()): bigint {
  let n = now;
  if (n <= lastNonce) n = lastNonce + 1;
  lastNonce = n;
  return BigInt(n);
}

export interface SubmitResult {
  ok: boolean;
  status: number;
  body: unknown;
}

// Send a built submission. Returns the server's response verbatim; a non-whitelisted account
// yields an auth/account error here — never a fabricated success.
export async function sendOrderSubmission(submission: OrderSubmission): Promise<SubmitResult> {
  const res = await fetch(submission.url, {
    method: submission.method,
    headers: submission.headers,
    body: submission.body,
    cache: "no-store",
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

// Full flow: monotonic nonce -> wallet signs -> build POST -> send.
export async function placePerpsOrder(params: {
  request: NewOrderRequestInput;
  chainId: number;
  apiKeyName?: string;
  signTypedData: SignTypedDataFn;
}): Promise<SubmitResult> {
  const nonce = nextNonce();
  const { wireSignature } = await signNewOrder({
    request: params.request,
    nonce,
    chainId: params.chainId,
    signTypedData: params.signTypedData,
  });
  const submission = buildPerpsOrderSubmission({
    request: params.request,
    wireSignature,
    nonce,
    chainId: params.chainId,
    apiKeyName: params.apiKeyName,
  });
  return sendOrderSubmission(submission);
}
