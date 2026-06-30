import type { Config } from "tailwindcss";

/**
 * Courtside Kinetic — design tokens for the Hooper coach portal.
 *
 * Dark mode only. Surfaces use tier shifts (no borders) to imply elevation.
 * Orange is reserved for primary CTAs and active states; portal surfaces are
 * Navy-heavy. Consumed in CSS via the `@config` directive in globals.css so
 * that utilities such as `bg-surface`, `bg-surface-container`,
 * `text-primary-orange`, etc. are available throughout the portal.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        "primary-orange": "#F26522",
        navy: "#00205C",
        blue: "#0047BA",
        salmon: "#F68D68",
        "neutral-dark": "#231F20",
        // Dark-mode surface hierarchy
        surface: "#161213",
        "surface-container-low": "#1e1b1c",
        "surface-container": "#252122",
        "surface-container-high": "#2e2b2c",
        "surface-container-highest": "#383435",
        // Auth split-screen right panel
        "auth-canvas": "#F2EDE7",
      },
      fontFamily: {
        sans: ["var(--font-lexend)", "Lexend", "sans-serif"],
        title: ["var(--font-barlow)", "'Barlow Condensed'", "sans-serif"],
      },
      boxShadow: {
        // Ambient shadows only — never pure black.
        ambient: "0 8px 24px rgba(0, 0, 0, 0.25)",
        // Orange-tinted glow for XP / completion moments.
        glow: "0 0 24px rgba(242, 101, 34, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
