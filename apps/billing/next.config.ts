import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives in a monorepo (apps/billing). Pin the file-tracing root to
  // the repo root so Next resolves the workspace correctly.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  // Workspace packages ship TypeScript source; let Next transpile them.
  transpilePackages: ["@hooper/db", "@hooper/shared"],
};

export default nextConfig;
