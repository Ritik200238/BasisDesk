import Link from "next/link";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// Presentational top bar. The wallet connect control is added later (it needs the wagmi
// provider); until then the header carries the wordmark and the active network only — no
// placeholder connect button, since a dead control would violate CLAUDE.md Section 6.
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 120 120" className="size-7" fill="none" aria-hidden>
              <rect x="18" y="52" width="84" height="7" rx="3.5" className="fill-foreground" />
              <rect x="18" y="63" width="84" height="7" rx="3.5" className="fill-accent" />
              <path
                d="M38 34 L22 50 M82 34 L98 50"
                className="stroke-foreground"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M38 88 L22 72 M82 88 L98 72"
                className="stroke-accent"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-lead font-extrabold tracking-tight text-foreground">BasisDesk</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="text-micro text-muted transition-colors hover:text-foreground">
              Vaults
            </Link>
            <Link
              href="/verify"
              className="text-micro font-semibold text-accent transition-colors hover:text-accent-strong"
            >
              Verify
            </Link>
            <Link
              href="/portfolio"
              className="text-micro text-muted transition-colors hover:text-foreground"
            >
              Portfolio
            </Link>
            <Link
              href="/methodology"
              className="text-micro text-muted transition-colors hover:text-foreground"
            >
              Methodology
            </Link>
            <Link
              href="/brandkit"
              className="text-micro text-muted transition-colors hover:text-foreground"
            >
              Brandkit
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-micro font-semibold uppercase tracking-wide text-muted sm:inline-flex"
            title="Market data is read live from SoDEX mainnet. Order execution is signed non-custodially on the SoDEX testnet sandbox — no real funds move."
          >
            <span className="size-1.5 rounded-full bg-up" aria-hidden />
            Mainnet data
            <span className="text-border-strong" aria-hidden>
              ·
            </span>
            <span className="size-1.5 rounded-full bg-warn" aria-hidden />
            Testnet exec
          </span>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
