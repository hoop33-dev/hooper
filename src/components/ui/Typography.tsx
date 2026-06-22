import { Text, type TextProps } from "react-native";

type TypographyProps = TextProps & {
  className?: string;
};

const base = "text-text-primary";

/** Display / Hero — 64px, black weight, tight tracking */
export function H1({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: "BarlowCondensed-Black",
          fontSize: 64,
          lineHeight: 64 * 1.15,
          letterSpacing: 64 * 0.015,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Section heading — 36px, bold */
export function H2({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: "BarlowCondensed-Bold",
          fontSize: 36,
          lineHeight: 36 * 1.15,
          letterSpacing: 36 * 0.015,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Card title — 28px, bold */
export function H3({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: "BarlowCondensed-Bold",
          fontSize: 28,
          lineHeight: 28 * 1.3,
          letterSpacing: 28 * 0.015,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Sub-heading — 22px, semibold */
export function H4({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} ${className}`}
      style={[
        {
          fontFamily: "BarlowCondensed-SemiBold",
          fontSize: 22,
          lineHeight: 22 * 1.3,
          letterSpacing: 22 * 0.015,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Body — 16px regular, secondary text color */
export function Body({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-secondary ${className}`}
      style={[
        {
          fontFamily: "Outfit",
          fontWeight: "400",
          fontSize: 16,
          lineHeight: 16 * 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Body small — 13px regular */
export function BodySm({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-secondary ${className}`}
      style={[
        {
          fontFamily: "Outfit",
          fontWeight: "400",
          fontSize: 13,
          lineHeight: 13 * 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Label / caps — 11px medium, uppercase, wide tracking */
export function Label({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`text-text-tertiary ${className}`}
      style={[
        {
          fontFamily: "Outfit",
          fontWeight: "500",
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
          fontFamily: "BarlowCondensed-Black",
          fontSize: 48,
          lineHeight: 48,
          letterSpacing: 48 * 0.015,
        },
        style,
      ]}
      {...rest}
    />
  );
}
