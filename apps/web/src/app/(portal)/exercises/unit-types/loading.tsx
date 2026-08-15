import {
  SkeletonBlock,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/src/components/portal/ui/Skeleton";

export default function UnitTypesLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SkeletonPageHeader
        action={<SkeletonBlock className="h-9 w-36 rounded-lg" />}
      />
      <SkeletonTable />
    </div>
  );
}
