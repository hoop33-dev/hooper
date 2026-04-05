import { Text as RNText, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  className?: string;
}

function getLexendFontFamilyForClassName(
  className: string,
  defaultFamily: string,
) {
  const matches = className.match(
    /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
  );
  if (!matches || matches.length === 0) {
    return defaultFamily;
  }

  const lastMatch = matches[matches.length - 1].replace("font-", "");

  if (["thin", "extralight", "light", "normal"].includes(lastMatch)) {
    return "Lexend_400Regular";
  }

  if (["medium", "semibold"].includes(lastMatch)) {
    return "Lexend_600SemiBold";
  }

  return "Lexend_700Bold";
}

function buildTypographyClassName(defaultClasses: string, className = "") {
  return `text-on-surface ${defaultClasses} ${className}`.trim();
}

/**
 * Heading1 — 48px Bold. "Billboard" moments: player XP totals, major section headers.
 */
export function Heading1({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-[48px] leading-[53px] font-bold",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_700Bold",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * Heading2 — 36px Bold. Program titles, page headers.
 */
export function Heading2({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-[36px] leading-[40px] font-bold",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_700Bold",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * Heading3 — 24px SemiBold. Sub-sections, card titles.
 */
export function Heading3({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-[24px] leading-[29px] font-semibold",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_600SemiBold",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * Heading4 — 20px SemiBold. Sub-sections, card subtitles.
 */
export function Heading4({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-[20px] leading-[26px] font-semibold",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_600SemiBold",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * TextLG — 18px Regular. Primary body copy, drill descriptions.
 */
export function TextLG({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-lg leading-[27px] font-normal",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_400Regular",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * Text — 16px Regular. Default body text.
 */
export function Text({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-base leading-6 font-normal",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_400Regular",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * TextSM — 14px Regular. Supporting descriptions, metadata. Min size for youth users.
 */
export function TextSM({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-sm leading-[21px] font-normal",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_400Regular",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}

/**
 * Label — 12px SemiBold. Timestamps, tags, XP chip labels, status badges.
 * Use uppercase with letter-spacing for metadata contexts.
 */
export function Label({ className = "", style, ...props }: TypographyProps) {
  const resolvedClassName = buildTypographyClassName(
    "text-xs leading-[14px] font-semibold",
    className,
  );
  const resolvedFontFamily = getLexendFontFamilyForClassName(
    resolvedClassName,
    "Lexend_600SemiBold",
  );

  return (
    <RNText
      className={resolvedClassName}
      style={[{ fontFamily: resolvedFontFamily }, style]}
      {...props}
    />
  );
}
