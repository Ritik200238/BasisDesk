import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { VAULTS } from "@/lib/vault";

export const metadata: Metadata = {
  title: "BasisDesk — Verify",
  description:
    "Every claim BasisDesk makes is checkable: live SoDEX mainnet funding across 11 markets, a unit-tested market-neutrality invariant, and no mocked values anywhere.",
};

const REPO = "https://github.com/Ritik200238/BasisDesk";
const INVARIANT_TEST = `${REPO}/blob/main/src/lib/core/vault.test.ts`;

const STEPS: { n: string; title: string; body: string; href: string; cta: string }[] = [
  {
    n: "01",
    title: "Open the live board",
    body: `All ${VAULTS.length} markets, ranked by the funding rate that is paying right now. Every APR carries a "live, mainnet" label and an as-of timestamp. No wallet, no signup.`,
    href: "/#live-vaults",
    cta: "See the board",
  },
  {
    n: "02",
    title: "Open a vault and read the flow",
    body: "The SoSoValue panel shows the ETF-flow streak, the latest net flow, and the linked news headline that explains it. That signal is what escalates a vault to de-risk.",
    href: "/vaults/btc-neutral",
    cta: "Open BTC vault",
  },
  {
    n: "03",
    title: "Drag the neutrality simulator",
    body: "Move the price. The hedged line stays flat while simply holding swings. It is computed by the same deterministic engine the deposit is signed against — shown equals signed.",
    href: "/vaults/btc-neutral",
    cta: "Test the hedge",
  },
  {
    n: "04",
    title: "Trace any number to its source",
    body: "The methodology page maps every figure on screen to the exact endpoint or the exact function behind it. If a claim has no source, it does not ship.",
    href: "/methodology",
    cta: "Read the methodology",
  },
];

const PROOFS: { claim: string; detail: string; href: string; cta: string; external?: boolean }[] = [
  {
    claim: `${VAULTS.length} live markets`,
    detail:
      "BTC, ETH, SOL, XRP, DOGE, AVAX, LTC, LINK, HBAR, SOSO, and gold — each carrying a real SoDEX mainnet funding rate, ranked so the trades currently paying lead.",
    href: "/#live-vaults",
    cta: "Check the rates",
  },
  {
    claim: "80 unit tests",
    detail:
      "The finance core, the number formatter, both API clients, the ETF-flow regime engine, and the EIP-712 signing path. All green, all in the repo.",
    href: REPO,
    cta: "Read the tests",
    external: true,
  },
  {
    claim: "The market-neutrality invariant",
    detail:
      "One test sizes a $1,000 position at $50,000, recomputes NAV with the price crashed to $40,000 and rallied to $60,000, and asserts $1,000 both times. If it fails, the product is lying — so it is a release gate.",
    href: INVARIANT_TEST,
    cta: "Read the test",
    external: true,
  },
  {
    claim: "Zero mocked values",
    detail:
      "Disconnect the SoSoValue key and the flow surfaces go to an explicit empty state, never a placeholder. Gold and SOSO have no spot ETF, so they say exactly that instead of inventing a number.",
    href: "/methodology",
    cta: "See how",
  },
  {
    claim: "Non-custodial by construction",
    detail:
      "The backend only ever sees public addresses and signed intents. There is no code path that accepts a private key. Every fund-moving action passes a receipt restating size, fees, and worst case before you sign.",
    href: REPO,
    cta: "Read the signing path",
    external: true,
  },
  {
    claim: "A brand system, not a prototype",
    detail:
      "The mark, palette, typography, and usage rules are shipped as a page in the product — because a thing people are asked to trust with money should look like it will still exist next quarter.",
    href: "/brandkit",
    cta: "Open the brand kit",
  },
];

