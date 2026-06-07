import { NextResponse } from "next/server";
import { getFlowRegime } from "@/lib/flows";
import { getHistoryStore } from "@/lib/history";
import { VAULTS, getVaultQuote } from "@/lib/vault";

export const dynamic = "force-dynamic";

// Records one funding/flow snapshot per vault. Schedule with a Vercel Cron hitting this path.
// Protected by CRON_SECRET when set (Vercel Cron sends Authorization: Bearer <secret>).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const store = getHistoryStore();
  const ts = Date.now();
  const recorded: string[] = [];

  for (const vault of VAULTS) {
    const [q, f] = await Promise.all([getVaultQuote(vault), getFlowRegime(vault.baseAsset)]);
    if (!q.ok) {
      recorded.push(`${vault.symbol}: skipped (quote unavailable)`);
      continue;
    }
    await store.record({
      ts,
      symbol: vault.baseAsset,
      fundingAprOnNotional: q.quote.fundingAprOnNotional,
      flowStance: f.state === "ok" ? f.regime.stance : "unknown",
      latestNetInflowUsd: f.state === "ok" ? f.regime.latestNetInflowUsd : null,
      flowStreakDays: f.state === "ok" ? f.regime.streakDays : null,
    });
    recorded.push(`${vault.symbol}: recorded`);
  }

  return NextResponse.json({ ok: true, ts, recorded });
}
