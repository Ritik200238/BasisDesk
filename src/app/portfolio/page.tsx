import { WalletPortfolio } from "@/components/vault/WalletPortfolio";

export const metadata = { title: "Portfolio — BasisDesk" };

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-stat font-semibold tracking-tight text-foreground">Portfolio</h1>
        <p className="text-body text-muted">
          Your SoDEX account — equity, open hedge positions, and the funding you have earned. Live
          for your connected wallet.
        </p>
      </div>
      <WalletPortfolio />
    </div>
  );
}
