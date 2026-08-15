import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  SkeletonBlock,
  SkeletonCardGrid,
} from "@/src/components/portal/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening with your programs"
      />
      <div className="flex-1 overflow-y-auto px-7 py-6">
        <SkeletonCardGrid count={2} />
        <div className="mt-8">
          <SkeletonBlock className="mb-3 h-3 w-24" />
          <SkeletonCardGrid count={2} />
        </div>
        <SkeletonBlock className="mt-8 h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
