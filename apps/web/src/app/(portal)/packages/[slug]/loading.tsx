import { PackageOverviewSkeleton } from "@/src/components/portal/packages/PackageDetailSkeleton";

/** Tab body only — the header lives in `layout.tsx`, which has its own
 * fallback. */
export default function PackageOverviewLoading() {
  return <PackageOverviewSkeleton />;
}
