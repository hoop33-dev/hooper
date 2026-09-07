import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function FormsLoading() {
  return (
    <PageSkeleton
      headerAction
      title="Forms"
      subtitle="Build check-in forms athletes fill out before a workout">
      <TableSkeleton
        columns={["Form", "Questions", "Programs", "Updated"]}
        actionColumn
      />
    </PageSkeleton>
  );
}
