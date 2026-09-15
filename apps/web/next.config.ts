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
  // Chromium, then post-processes the PDF to stamp fillable form fields.
  // puppeteer/chromium carry native binaries or are require()d conditionally at
  // runtime; unpdf/pdf-lib pull in a serverless pdf.js build that trips the
  // bundler's tracing — keep them all external.
  serverExternalPackages: [
    "puppeteer-core",
    "puppeteer",
    "@sparticuz/chromium",
    "unpdf",
    "pdf-lib",
  ],
  // `serverExternalPackages` only keeps @sparticuz/chromium out of the JS
  // bundle — it doesn't tell output-file-tracing to actually copy the
  // package's compressed Chromium binary (node_modules/@sparticuz/chromium/
  // bin/**) into the deployed function. Without this, the route builds fine
  // but fails at runtime with "input directory .../bin does not exist".
  //
  // The include glob is resolved relative to *this app's* directory
  // (apps/web), not outputFileTracingRoot above — npm workspaces hoist
  // @sparticuz/chromium to the repo-root node_modules, hence "../../".
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output#outputfiletracingincludes
  outputFileTracingIncludes: {
    "/api/programs/[id]/export": [
      "../../node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  experimental: {
    // Every portal route is dynamically rendered (the Supabase server client
    // reads cookies()), so the client Router Cache defaults to a 0s stale time
    // and re-runs every page's Supabase reads on each back/forward or sidebar
    // re-click. Holding dynamic payloads for 30s makes those return-visits
    // instant. In-app mutations still call revalidatePath()/router.refresh(),
    // which expire the cache regardless — a coach always sees their own edits.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
