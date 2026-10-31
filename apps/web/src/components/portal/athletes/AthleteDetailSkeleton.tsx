"use client";

import { cn } from "@/src/lib/cn";
import { useSelectedLayoutSegment } from "next/navigation";
import { CardSkeleton } from "../ui/DetailPageSkeleton";
import { ArrowLeftIcon } from "../ui/icons";

/* Placeholders mirroring `AthleteDetailShell` and its tabs, so the swap to
   real content doesn't shift layout. */

function AthleteHeaderSkeleton() {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b">
      <div className="border-portal-border flex min-h-[38px] items-center justify-between gap-4 border-b px-7 py-2.5">
        <span className="text-portal-text3 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <ArrowLeftIcon size={13} />
          Back
        </span>
        <div className="bg-portal-border/50 h-3 w-28 animate-pulse rounded" />
      </div>
      <div className="border-portal-border flex items-center gap-4 border-b px-7 py-4">
        <div className="bg-portal-border/60 h-[52px] w-[52px] animate-pulse rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="bg-portal-border/60 h-5 w-44 animate-pulse rounded" />
          <div className="bg-portal-border/40 h-3 w-80 animate-pulse rounded" />
        </div>
      </div>
      <div className="flex h-[60px] items-center gap-7 px-7">
        {[28, 14, 12].map((w, i) => (
          <div
            key={i}
            style={{ width: w * 4 }}
            className="bg-portal-border/50 h-3 animate-pulse rounded"
          />
        ))}
      </div>
    </div>
  );
}

const TABS = {
  training: {
    grid: "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]",
    columns: [[2, 2], [4]],
  },
  details: {
    grid: "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
    columns: [[5], [3]],
  },
  billing: {
    grid: "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
    columns: [[2], [1]],
  },
} as const;

/** One tab's body — also the tab routes' loading.tsx. */
export function AthleteTabSkeleton({ tab }: { tab: keyof typeof TABS }) {
  const { grid, columns } = TABS[tab];
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <div className={cn("grid items-start gap-5", grid)}>
        {columns.map((cards, i) => (
          <div key={i} className="flex flex-col gap-5">
            {cards.map((rows, j) => (
              <CardSkeleton key={j} rows={rows} />
            ))}
          </div>
        ))}
      </div>
      {tab === "billing" && <CardSkeleton rows={4} />}
    </div>
  );
}

/** The `[id]` layout's Suspense fallback: the header plus the skeleton of
 * whichever tab is being opened. */
export function AthleteDetailFallback() {
  const segment = useSelectedLayoutSegment();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AthleteHeaderSkeleton />
      <AthleteTabSkeleton
        tab={
          segment === "details" || segment === "billing" ? segment : "training"
        }
      />
    </div>
  );
}
