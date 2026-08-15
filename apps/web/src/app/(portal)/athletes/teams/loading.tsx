import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";

export default function TeamsLoading() {
  return (
    <>
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <PortalButton variant="primary" className="ml-auto" disabled>
          Create team
        </PortalButton>
      </div>
      <SkeletonTable />
    </>
  );
}
