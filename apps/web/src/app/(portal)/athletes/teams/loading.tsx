import {
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonTable,
  SkeletonToolbar,
} from "@/src/components/portal/ui/Skeleton";

export default function TeamsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SkeletonPageHeader
        action={<SkeletonBlock className="h-9 w-40 rounded-lg" />}
      />
      <SkeletonToolbar />
      <SkeletonTable />
    </div>
  );
}
