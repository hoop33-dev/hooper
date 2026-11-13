import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function SequencesLoading() {
  return (
    <PageSkeleton
      toolbar
      title="Sequences"
      subtitle="Chain exercises into one drill that's tracked as a single item">
      <TableSkeleton columns={["Sequence", "Steps", "Sets"]} actionColumn />
    </PageSkeleton>
  );
}
