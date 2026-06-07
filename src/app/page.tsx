import { Card } from "@/components/ui";

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
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4 pt-4">
        <p className="text-micro uppercase tracking-wide text-accent">Delta-neutral yield</p>
        <h1 className="max-w-2xl text-display font-semibold leading-tight tracking-tight text-foreground">
          Hold the asset. Short the perp. Earn the funding.
        </h1>
        <p className="max-w-2xl text-lead text-muted">
          BasisDesk holds spot exposure and shorts the matching SoDEX perpetual in equal size, so
          the position stays market-neutral: its value barely moves when price does. The yield is
          the funding rate the short collects each hour. SoSoValue flow and news data decide when
          to hold and when to step back.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {MECHANICS.map((m) => (
          <Card key={m.step}>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-micro text-accent">{m.step}</span>
              <h2 className="text-lead font-medium text-foreground">{m.title}</h2>
              <p className="text-body text-muted">{m.body}</p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
