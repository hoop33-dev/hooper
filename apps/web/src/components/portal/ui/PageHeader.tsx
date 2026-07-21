import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** "strong" reads better when the row directly below the header is also
   * bg-portal-card (e.g. the program editor's week strip) — a card-to-card
   * border in the lighter default shade barely registers there, unlike a
   * card-to-page-background transition where it's plenty visible. */
  borderVariant?: "default" | "strong";
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
  borderVariant = "default",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "bg-portal-card flex flex-shrink-0 items-start justify-between border-b px-7 py-6",
        borderVariant === "strong"
          ? "border-portal-border-mid"
          : "border-portal-border",
        className,
      )}>
      <div>
        <h1 className="font-title text-portal-text1 text-[22px] font-extrabold tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="text-portal-text2 mt-0.5 text-sm">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
