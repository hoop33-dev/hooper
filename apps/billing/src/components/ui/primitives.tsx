import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

/** Small typographic + surface primitives from hooper-billing-core.jsx. */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-bp-border bg-bp-card rounded-xl border p-4 md:p-5",
        className,
      )}>
      {children}
    </div>
  );
}

export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-bp-text3 text-[10.5px] font-semibold tracking-[0.12em] uppercase",
        className,
      )}>
      {children}
    </div>
  );
}

export function Title({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-title text-bp-text1 tracking-title text-2xl leading-[1.1] font-extrabold",
        className,
      )}>
      {children}
    </div>
  );
}

export function Money({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-title tracking-title leading-none font-black tabular-nums",
        className,
      )}>
      {children}
    </span>
  );
}

export type TagTone =
  | "neutral"
  | "orange"
  | "green"
  | "amber"
  | "danger"
  | "blue";

const TONE: Record<TagTone, string> = {
  neutral: "bg-black/5 text-bp-text2",
  orange: "bg-orange/10 text-orange",
  green: "bg-green/10 text-green",
  amber: "bg-amber/10 text-amber",
  danger: "bg-danger/10 text-danger",
  blue: "bg-blue/10 text-blue",
};

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: TagTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[10.5px] font-bold tracking-[0.09em] whitespace-nowrap uppercase",
        TONE[tone],
      )}>
      {children}
    </span>
  );
}

const AVATAR_TONE = {
  orange: "from-[#F15825] to-[#B93F19]",
  blue: "from-[#4A7FD4] to-[#2B5AA8]",
  navy: "from-[#123A82] to-[#00205C]",
  slate: "from-[#6B6567] to-[#453F41]",
} as const;

export function Avatar({
  initials,
  size = 36,
  tone = "orange",
}: {
  initials: string;
  size?: number;
  tone?: keyof typeof AVATAR_TONE;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
        AVATAR_TONE[tone],
      )}
      style={{ width: size, height: size }}>
      <span
        className="font-extrabold tracking-[0.02em] text-white"
        style={{ fontSize: size * 0.34 }}>
        {initials}
      </span>
    </div>
  );
}

export function Row({
  label,
  value,
  last,
}: {
  label: ReactNode;
  value: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-[11px]",
        !last && "border-bp-border border-b",
      )}>
      <span className="text-bp-text2 text-[13.5px]">{label}</span>
      <span className="text-bp-text1 text-right text-[13.5px] font-semibold">
        {value}
      </span>
    </div>
  );
}
