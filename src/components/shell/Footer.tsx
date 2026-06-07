// Standing disclosures. CLAUDE.md Section 8 requires a prominent not-financial-advice and
// non-custodial posture on every page.
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-micro text-muted">
        <p>
          BasisDesk runs on SoDEX testnet. Non-custodial: you sign every action with your own
          wallet, and keys never leave your device.
        </p>
        <p>
          Not financial advice and not an offer or solicitation. Crypto markets carry risk,
          including total loss of capital.
        </p>
      </div>
    </footer>
  );
}
