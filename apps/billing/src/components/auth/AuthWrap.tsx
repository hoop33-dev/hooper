import { ChevronIcon } from "@/src/components/icons";
import { LogoMark } from "@/src/components/ui/Logo";
import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

/** Dark full-page frame for every auth/checkout screen: logo header, then a
 * centred column (430px, or 980px when a package summary sits beside it). */
export function AuthWrap({
  children,
  wide,
  back,
}: {
  children: ReactNode;
  wide?: boolean;
  /** Seller label for the "Back to …" link (e.g. their site). */
  back?: { label: string; href: string } | null;
}) {
  return (
    <div className="bg-dk-bg flex min-h-screen flex-col font-sans">
      <header className="flex shrink-0 items-center gap-2.5 px-5 pt-5 md:px-8 md:pt-[26px]">
        <LogoMark size={30} />
        <span className="font-title tracking-title text-[19px] font-black text-white uppercase">
          Hooper
        </span>
        {back && (
          <a
            href={back.href}
            className="ml-1 flex h-[22px] items-center gap-1.5 border-l border-white/10 pl-3.5 text-xs text-white/60">
            <ChevronIcon size={13} dir="left" />
            <span className="md:hidden">Back</span>
            <span className="hidden md:inline">Back to {back.label}</span>
          </a>
        )}
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pt-6 pb-10 md:px-8 md:pt-10 md:pb-14">
        <div className={cn("w-full", wide ? "max-w-[980px]" : "max-w-[430px]")}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function DarkCard({
  children,
  on,
  className,
}: {
  children: ReactNode;
  on?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border",
        on
          ? "border-orange/25 bg-orange/10"
          : "border-white/10 bg-white/[0.04]",
        className,
      )}>
      {children}
    </div>
  );
}

/** Big uppercase condensed headline + optional sub copy. */
export function Hed({
  children,
  sub,
  size = "lg",
}: {
  children: ReactNode;
  sub?: ReactNode;
  size?: "lg" | "xl";
}) {
  return (
    <div className="mb-[26px]">
      <h1
        className={cn(
          "font-title tracking-title leading-[1.02] font-black text-white uppercase",
          size === "xl"
            ? "text-[34px] md:text-[44px]"
            : "text-[34px] md:text-[40px]",
        )}>
        {children}
      </h1>
      {sub && (
        <div className="mt-2.5 text-[14.5px] leading-normal text-white/60">
          {sub}
        </div>
      )}
    </div>
  );
}

/** Numbered form section ("1  YOUR DETAILS"). */
export function Sec({
  n,
  title,
  sub,
  children,
}: {
  n: number;
  title: string;
  sub?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-[30px]">
      <div className={cn("flex items-center gap-2.5", sub ? "mb-1" : "mb-3.5")}>
        <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] font-bold text-white/60">
          {n}
        </div>
        <h2 className="font-title tracking-title text-xl font-extrabold text-white uppercase">
          {title}
        </h2>
      </div>
      {sub && (
        <div className="mb-3.5 ml-8 text-[13px] leading-[1.45] text-white/60">
          {sub}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="border-danger/40 bg-danger/15 rounded-[10px] border px-3.5 py-2.5 text-[13px] text-[#FCA5A5]">
      {children}
    </div>
  );
}

export function SecureNote() {
  return (
    <div className="mt-3.5 flex items-center justify-center gap-2 text-center text-[11.5px] text-white/40">
      <LockGlyph /> Payments processed by Stripe. Hooper never stores your card
      details.
    </div>
  );
}

function LockGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className="text-orange font-bold">
      {children}
    </a>
  );
}
