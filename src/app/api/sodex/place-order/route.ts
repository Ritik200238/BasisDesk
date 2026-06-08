import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPerpsOrderSubmission, sendOrderSubmission } from "@/lib/sodex";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const rawOrderSchema = z.object({
  clOrdID: z.string().min(1).max(64),
  modifier: z.number().int(),
  side: z.number().int(),
  type: z.number().int(),
  timeInForce: z.number().int(),
  price: z.string().max(64).optional(),
  quantity: z.string().max(64).optional(),
  funds: z.string().max(64).optional(),
  stopPrice: z.string().max(64).optional(),
  stopType: z.number().int().optional(),
  triggerType: z.number().int().optional(),
  reduceOnly: z.boolean(),
  positionSide: z.number().int(),
});

const bodySchema = z.object({
  request: z.object({
    accountID: z.number().int().nonnegative(),
    symbolID: z.number().int().nonnegative(),
    orders: z.array(rawOrderSchema).min(1).max(10),
  }),
  wireSignature: z.string().regex(/^0x01[0-9a-fA-F]{130}$/),
  nonce: z.string().regex(/^\d+$/),
  chainId: z.number().int(),
  apiKeyName: z.string().max(64).optional(),
});

// The client signs the order in the user's wallet, then POSTs the signed order here. This route
// validates the payload, rate-limits per IP, and forwards it to SoDEX server-side (the browser
// cannot reach the gateway directly because of CORS). The SoDEX response is returned verbatim —
// a non-whitelisted account yields "account not found", never a fabricated success.
export async function POST(req: Request): Promise<Response> {
  const limit = rateLimit(`place-order:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid order payload" }, { status: 400 });
  }

  const { request, wireSignature, nonce, chainId, apiKeyName } = parsed.data;
  const submission = buildPerpsOrderSubmission({
    request,
    wireSignature: wireSignature as `0x${string}`,
    nonce: BigInt(nonce),
    chainId,
    apiKeyName,
  });
  const result = await sendOrderSubmission(submission);
  return NextResponse.json(result);
}
