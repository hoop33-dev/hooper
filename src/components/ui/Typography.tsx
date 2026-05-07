import { Text, type TextProps } from "react-native";

type TypographyProps = TextProps & {
  className?: string;
};

const base = "text-text-primary font-inter";

/** Display / Hero — 64px, black weight, tight tracking */
export function H1({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} font-black text-[64px] leading-[73.6px] tracking-[-2.56px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Section heading — 36px, bold */
export function H2({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} font-bold text-[36px] leading-[41.4px] tracking-[-0.72px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Card title — 28px, bold */
export function H3({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} font-bold text-[28px] leading-[36.4px] tracking-[-0.56px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Sub-heading — 22px, semibold */
export function H4({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`${base} font-semibold text-[22px] leading-[28.6px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Body — 16px regular, secondary text color */
export function Body({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`font-inter text-text-secondary font-normal text-[16px] leading-[24px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Body small — 13px regular */
export function BodySm({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`font-inter text-text-secondary font-normal text-[13px] leading-[19.5px] ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Label / caps — 11px medium, uppercase, wide tracking */
export function Label({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`font-inter text-text-tertiary font-medium text-[11px] leading-[11px] tracking-[1.65px] uppercase ${className}`}
      style={style}
      {...rest}
    />
  );
}

/** Stat — 48px black, brand orange */
export function Stat({ className = "", style, ...rest }: TypographyProps) {
  return (
    <Text
      className={`font-inter text-brand-orange font-black text-[48px] leading-[48px] tracking-[-1.92px] ${className}`}
      style={style}
      {...rest}
    />
  );
}
