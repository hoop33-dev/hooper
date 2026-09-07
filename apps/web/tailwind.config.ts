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
        // Portal light-mode palette (exercise library and future portal tabs)
        "portal-bg":     "#F5F4F0",
        "portal-card":   "#FFFFFF",
        "portal-border": "#E8E5E0",
        "portal-border-mid": "#D4D0CA",
        "portal-text1":  "#1A1718",
        "portal-text2":  "#6B6567",
        "portal-text3":  "#A09C9D",
        "portal-orange": "#F15825",
        "portal-orange-soft": "rgba(241,88,37,0.09)",
        "sidebar":       "#1A1718",
        "sidebar-surface2": "#2D2829",
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
