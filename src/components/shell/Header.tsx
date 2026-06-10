import Link from "next/link";
import { Badge } from "@/components/ui";
import { ConnectButton } from "@/components/wallet/ConnectButton";

// Presentational top bar. The wallet connect control is added later (it needs the wagmi
// provider); until then the header carries the wordmark and the active network only — no
// placeholder connect button, since a dead control would violate CLAUDE.md Section 6.
export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-accent" aria-hidden />
            <span className="text-lead font-semibold tracking-tight text-foreground">BasisDesk</span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="text-micro text-muted transition-colors hover:text-foreground">
              Vaults
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
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">Testnet</Badge>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
