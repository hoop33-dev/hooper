import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives in a monorepo (apps/web). Pin the file-tracing root to the
  // repo root so Next resolves the workspace correctly and stops warning about
  // multiple lockfiles.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  // Workspace packages ship TypeScript source; let Next transpile them.
  transpilePackages: ["@hooper/db"],
  // The program-PDF route (src/app/api/programs/[id]/export) drives headless
  // Chromium. These carry native binaries / are require()d conditionally at
  // runtime — never bundle them.
  serverExternalPackages: [
    "puppeteer-core",
    "puppeteer",
    "@sparticuz/chromium",
  ],
};

export default nextConfig;
