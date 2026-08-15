import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";

export default function FormsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Forms"
        subtitle="Build check-in forms athletes fill out before a workout"
      />
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <PortalButton variant="primary" className="ml-auto" disabled>
          Create form
        </PortalButton>
      </div>
      <SkeletonTable />
    </div>
  );
}
