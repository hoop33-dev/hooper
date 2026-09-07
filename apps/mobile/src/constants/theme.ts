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

  transparent: "transparent",
} as const;

export const gradients = {
  /** Diagonal muted rust → dark brown gradient used behind program hero cards. */
  programCard: ["#9C512F", "#452414"] as const,
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

/**
 * Font families. The JS mirror of the typefaces used by the design system:
 * Barlow Condensed for headings, Outfit for body/UI text. Both register one
 * family per weight (React Native can't reliably vary a single variable font),
 * so body text selects weight by family via `bodyFont()`, not `fontWeight`.
 */
export const fonts = {
  heading: "BarlowCondensed",
  body: "Outfit",
} as const;

export type BodyWeight = "400" | "500" | "600" | "700" | "800";

const OUTFIT_BY_WEIGHT: Record<BodyWeight, string> = {
  "400": "Outfit-Regular",
  "500": "Outfit-Medium",
  "600": "Outfit-SemiBold",
  "700": "Outfit-Bold",
  "800": "Outfit-ExtraBold",
};

/**
 * Resolve a body-text weight to its registered Outfit family. Components that
 * can't render a Typography component (e.g. TextInput, SVG text) use this in a
 * `style`/`fontFamily` prop instead of setting `fontWeight`.
 */
export function bodyFont(weight: BodyWeight = "400"): string {
  return OUTFIT_BY_WEIGHT[weight];
}

export const easing = {
  fast: 180,
  base: 240,
  slow: 380,
} as const;
