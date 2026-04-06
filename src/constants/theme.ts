/**
 * Courtside Kinetic — Design Tokens
 *
 * TypeScript mirror of global.css @theme tokens.
 * Use these for programmatic styling: StyleSheet, inline styles, animations, gradients.
 * For className-based styling, use the Tailwind classes directly.
 */

export const colors = {
  // Brand palette
  primary: "#F26522",
  primaryLight: "#F68D68",
  navy: "#00205C",
  brandBlue: "#0047BA",
  darkGray: "#231F20",

  // Surface hierarchy (dark-first)
  surface: "#161213",
  surfaceLow: "#1e1b1c",
  surfaceContainer: "#252122",
  surfaceHigh: "#2e2b2c",
  surfaceHighest: "#383435",

  // Text
  onSurface: "#F5F5F5",
  onSurfaceMuted: "#7d7b7b",
  onSurfaceFaint: "#4a4748",

  // Subtle tinted surfaces (pre-computed rgba)
  primarySubtle: "rgba(242, 101, 34, 0.15)",
  brandBlueSubtle: "rgba(0, 71, 186, 0.15)",
  primaryLightSubtle: "rgba(246, 141, 104, 0.15)",
  outline: "rgba(245, 245, 245, 0.15)",
} as const;

export const gradients = {
  /** Primary button / hero gradient — 135° */
  primary: ["#F26522", "#F68D68"] as const,
  /** XP reward / completion gradient */
  xpReward: ["#F26522", "#F68D68"] as const,
} as const;

export const shadows = {
  /** Floating elements: FABs, modals, bottom sheets */
  ambient: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 8,
  },
  /** XP reward / achievement unlock glow */
  xpGlow: {
    shadowColor: "#F26522",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const fonts = {
  regular: "Lexend_400Regular",
  semibold: "Lexend_600SemiBold",
  bold: "Lexend_700Bold",
} as const;
