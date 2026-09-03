import { cn } from "@/src/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "./icons";

export interface Breadcrumb {
  label: string;
  /** Omit for the current page (always the last crumb). */
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Target of the "← BACK" link in the rail above the title. Set on detail
   * and nested pages; omit on the top-level nav pages. */
  backHref?: string;
  /** Right-aligned breadcrumb trail in the same rail. The last entry is the
   * current page and renders un-linked. */
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs font-semibold">
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-portal-text3">/</span>}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-portal-text3 hover:text-portal-text1 transition">
                {crumb.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-portal-text1" : "text-portal-text3"}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const hasRail = Boolean(backHref || breadcrumbs?.length);

  return (
    <div
      className={cn(
        "border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b",
        className,
      )}>
      {hasRail && (
        <div className="border-portal-border flex items-center justify-between gap-4 border-b px-7 py-2.5">
          {backHref ? (
            <Link
              href={backHref}
              className="text-portal-text3 hover:text-portal-text1 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition">
              <ArrowLeftIcon size={13} />
              Back
            </Link>
          ) : (
            <span />
          )}
          {breadcrumbs?.length ? <BreadcrumbTrail items={breadcrumbs} /> : null}
        </div>
      )}

      <div className="flex items-start justify-between px-7 py-4">
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
    </div>
  );
}
