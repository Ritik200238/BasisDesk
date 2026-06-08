import { NextResponse } from "next/server";
import {
  getAccountState,
  getFundingHistory,
  getPerpSymbols,
  getPositions,
} from "@/lib/sodex";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// A connected wallet's SoDEX portfolio: account id + equity, open positions (enriched with the
// numeric symbolId so the client can sign a close), and recent funding payments. All public
// reads, fetched server-side (the browser cannot reach the gateway directly because of CORS).
export async function GET(req: Request): Promise<Response> {
  if (!rateLimit(`portfolio:${clientIp(req)}`, 30, 60_000).ok) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const address = new URL(req.url).searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ ok: false, error: "valid 0x address required" }, { status: 400 });
  }

  const [state, positions, funding, symbols] = await Promise.all([
    getAccountState(address),
    getPositions(address),
    getFundingHistory(address, { limit: 25 }),
    getPerpSymbols(),
  ]);

  const idBySymbol = new Map<string, number>();
  if (symbols.ok) {
    for (const s of symbols.data) {
      if (typeof s.id === "number") idBySymbol.set(s.name, s.id);
    }
  }

  const enrichedPositions = (positions.ok ? positions.data : []).map((p) => ({
    ...p,
    symbolId: idBySymbol.get(p.symbol) ?? null,
  }));

  return NextResponse.json({
    ok: true,
    aid: state.ok ? state.data.aid : null,
    equity: state.ok ? { available: state.data.av ?? null, margin: state.data.am ?? null } : null,
    positions: enrichedPositions,
    funding: funding.ok ? funding.data : [],
  });
}
