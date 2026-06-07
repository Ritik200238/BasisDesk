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
};

export default nextConfig;
