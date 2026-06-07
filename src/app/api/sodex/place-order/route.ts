import { NextResponse } from "next/server";
import {
  buildPerpsOrderSubmission,
  sendOrderSubmission,
  type NewOrderRequestInput,
} from "@/lib/sodex";

export const dynamic = "force-dynamic";

interface PlaceOrderBody {
  request?: NewOrderRequestInput;
  wireSignature?: string;
  nonce?: string;
  chainId?: number;
  apiKeyName?: string;
}

// The client signs the order in the user's wallet, then POSTs the signed order here. This route
// forwards it to SoDEX server-side (the browser cannot call the gateway directly because of
// CORS). The SoDEX response is returned verbatim — for a non-whitelisted account it is
// "account not found", never a fabricated success.
export async function POST(req: Request): Promise<Response> {
  let body: PlaceOrderBody;
  try {
    body = (await req.json()) as PlaceOrderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const { request, wireSignature, nonce, chainId, apiKeyName } = body;
  if (!request || !wireSignature || !nonce || !chainId) {
    return NextResponse.json(
      { ok: false, error: "missing request, wireSignature, nonce, or chainId" },
      { status: 400 },
    );
  }

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
