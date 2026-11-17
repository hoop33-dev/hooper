"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import {
  PackageBuyersSkeleton,
  PackageContentsSkeleton,
  PackageHeaderSkeleton,
  PackageOverviewSkeleton,
} from "./PackageDetailSkeleton";

/** The `[slug]` layout's Suspense fallback: the header plus the skeleton of
 * whichever tab is being opened, so a direct load of /buyers or /contents
 * doesn't flash the Overview cards first. */
export function PackageDetailFallback() {
  const segment = useSelectedLayoutSegment();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PackageHeaderSkeleton />
      {segment === "buyers" ? (
        <PackageBuyersSkeleton />
      ) : segment === "contents" ? (
        <PackageContentsSkeleton />
      ) : (
        <PackageOverviewSkeleton />
      )}
    </div>
  );
}
