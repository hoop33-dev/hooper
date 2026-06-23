import { Text, type TextProps } from "react-native";

import { fonts, headingTracking } from "@/src/constants/theme";

type TypographyProps = TextProps & {
  className?: string;
};

const base = "text-text-primary";

/** Display / Hero — 64px */
export function H1({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: fonts.headingBlack,
          fontSize: 64,
          lineHeight: 64 * 1.15,
          letterSpacing: headingTracking(64),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Section heading — 36px */
export function H2({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: 36,
          lineHeight: 36 * 1.15,
          letterSpacing: headingTracking(36),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Card title — 28px */
export function H3({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: 28,
          lineHeight: 28 * 1.3,
          letterSpacing: headingTracking(28),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Sub-heading — 22px */
export function H4({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: fonts.headingSemi,
          fontSize: 22,
          lineHeight: 22 * 1.3,
          letterSpacing: headingTracking(22),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Body — 16px regular */
export function Body({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-secondary ${className}`}
      style={[
        {
          fontFamily: fonts.body,
          fontSize: 16,
          lineHeight: 16 * 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Body small — 13px */
export function BodySm({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-secondary ${className}`}
      style={[
        {
          fontFamily: fonts.body,
          fontSize: 13,
          lineHeight: 13 * 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Label / caps — 11px medium, uppercase */
export function Label({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-tertiary ${className}`}
      style={[
        {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          lineHeight: 11,
          letterSpacing: 11 * 0.15,
          textTransform: "uppercase",
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Stat — 48px black, brand orange */
export function Stat({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-brand-orange ${className}`}
      style={[
        {
          fontFamily: fonts.headingBlack,
          fontSize: 48,
          lineHeight: 48,
          letterSpacing: headingTracking(48),
        },
        style,
      ]}
      {...rest}
    />
  );
}
