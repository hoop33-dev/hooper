import { ArrowIcon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

/** Big tappable row on the Start screen ("I'm new to Hooper" / "I have an
 * account"). */
export function ChoiceCard({
  href,
  icon,
  title,
  sub,
  cta,
  primary,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  sub: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-xl border p-5 transition-colors",
        primary
          ? "border-orange/25 bg-orange/10 hover:bg-orange/15"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}>
      <div
        className={cn(
          "flex size-[42px] shrink-0 items-center justify-center rounded-[10px]",
          primary ? "bg-orange text-white" : "text-orange bg-white/[0.06]",
        )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-title tracking-title text-[21px] leading-[1.1] font-extrabold text-white uppercase">
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-[1.45] text-white/60">
          {sub}
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-[13px] font-bold",
          primary ? "text-white" : "text-orange",
        )}>
        <span className="hidden md:inline">{cta}</span>
        <ArrowIcon size={14} />
      </div>
    </Link>
  );
}
