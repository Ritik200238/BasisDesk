import { NextResponse } from "next/server";
import { getAccountState } from "@/lib/sodex";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Resolve a wallet address to its SoDEX account id (aid), server-side (the browser cannot call
// the gateway directly because of CORS). Used to auto-fill the account id in the deposit flow.
export async function GET(req: Request): Promise<Response> {
  if (!rateLimit(`account:${clientIp(req)}`, 60, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const address = new URL(req.url).searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ ok: false, error: "valid 0x address required" }, { status: 400 });
  }
  const res = await getAccountState(address);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error.message });
  }
  return NextResponse.json({ ok: true, aid: res.data.aid });
}
