export const metadata = { title: "Methodology — BasisDesk" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lead font-medium text-foreground">{title}</h2>
      <div className="flex flex-col gap-2 text-body leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-stat font-semibold tracking-tight text-foreground">Methodology</h1>
        <p className="text-body text-muted">
          How the numbers are computed and where every one of them comes from. Nothing here is
          mocked — each figure traces to a live read or to deterministic math over a live read.
        </p>
      </div>

      <Section title="The strategy">
        <p>
          Each vault runs one delta-neutral basis trade: hold the asset spot and short the matching
          SoDEX perpetual in equal size. Price exposure nets to zero, so value barely moves when the
          asset does. The return is the funding rate the short collects each hour — paid by crowded
          longs, not by token inflation.
        </p>
      </Section>

      <Section title="Funding and favorability">
        <p>
          Funding APR is the live SoDEX <strong className="text-foreground">mainnet</strong> funding
          rate annualized by the deterministic engine — the real economics of the trade. When
          funding is positive the short earns; when negative the short pays. The board ranks markets
          by funding so the trades that are paying right now lead, and labels each as
          &ldquo;short earns&rdquo; or &ldquo;short pays.&rdquo; Order execution runs on the SoDEX
          testnet sandbox.
        </p>
      </Section>

      <Section title="The SoSoValue brain">
        <p>
          SoSoValue daily spot-ETF flows are reduced to a regime per asset. A composite of the
          flow&rsquo;s direction, streak length, magnitude versus the recent norm, and short-term
          trend yields a conviction (low / medium / high) and a position-size multiplier. A
          high-conviction sustained outflow escalates the vault straight to de-risk; inflows keep
          full size. Matched SoSoValue news supplies the grounded &ldquo;why.&rdquo;
        </p>
      </Section>

      <Section title="Deterministic math">
        <p>
          Sizing, net delta, funding annualization, net asset value, and liquidation distance are
          computed in a pure, unit-tested core using fixed-point decimal math — never floating point
          for money, and never inside a language model. The neutrality simulator and the deposit
          preview both run on this same core, so the numbers you sign for are the numbers shown.
        </p>
      </Section>

      <Section title="AI narration">
        <p>
          The one-line explanation on each vault only restates figures the engine already computed.
          It is constrained to a JSON schema, validated, and never produces a price prediction, a
          new number, or advice. If its key is unset it shows an explicit state rather than guessing.
        </p>
      </Section>

      <Section title="Custody and risk">
        <p>
          BasisDesk is non-custodial: it only ever sees public addresses and signed intents, and
          signing happens entirely in your wallet. Every fund-moving action passes a pre-trade
          receipt restating size, fees, and worst case. This is testnet software and not financial
          advice; crypto markets carry risk, including total loss of capital.
        </p>
      </Section>
    </div>
  );
}
