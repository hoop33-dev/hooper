import type { Config } from "tailwindcss";

/**
 * Billing portal tokens, lifted from the "Billing Portal" design
 * (hooper-billing-core.jsx `BP`, hooper-billing-auth.jsx `DK`).
 *
 *   bp-*  light portal surfaces (account pages)
 *   dk-*  dark auth / checkout surfaces (matches the app)
 *
 * Colours are plain hex so Tailwind's /opacity modifier works on them
 * (e.g. bg-orange/10, border-danger/30).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: "#F15825",
        navy: "#00205C",
        blue: "#0047BA",
        green: "#2F855A",
        success: "#22C55E",
        amber: "#B45309",
        danger: "#C53030",
        ink: "#1A1718",
        "ink-soft": "#231F20",
        "ink-raised": "#2D2829",
        bp: {
          bg: "#F5F4F0",
          card: "#FFFFFF",
          border: "#E8E5E0",
          "border-mid": "#D4D0CA",
          text1: "#1A1718",
          text2: "#6B6567",
          text3: "#A09C9D",
        },
        dk: {
          bg: "#1A1718",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Arial", "sans-serif"],
        title: ["var(--font-barlow)", "sans-serif"],
      },
      letterSpacing: {
        title: "0.015em",
      },
    },
  },
};

export default config;
