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
      <nav
        aria-label="Page sections"
        className="flex h-full min-w-0 flex-1 gap-7 overflow-x-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <AppLink
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex flex-shrink-0 items-center border-y-2 border-t-transparent text-[13px] whitespace-nowrap transition-colors duration-200",
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
