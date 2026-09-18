import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { ReactNode } from "react";

interface DashboardListCardProps {
  title: string;
  href: string;
  viewAllLabel: string;
  icon: ReactNode;
  isEmpty: boolean;
  emptyTitle: string;
  emptyHint: string;
  children: ReactNode;
  /** Deep-links to the full list page with its create modal pre-opened
   * (`?create=1`). Omit for cards with no create flow (Athletes, Teams —
   * athletes/teams aren't created from a modal the same way). */
  createHref?: string;
  createLabel?: string;
}

export function DashboardListCard({
  title,
  href,
  viewAllLabel,
  icon,
  isEmpty,
  emptyTitle,
  emptyHint,
  children,
  createHref,
  createLabel,
}: DashboardListCardProps) {
  return (
    <div className="border-portal-border bg-portal-card overflow-hidden rounded-xl border">
      <div className="border-portal-border flex h-14 items-center justify-between border-b px-5">
        <AppLink
          href={href}
          className="text-portal-text1 flex items-center gap-2 text-sm font-bold hover:underline">
          <span className="text-portal-orange">{icon}</span>
          {title}
        </AppLink>
        <div className="flex items-center gap-3">
          {createHref && (
            <AppLink
              href={createHref}
              className="bg-portal-orange-soft text-portal-orange rounded-md px-2 py-1 text-xs font-semibold hover:brightness-95">
              + {createLabel}
            </AppLink>
          )}
          <AppLink
            href={href}
            className="text-portal-orange text-xs font-semibold hover:underline">
            {viewAllLabel}
          </AppLink>
        </div>
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <p className="text-portal-text1 text-sm font-semibold">
            {emptyTitle}
          </p>
          <p className="text-portal-text3 text-xs">{emptyHint}</p>
        </div>
      ) : (
        <div className="divide-portal-border flex flex-col divide-y">
          {children}
        </div>
      )}
    </div>
  );
}
