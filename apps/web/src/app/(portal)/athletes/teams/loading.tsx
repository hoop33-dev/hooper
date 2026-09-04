import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function TeamsLoading() {
  return (
    <PageSkeleton
      toolbar
      title="Teams"
      subtitle="Group athletes into teams and assign programs together">
      <TableSkeleton columns={["Team", "Program", "Members"]} />
    </PageSkeleton>
  );
}
