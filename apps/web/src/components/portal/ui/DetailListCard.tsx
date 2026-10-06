"use client";

import { cn } from "@/src/lib/cn";
import { AppLink } from "@hooper/shared/next";
import { Children, type ReactNode } from "react";
import { PlusIcon, XIcon } from "./icons";
import { PortalButton } from "./PortalButton";

export const detailCardClass =
  "border-portal-border bg-portal-card overflow-hidden rounded-xl border";

/** A titled card listing things attached to the page's entity (programs,
 * coaches, athletes, teams…): header with a count and an optional "+ Add"
 * link, `DetailRow` children, and an empty state with a call to action. */
export function DetailListCard({
  title,
  count,
  onAdd,
  addLabel = "Add",
  emptyLabel,
  emptyCta,
  children,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  emptyLabel: string;
  emptyCta?: string;
  children?: ReactNode;
}) {
  const empty =
    count !== undefined ? count === 0 : Children.count(children) === 0;
  return (
    <div className={detailCardClass}>
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-portal-text1 text-sm font-bold">
          {title}
          {count !== undefined && ` (${count})`}
        </h2>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="text-portal-orange flex cursor-pointer items-center gap-1 text-[13px] font-semibold">
            <PlusIcon size={14} /> {addLabel}
          </button>
        )}
      </div>
      {empty ? (
        <div className="p-7 text-center">
          <p className="text-portal-text3 text-[13px]">{emptyLabel}</p>
          {onAdd && emptyCta && (
            <PortalButton
              variant="primary"
              size="sm"
              onClick={onAdd}
              className="mt-3">
              {emptyCta}
            </PortalButton>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function DetailRow({
  lead,
  title,
  sub,
  trail,
  href,
}: {
  lead?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  trail?: ReactNode;
  /** Makes the whole row a link to the item's own page. The trail (e.g. the
   * remove button) sits above the link so it stays clickable. */
  href?: string;
}) {
  const body = (
    <>
      {lead}
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-semibold">
          {title}
        </div>
        {sub && (
          <div className="text-portal-text3 mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]">
            {sub}
          </div>
        )}
      </div>
    </>
  );
  return (
    <div
      className={cn(
        "border-portal-border relative flex items-center gap-3 border-b px-4 py-3 last:border-b-0",
        href && "hover:bg-portal-bg",
      )}>
      {href ? (
        <AppLink
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0">
          {body}
        </AppLink>
      ) : (
        body
      )}
      {trail && <div className="relative z-10 flex-shrink-0">{trail}</div>}
    </div>
  );
}

export function RemoveButton({
  label,
  onClick,
}: {
  /** What's being removed — read out as "Remove {label}". */
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remove ${label}`}
      title="Remove"
      className="border-portal-border flex h-[26px] w-[26px] flex-shrink-0 cursor-pointer items-center justify-center rounded-md border text-red-500 hover:bg-red-50">
      <XIcon size={12} />
    </button>
  );
}

/** Banner for a failed optimistic edit on a detail page. */
export function DetailError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
      {error}
    </div>
  );
}
