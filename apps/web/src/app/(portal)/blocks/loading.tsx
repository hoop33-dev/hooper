import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";

export default function BlocksLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Block Library"
        subtitle="Save blocks and sessions once, reuse them across every program"
      />
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center justify-end border-b px-7 py-4">
        <PortalButton variant="primary" disabled>
          Create template
        </PortalButton>
      </div>
      <SkeletonTable />
    </div>
  );
}
