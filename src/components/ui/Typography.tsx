import { Text, type TextProps } from "react-native";

import { fonts } from "@/src/constants/theme";

/**
 * Hooper — Typography
 *
 * The single source of truth for every piece of text in the app.
 *
 * Two typefaces:
 *   • Headings  → Barlow Condensed (a condensed display face)
 *   • Body / UI → Outfit (a clean geometric sans)
 *
 * Want to change a font? Edit the `HEADING` / `BODY` constants below (and the
 * matching files in assets/fonts + registration in app/_layout.tsx).
 * Want to retune a size/weight? Edit `SCALE`.
 *
 * Screens should never set `fontFamily`, `fontSize`, `fontWeight`,
 * `letterSpacing` or `lineHeight` inline — render one of the components
 * below instead. Colour can be overridden per-use with a Tailwind class
 * (e.g. `<Caption className="text-text-secondary" />`) or, for runtime
 * (dynamic) colours, the `style` prop.
 */

/**
 * Heading face. Barlow Condensed has no variable axis on Google Fonts, so each
 * weight is a separate registered family. A heading variant picks the family
 * for its weight (no `fontWeight` needed — the family carries it).
 */
const HEADING = {
  semibold: "BarlowCondensed-SemiBold",
  bold: "BarlowCondensed-Bold",
  extrabold: "BarlowCondensed-ExtraBold",
  black: "BarlowCondensed-Black",
} as const;

/**
 * Body / UI face. Outfit is a variable font, so `fontWeight` works directly.
 * Exported for the few places that can't render a Typography component — most
 * notably `TextInput`, which styles its own text via the `style` prop.
 */
export const BODY_FONT = fonts.body;
const BODY = BODY_FONT;

type Spec = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "uppercase";
};

/** The type scale. One row per semantic style. */
const SCALE = {
  /* ── Headings (Barlow Condensed) ── */
  /** Display / hero — 64px black */
  h1: {
    fontFamily: HEADING.black,
    fontSize: 64,
    lineHeight: 64 * 1.05,
    letterSpacing: -64 * 0.02,
  },
  /** Section heading — 36px bold */
  h2: {
    fontFamily: HEADING.bold,
    fontSize: 36,
    lineHeight: 36 * 1.1,
    letterSpacing: -36 * 0.01,
  },
  /** Card title — 28px bold */
  h3: { fontFamily: HEADING.bold, fontSize: 28, lineHeight: 28 * 1.15 },
  /** Sub-heading — 22px semibold */
  h4: { fontFamily: HEADING.semibold, fontSize: 22, lineHeight: 22 * 1.2 },
  /** Hero / page title — 28px black, e.g. auth headers, "Security" */
  hero: {
    fontFamily: HEADING.black,
    fontSize: 28,
    lineHeight: 28 * 1.05,
    letterSpacing: -28 * 0.02,
  },
  /** Screen header — 22px black, e.g. "Profile" (dashboard tabs) */
  screenTitle: {
    fontFamily: HEADING.black,
    fontSize: 22,
    lineHeight: 22 * 1.1,
  },
  /** Entity name — 20px extrabold, e.g. a player's full name */
  title: { fontFamily: HEADING.extrabold, fontSize: 20, lineHeight: 20 * 1.15 },
  /** Stat — 48px black */
  stat: {
    fontFamily: HEADING.black,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -48 * 0.02,
  },

  /* ── Body / UI (Outfit) ── */
  /** Strong supporting line — 15px extrabold, e.g. a plan name */
  lead: {
    fontFamily: BODY,
    fontWeight: "800",
    fontSize: 15,
    lineHeight: 15 * 1.3,
  },
  /** List/menu row title — 15px semibold */
  rowTitle: {
    fontFamily: BODY,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 15 * 1.3,
  },
  /** Control / tab label — 13px bold */
  tab: {
    fontFamily: BODY,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 13 * 1.2,
  },
  /** Body — 16px regular */
  body: {
    fontFamily: BODY,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
  /** Body small — 13px regular */
  bodySm: {
    fontFamily: BODY,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 13 * 1.5,
  },
  /** Caption / metadata — 12px regular */
  caption: {
    fontFamily: BODY,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 12 * 1.4,
  },
  /** Emphasised metadata — 12px semibold, e.g. a region tag or @username */
  meta: {
    fontFamily: BODY,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 12 * 1.4,
  },
  /** Form field label — 11px medium, uppercase, wide tracking */
  label: {
    fontFamily: BODY,
    fontWeight: "500",
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 11 * 0.12,
    textTransform: "uppercase",
  },
  /** Section header — 11px bold, uppercase */
  overline: {
    fontFamily: BODY,
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 11 * 0.13,
    textTransform: "uppercase",
  },
  /** Micro label — 10px bold, uppercase, e.g. a role chip */
  microLabel: {
    fontFamily: BODY,
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 10,
    letterSpacing: 10 * 0.1,
    textTransform: "uppercase",
  },
} as const satisfies Record<string, Spec>;

type Variant = keyof typeof SCALE;

type TypographyProps = TextProps & { className?: string };

/**
 * Build a Text component bound to one entry in `SCALE`.
 * `colorClass` is the default colour; callers can override via `className`
 * or, for dynamic colours, the `style` prop.
 */
function createType(variant: Variant, colorClass: string) {
  const spec = SCALE[variant];
  return function Typography({
    className = "",
    style,
    ...rest
  }: TypographyProps) {
    return (
      <Text
        className={`${colorClass} ${className}`}
        style={[spec, style]}
        {...rest}
      />
    );
  };
}

/* ── Headings ──────────────────────────────────────────────── */
export const H1 = createType("h1", "text-text-primary");
export const H2 = createType("h2", "text-text-primary");
export const H3 = createType("h3", "text-text-primary");
export const H4 = createType("h4", "text-text-primary");
export const Hero = createType("hero", "text-text-primary");
export const ScreenTitle = createType("screenTitle", "text-text-primary");
export const Title = createType("title", "text-text-primary");

/* ── Body ──────────────────────────────────────────────────── */
export const Lead = createType("lead", "text-text-primary");
export const RowTitle = createType("rowTitle", "text-text-primary");
export const TabLabel = createType("tab", "text-text-primary");
export const Body = createType("body", "text-text-secondary");
export const BodySm = createType("bodySm", "text-text-secondary");
export const Caption = createType("caption", "text-text-tertiary");
export const Meta = createType("meta", "text-text-tertiary");

/* ── Labels ────────────────────────────────────────────────── */
export const Label = createType("label", "text-text-tertiary");
export const Overline = createType("overline", "text-text-secondary");
export const MicroLabel = createType("microLabel", "text-text-tertiary");

/* ── Numeric ───────────────────────────────────────────────── */
export const Stat = createType("stat", "text-brand-orange");
