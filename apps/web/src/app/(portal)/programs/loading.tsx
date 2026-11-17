import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function ProgramsLoading() {
  return (
    <PageSkeleton
      toolbar
      toolbarFilter
      title="Programs"
      subtitle="Create and manage training programs for your athletes">
      <TableSkeleton
        columns={["Program", "Length", "Sessions", "Status", "Updated"]}
        actionColumn
      />
    </PageSkeleton>
  );
}
