import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function AthletesLoading() {
  return (
    <PageSkeleton
      title="Athletes"
      subtitle="Browse athletes and manage their program assignments">
      <TableSkeleton columns={["Athlete", "Program", "Last login"]} />
    </PageSkeleton>
  );
}
