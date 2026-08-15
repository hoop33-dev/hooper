import {
  SkeletonBlock,
  SkeletonCanvas,
} from "@/src/components/portal/ui/Skeleton";

export default function SessionViewLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-start justify-between border-b px-7 py-6">
        <div>
          <SkeletonBlock className="h-[22px] w-44" />
          <SkeletonBlock className="mt-2.5 h-4 w-32" />
        </div>
        <SkeletonBlock className="h-6 w-40" />
      </div>
      <SkeletonCanvas />
    </div>
  );
}
