import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { valueChainTestnet } from "./chains";

// wagmi config. Injected wallets only (MetaMask, Rabby, etc.); signing SoDEX orders is
// off-chain EIP-712 typed data, so no working RPC is required to connect. Default storage
// (localStorage, SSR-guarded) renders on the server without cookie access.
export const wagmiConfig = createConfig({
  chains: [valueChainTestnet],
  connectors: [injected()],
  transports: { [valueChainTestnet.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
