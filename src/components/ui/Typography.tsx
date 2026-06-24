import { Text, type TextProps } from "react-native";

/**
 * Hooper — Typography
 *
 * The single source of truth for every piece of text in the app.
 * Want to change the font? Change `FONT_FAMILY`.
 * Want to retune a heading or body size? Edit `SCALE`.
 *
 * Screens should never set `fontFamily`, `fontSize`, `fontWeight`,
 * `letterSpacing` or `lineHeight` inline — render one of the components
 * below instead. Colour can be overridden per-use with a Tailwind class
 * (e.g. `<Caption className="text-text-secondary" />`).
 */

/** The app font. Loaded in app/_layout.tsx as `Inter`. Change it here. */
export const FONT_FAMILY = "Inter";

type Spec = {
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: "uppercase";
};

/** The type scale. One row per semantic style. */
const SCALE = {
  /** Display / hero — 64px black */
  h1: {
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 64 * 1.15,
    letterSpacing: -64 * 0.04,
  },
  /** Section heading — 36px bold */
  h2: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 36 * 1.15,
    letterSpacing: -36 * 0.02,
  },
  /** Card title — 28px bold */
  h3: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 28 * 1.3,
    letterSpacing: -28 * 0.02,
  },
  /** Sub-heading — 22px semibold */
  h4: { fontSize: 22, fontWeight: "600", lineHeight: 22 * 1.3 },
  /** Screen header — 22px black, e.g. "Profile", "Security" */
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 22,
    letterSpacing: -22 * 0.03,
  },
  /** Entity name — 20px extrabold, e.g. a player's full name */
  title: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 20 * 1.2,
    letterSpacing: -20 * 0.02,
  },
  /** Strong supporting line — 15px extrabold, e.g. a plan name */
  lead: { fontSize: 15, fontWeight: "800", lineHeight: 15 * 1.3 },
  /** List/menu row title — 15px semibold */
  rowTitle: { fontSize: 15, fontWeight: "600", lineHeight: 15 * 1.3 },
  /** Body — 16px regular */
  body: { fontSize: 16, fontWeight: "400", lineHeight: 16 * 1.5 },
  /** Body small — 13px regular */
  bodySm: { fontSize: 13, fontWeight: "400", lineHeight: 13 * 1.5 },
  /** Caption / metadata — 12px regular */
  caption: { fontSize: 12, fontWeight: "400", lineHeight: 12 * 1.4 },
  /** Emphasised metadata — 12px semibold, e.g. a region tag or @username */
  meta: { fontSize: 12, fontWeight: "600", lineHeight: 12 * 1.4 },
  /** Form field label — 11px medium, uppercase, wide tracking */
  label: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 11,
    letterSpacing: 11 * 0.15,
    textTransform: "uppercase",
  },
  /** Section header — 11px bold, uppercase */
  overline: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 11,
    letterSpacing: 11 * 0.13,
    textTransform: "uppercase",
  },
  /** Micro label — 10px bold, uppercase, e.g. a role chip */
  microLabel: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
    letterSpacing: 10 * 0.1,
    textTransform: "uppercase",
  },
  /** Stat — 48px black */
  stat: {
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 48,
    letterSpacing: -48 * 0.04,
  },
} as const satisfies Record<string, Spec>;

type Variant = keyof typeof SCALE;

type TypographyProps = TextProps & { className?: string };

/**
 * Build a Text component bound to one entry in `SCALE`.
 * `colorClass` is the default colour; callers can override via `className`.
 */
function createType(variant: Variant, colorClass: string) {
  const spec = { fontFamily: FONT_FAMILY, ...SCALE[variant] };
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
export const ScreenTitle = createType("screenTitle", "text-text-primary");
export const Title = createType("title", "text-text-primary");

/* ── Body ──────────────────────────────────────────────────── */
export const Lead = createType("lead", "text-text-primary");
export const RowTitle = createType("rowTitle", "text-text-primary");
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
