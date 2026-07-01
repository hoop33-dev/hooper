import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-start justify-between border-b border-portal-border bg-portal-card px-7 py-6",
        className,
      )}
    >
      <div>
        <h1 className="font-title text-[22px] font-extrabold tracking-wide text-portal-text1">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-portal-text2">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
