"use client";

import { cn } from "@/src/lib/cn";
import { AppLink } from "@hooper/shared/next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface PageTab {
  label: string;
  /** Each tab is its own route, so tabs can be linked to and survive a
   * refresh. The tab whose href matches the current path is active. */
  href: string;
  /** Shown after the label: "Buyers (12)". */
  count?: number;
}

/** Route-based tab strip for a detail page — pass it to `PageHeader`'s
 * `tabs` prop rather than rendering it directly, so it sits on the header's
 * bottom border. Put the shared header in the route's `layout.tsx` and each
 * tab's content in its own `page.tsx`. */
export function PageTabs({
  tabs,
  action,
}: {
  tabs: PageTab[];
  /** Right-aligned control on the tab row, e.g. a tab's search input. */
  action?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-[60px] items-center gap-4 px-7">
      {/* The nav, not each link, hangs 1px past the row so the active
          underline covers the header's bottom border. With the overhang on
          the links they overflowed the nav, whose overflow-x:auto forces
          overflow-y:auto too, so it scrolled vertically by that 1px. */}
      <nav
        aria-label="Page sections"
        className="-mb-px flex h-[calc(100%+1px)] min-w-0 flex-1 gap-7 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <AppLink
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-shrink-0 items-center border-y-2 border-t-transparent text-[13px] whitespace-nowrap transition-colors duration-200",
                active
                  ? "text-portal-text1 border-b-portal-orange font-bold"
                  : "text-portal-text3 hover:text-portal-text1 border-b-transparent font-medium",
              )}>
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </AppLink>
          );
        })}
      </nav>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
