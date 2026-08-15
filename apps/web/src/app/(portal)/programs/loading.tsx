import {
  SkeletonPageHeader,
  SkeletonTable,
  SkeletonToolbar,
} from "@/src/components/portal/ui/Skeleton";

export default function ProgramsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SkeletonPageHeader />
      <SkeletonToolbar />
      <SkeletonTable />
    </div>
  );
}
