import { Suspense } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { AutoRefresh } from "@/components/AutoRefresh";
import { VaultInsight, VaultInsightSkeleton } from "@/components/vault/VaultInsight";

// Live SoDEX funding is read per request, so render dynamically.
export const dynamic = "force-dynamic";

const MECHANICS = [
  {
    step: "01",
    title: "Neutralize",
    body: "Every unit of spot exposure is matched by one unit of short perpetual. Net delta targets zero, and the vault dashboard proves the residual stays inside tolerance.",
  },
  {
    step: "02",
    title: "Harvest funding",
    body: "Perp shorts are paid funding when longs are crowded. That payment, settled hourly on SoDEX, is the vault's yield — sourced from market structure, not token inflation.",
  },
  {
    step: "03",
    title: "De-risk on signal",
    body: "When SoSoValue ETF flows turn negative or funding flips, the vault flags it and proposes a defensive move. Nothing executes without your signature.",
  },
  {
    step: "04",
    title: "Sign every move",
    body: "You confirm and sign each fund-moving action in your own wallet, after a receipt restating size, fees, and worst case. BasisDesk never holds your keys.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <AutoRefresh intervalMs={30_000} />
      <section className="flex flex-col gap-5 pt-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-micro font-semibold uppercase tracking-wide text-accent">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Delta-neutral yield
        </span>
        <h1 className="max-w-3xl text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-foreground">
          Earn the funding rate. <span className="text-muted">Not the price.</span>
        </h1>
        <p className="max-w-2xl text-lead text-muted">
          BasisDesk holds spot exposure and shorts the matching SoDEX perpetual in equal size, so
          the position stays market-neutral: its value barely moves when price does. The yield is
          the funding rate the short collects each hour. SoSoValue flow and news data decide when
          to hold and when to step back.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Link
            href="#live-vaults"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-body font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Explore vaults →
          </Link>
          <Link
            href="/vaults/btc-neutral"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-5 text-body font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            See the hedge hold
          </Link>
        </div>
      </section>

      <section id="live-vaults" className="scroll-mt-20">
        <Suspense fallback={<VaultInsightSkeleton />}>
          <VaultInsight />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent">
            The core loop
          </span>
          <h2 className="text-stat font-bold tracking-tight text-foreground">
            Four steps. You sign every one.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MECHANICS.map((m) => (
            <Card key={m.step}>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-micro font-semibold text-accent">{m.step}</span>
                <h3 className="text-lead font-semibold text-foreground">{m.title}</h3>
                <p className="text-body text-muted">{m.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
