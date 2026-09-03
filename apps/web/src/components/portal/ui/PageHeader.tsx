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
  /** Hides the middle band (title, subtitle, action) while keeping the
   * back/breadcrumb rail — driven by the program-week editor's collapse
   * toggle. */
  hideMiddle?: boolean;
  /** Sits the subtitle on the title's baseline instead of stacked beneath
   * it — for short, stat-style subtitles ("1 week · 2 sessions/week"). */
  inlineSubtitle?: boolean;
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
  hideMiddle,
  inlineSubtitle,
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
        <div
          className={cn(
            "border-portal-border flex items-center justify-between gap-4 px-7 py-2.5",
            !hideMiddle && "border-b",
          )}>
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

      {!hideMiddle && (
        <div className="flex items-start justify-between px-7 py-4">
          <div
            className={cn(
              inlineSubtitle && "flex flex-wrap items-baseline gap-x-2.5",
            )}>
            <h1 className="font-title text-portal-text1 text-[22px] font-extrabold tracking-wide">
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  "text-portal-text2 text-sm",
                  !inlineSubtitle && "mt-0.5",
                )}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
    </div>
  );
}
