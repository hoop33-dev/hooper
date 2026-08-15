import {
  SkeletonBlock,
  SkeletonCanvas,
} from "@/src/components/portal/ui/Skeleton";

export default function ProgramCanvasLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-start justify-between border-b px-7 py-6">
        <div>
          <SkeletonBlock className="h-[22px] w-52" />
          <SkeletonBlock className="mt-2.5 h-4 w-40" />
        </div>
        <SkeletonBlock className="h-9 w-32 rounded-lg" />
      </div>
      <SkeletonCanvas />
    </div>
  );
}