export default function VerifyPage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4 pt-4">
        <span className="text-micro font-semibold uppercase tracking-wide text-accent">Verify</span>
        <h1 className="max-w-3xl text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground">
          Do not take our word for it.
        </h1>
        <p className="max-w-2xl text-lead text-muted">
          Every claim on this page is checkable in about a minute, from this page. If a number is on
          screen anywhere in BasisDesk, it came from a live read or from math you can run yourself.
        </p>
      </section>

      {/* Honest scope — the single most important thing a reviewer needs to know. */}
      <section className="flex flex-col gap-4">
        <h2 className="text-stat font-bold tracking-tight text-foreground">
          What is live, and what is not.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-up">
                <span className="size-1.5 rounded-full bg-up" aria-hidden />
                Live on mainnet
              </span>
              <p className="text-body leading-5 text-muted">
                Funding rates, mark prices, open interest, and 24-hour volume for all{" "}
                {VAULTS.length} markets are read from <strong className="text-foreground">SoDEX
                mainnet</strong> — the real economics of the trade. The SoSoValue ETF-flow signal and
                its grounded news are live. The board, the deposit-preview math, and the neutrality
                simulator all run on that data, with no wallet connected.
              </p>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-warn">
                <span className="size-1.5 rounded-full bg-warn" aria-hidden />
                Sandboxed on testnet
              </span>
              <p className="text-body leading-5 text-muted">
                Order execution. Orders are signed non-custodially in your own wallet — EIP-712,
                primaryType <span className="font-mono">ExchangeAction</span>, chain ID{" "}
                <span className="font-mono">138565</span> — and submitted to the SoDEX{" "}
                <strong className="text-foreground">testnet sandbox</strong>. No real funds move.
                That is deliberate: we do not move real money in a demo.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent">
            Check it yourself
          </span>
          <h2 className="text-stat font-bold tracking-tight text-foreground">
            Four clicks. About sixty seconds.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n}>
              <div className="flex h-full flex-col gap-2">
                <span className="font-mono text-micro font-semibold text-accent">{s.n}</span>
                <h3 className="text-lead font-semibold text-foreground">{s.title}</h3>
                <p className="flex-1 text-body text-muted">{s.body}</p>
                <Link
                  href={s.href}
                  className="mt-1 text-micro font-semibold text-accent underline-offset-2 hover:underline"
                >
                  {s.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent">
            The proofs
          </span>
          <h2 className="text-stat font-bold tracking-tight text-foreground">
            Claims, and where to check them.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROOFS.map((p) => (
            <Card key={p.claim}>
              <div className="flex h-full flex-col gap-2">
                <h3 className="text-lead font-semibold text-foreground">{p.claim}</h3>
                <p className="flex-1 text-body leading-5 text-muted">{p.detail}</p>
                {p.external ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-micro font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    {p.cta} →
                  </a>
                ) : (
                  <Link
                    href={p.href}
                    className="mt-1 text-micro font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    {p.cta} →
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent">
            Why this exists
          </span>
          <h2 className="text-stat font-bold tracking-tight text-foreground">
            The demand is proven. The access is not.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex flex-col gap-2">
              <h3 className="text-lead font-semibold text-foreground">The problem</h3>
              <p className="text-body leading-5 text-muted">
                Most crypto yield is directional risk in disguise, or a token printing more of
                itself. Holders are asked to choose between earning a return and protecting their
                capital.
              </p>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-2">
              <h3 className="text-lead font-semibold text-foreground">The strategy</h3>
              <p className="text-body leading-5 text-muted">
                The basis trade pays from market structure, not inflation: hold spot, short the
                matching perpetual, collect funding. It is the strategy behind one of DeFi&apos;s
                largest synthetic-dollar protocols — proven at scale, and still out of reach for a
                normal holder.
              </p>
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-2">
              <h3 className="text-lead font-semibold text-foreground">The wedge</h3>
              <p className="text-body leading-5 text-muted">
                Running it by hand means sizing two legs, watching funding flip, tracking liquidation
                distance, and knowing when institutional flow turns. BasisDesk runs that loop, and
                shows its work — you reach the insight before you connect a wallet.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 py-5">
        <h2 className="text-lead font-semibold text-foreground">Everything is open</h2>
        <p className="max-w-2xl text-body text-muted">
          The engine, both API clients, the signing path, and every test are public. Read the code
          that produced any number you saw.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-body font-semibold text-on-accent transition-colors hover:bg-accent-strong"
          >
            Read the source →
          </a>
          <Link
            href="/#live-vaults"
            className="inline-flex h-10 items-center rounded-full border border-border-strong bg-surface px-5 text-body font-semibold text-foreground transition-colors hover:border-accent/50"
          >
            Back to the live board
          </Link>
        </div>
      </section>
    </div>
  );
}
