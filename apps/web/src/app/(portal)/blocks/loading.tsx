import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function BlocksLoading() {
  return (
    <PageSkeleton
      headerAction
      title="Block Library"
      subtitle="Save blocks and sessions once, reuse them across every program">
      <TableSkeleton columns={["Template", "Blocks", "Updated"]} actionColumn />
    </PageSkeleton>
  );
}
