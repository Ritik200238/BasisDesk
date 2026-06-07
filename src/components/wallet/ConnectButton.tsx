"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui";
import { valueChainTestnet } from "@/lib/wallet/chains";

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  // Wallet state is only known on the client; render a placeholder on the server to avoid a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const injectedConnector = connectors[0];

  if (!mounted) {
    return <div className="h-9 w-32" aria-hidden />;
  }

  if (isConnected && address) {
    if (chainId !== valueChainTestnet.id) {
      return (
        <Button variant="secondary" onClick={() => switchChain({ chainId: valueChainTestnet.id })}>
          Switch to ValueChain
        </Button>
      );
    }
    return (
      <Button variant="secondary" className="font-mono" onClick={() => disconnect()}>
        {shortAddress(address)}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending}
    >
      {isPending ? "Connecting…" : "Connect wallet"}
    </Button>
  );
}
