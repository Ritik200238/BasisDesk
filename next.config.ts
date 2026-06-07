import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Next emits a workspace-root warning because a stray package-lock.json exists in a
  // parent directory (C:\Users\ritik). It is non-fatal. We intentionally do not set
  // turbopack.root here — under this Next 16 build the option mis-resolves the entry and
  // fails the build. Revisit before configuring standalone output / deploy tracing.
};

export default nextConfig;
