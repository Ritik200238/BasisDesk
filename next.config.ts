import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the file-tracing root to this project. A stray package-lock.json in C:\Users\ritik
  // otherwise makes Next infer the parent directory as the workspace root.
  outputFileTracingRoot: path.resolve("."),
  eslint: {
    // The scaffolded flat ESLint config targets Next 16; under the pinned Next 15.5 its flat
    // exports resolve to a different path. We type-check with `tsc --noEmit` separately, so
    // production builds are not gated on ESLint config loading.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // wagmi's connector index imports every connector, several of which dynamically import
    // optional peer deps we do not use (we only use injected()). Resolve them to empty so the
    // build has no missing-module warnings.
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      accounts: false,
      porto: false,
      "porto/internal": false,
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@metamask/connect-evm": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@walletconnect/ethereum-provider": false,
    };
    return config;
  },
};

export default nextConfig;
