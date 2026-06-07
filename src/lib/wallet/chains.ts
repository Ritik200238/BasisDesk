import { defineChain } from "viem";

// ValueChain L1 testnet — the chain SoDEX perps settle on (EIP-712 domain chainId 138565).
// The RPC is only needed for on-chain reads/writes; wallet connect and typed-data signing do
// not use it. Set NEXT_PUBLIC_VALUECHAIN_RPC to the real endpoint before enabling chain reads.
const RPC_URL = process.env.NEXT_PUBLIC_VALUECHAIN_RPC ?? "https://rpc-testnet.valuechain.invalid";

export const valueChainTestnet = defineChain({
  id: 138565,
  name: "ValueChain Testnet",
  nativeCurrency: { name: "SOSO", symbol: "SOSO", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: true,
});
