"use client";

import { cn } from "@/src/lib/cn";
import { formatShortDate } from "@/src/lib/format";
import {
  BUYER_COLUMNS,
  buyerAccessLabel,
  buyerStatus,
  type BuyerStatus,
} from "@/src/lib/packages";
import type { PackageBuyerRow } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";
import { AthleteAvatar, athleteName } from "../athletes/AthleteAvatar";
import { matchesSearch } from "../ui/ListToolbar";
import { usePackageDetailContext } from "./PackageDetailShell";

const STATUS: Record<BuyerStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-[#38A169]" },
  past_due: { label: "Past due", className: "text-amber-600" },
  cancelling: { label: "Cancelling", className: "text-amber-600" },
  ended: { label: "Ended", className: "text-portal-text3" },
};

function StatusCell({ buyer }: { buyer: PackageBuyerRow }) {
  const { label, className } = STATUS[buyerStatus(buyer)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold",
        className,
      )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function BuyersTable({
  buyers,
  recurring,
  search,
}: {
  buyers: PackageBuyerRow[];
  recurring: boolean;
  search: string;
}) {
  const columns = BUYER_COLUMNS.map((h) =>
    h === "Access" && recurring ? "Renewal" : h,
  );
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {columns.map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-6 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {buyers.map((b) => (
          <tr
            key={b.purchase_id}
            className="border-portal-border hover:bg-portal-bg relative border-b">
            <td className="py-3.5 pr-6">
              <AppLink
                href={`/athletes/${b.profile_id}`}
                className="flex items-center gap-3 after:absolute after:inset-0 after:z-0">
                <AthleteAvatar profile={b} size={36} />
                <div className="min-w-0">
                  <div className="text-portal-text1 text-[13px] font-bold">
                    {athleteName(b)}
                  </div>
                  {b.username && (
                    <div className="text-portal-text3 mt-px text-[11px]">
                      @{b.username}
                    </div>
                  )}
                </div>
              </AppLink>
            </td>
            <td className="py-3.5 pr-6 text-[13px]">
              <StatusCell buyer={b} />
            </td>
            <td className="text-portal-text2 py-3.5 pr-6 text-[13px]">
              {formatShortDate(b.paid_at ?? b.created_at)}
            </td>
            <td className="text-portal-text2 py-3.5 pr-6 text-[13px]">
              {buyerAccessLabel(b)}
            </td>
            <td className="py-3.5 text-right">
              <span className="border-portal-border text-portal-text2 rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
                View athlete
              </span>
            </td>
          </tr>
        ))}
        {buyers.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="text-portal-text3 py-7 text-center text-[13px]">
              No buyers match &ldquo;{search}&rdquo;
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** Everyone who has bought the package — active first, then ended. */
export function PackageBuyersTab({ buyers }: { buyers: PackageBuyerRow[] }) {
  const { state, buyerSearch: search } = usePackageDetailContext();
  const filtered = buyers.filter((b) =>
    matchesSearch(search, athleteName(b), b.username),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-7 py-2">
        {buyers.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-portal-text1 font-semibold">No buyers yet</p>
            <p className="text-portal-text3 text-sm">
              Share the package link to get started.
            </p>
          </div>
        ) : (
          <BuyersTable
            buyers={filtered}
            recurring={state.local.billing_type === "recurring"}
            search={search}
          />
        )}
      </div>
    </div>
  );
}
