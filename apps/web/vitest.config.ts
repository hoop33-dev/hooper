import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  // Cast bridges a harmless vite major-version skew between @vitejs/plugin-react
  // (vite 8) and vitest's bundled vite (vite 7); runtime behaviour is identical.
  plugins: [react()] as ViteUserConfig["plugins"],
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> "./*" path alias used across the app.
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
  },
});
