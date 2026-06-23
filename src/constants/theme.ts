/**
 * Hooper — Design Tokens
 *
 * TypeScript mirror of global.css @theme tokens.
 * Use these for programmatic styling (StyleSheet, animations, gradients, shadows).
 * For className-based styling, use the Tailwind utilities directly.
 */

export const colors = {
  // Brand
  brandOrange: "#F15825",
  brandLightOrange: "#F68D68",
  brandNavy: "#00205C",
  brandBlue: "#0047BA",
  brandBlack: "#231F20",
  brandWhite: "#FFFFFF",

  // Surfaces
  surface: "#1A1718",
  surface2: "#2D2829",
  surface3: "#3D3738",

  // Borders
  borderSubtle: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.65)",
  textTertiary: "rgba(255,255,255,0.35)",
  textDisabled: "rgba(255,255,255,0.25)",
  textInverse: "#231F20",

  // Semantic
  danger: "#E53E3E",
  success: "#38A169",
  warning: "#F15825",

  // Orange tints
  orangeTint10: "rgba(241,88,37,0.10)",
  orangeTint20: "rgba(241,88,37,0.20)",
  orangeTint40: "rgba(241,88,37,0.40)",
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  s20: 80,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  orangeGlow: {
    shadowColor: "#F15825",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  navyGlow: {
    shadowColor: "#00205C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
// Change these two strings to retheme every font in the app.
const _heading = "BarlowCondensed";
const _body = "Outfit";

export const fonts = {
  // Headings (Barlow Condensed)
  headingBlack: `${_heading}-Black`,   // H1, Stat, hero titles
  heading: `${_heading}-Bold`,         // H2, H3, section titles
  headingSemi: `${_heading}-SemiBold`, // H4
  headingMed: `${_heading}-Medium`,    // uppercase heading labels
  // Body (Outfit — static weights, one file per weight)
  body: `${_body}-Regular`,
  bodyMedium: `${_body}-Medium`,
  bodySemi: `${_body}-SemiBold`,
  bodyBold: `${_body}-Bold`,
  bodyExtraBold: `${_body}-ExtraBold`,
} as const;

/** 0.015 em letter-spacing for headings */
export const headingTracking = (size: number) => size * 0.015;

export const easing = {
  fast: 180,
  base: 240,
  slow: 380,
} as const;
