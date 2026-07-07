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
  async headers() {
    // Content-Security-Policy: keep script/style permissive enough for the Next.js runtime and
    // injected wallets, but lock framing, base-uri, and form-action. connect-src stays broad
    // (https/wss) because an injected wallet may reach arbitrary chain RPCs. frame-ancestors
    // 'self' lets the in-product /brandkit page frame the brand-kit document while cross-origin
    // framing stays blocked (clickjacking protection retained). Fonts are self-hosted via
    // next/font; the google-fonts hosts here exist only for the framed brand-kit document.
    const appCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    // The brand-kit is a self-extracting bundled document that materialises its own assets as
    // blob: URLs. Only this single static file gets the blob: relaxation; the financial app
    // pages never do (they are matched by the negative-lookahead rule below).
    const brandkitCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' blob: https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: blob: https://fonts.gstatic.com",
      "connect-src 'self' blob: data: https:",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    const commonHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];

    return [
      {
        source: "/brandkit.html",
        headers: [{ key: "Content-Security-Policy", value: brandkitCsp }, ...commonHeaders],
      },
      {
        source: "/((?!brandkit\\.html).*)",
        headers: [{ key: "Content-Security-Policy", value: appCsp }, ...commonHeaders],
      },
    ];
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
