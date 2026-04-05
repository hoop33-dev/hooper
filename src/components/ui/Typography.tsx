import { Text as RNText, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  className?: string;
}

/**
 * Heading1 — 48px Bold. "Billboard" moments: player XP totals, major section headers.
 */
export function Heading1({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_700Bold", fontSize: 48, lineHeight: 53 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Heading2 — 36px Bold. Program titles, page headers.
 */
export function Heading2({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_700Bold", fontSize: 36, lineHeight: 40 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Heading3 — 24px SemiBold. Sub-sections, card titles.
 */
export function Heading3({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_600SemiBold", fontSize: 24, lineHeight: 29 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Heading4 — 20px SemiBold. Sub-sections, card subtitles.
 */
export function Heading4({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_600SemiBold", fontSize: 20, lineHeight: 26 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * TextLG — 18px Regular. Primary body copy, drill descriptions.
 */
export function TextLG({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_400Regular", fontSize: 18, lineHeight: 27 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Text — 16px Regular. Default body text.
 */
export function Text({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_400Regular", fontSize: 16, lineHeight: 24 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * TextSM — 14px Regular. Supporting descriptions, metadata. Min size for youth users.
 */
export function TextSM({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_400Regular", fontSize: 14, lineHeight: 21 },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * Label — 12px SemiBold. Timestamps, tags, XP chip labels, status badges.
 * Use uppercase with letter-spacing for metadata contexts.
 */
export function Label({ className = "", style, ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-on-surface ${className}`}
      style={[
        { fontFamily: "Lexend_600SemiBold", fontSize: 12, lineHeight: 14 },
        style,
      ]}
      {...props}
    />
  );
}
