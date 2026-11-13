import { PageSkeleton } from "@/src/components/portal/ui/PageSkeleton";
import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

export default function PackagesLoading() {
  return (
    <PageSkeleton
      toolbar
      title="Packages"
      subtitle="Bundle programs and coaches into something athletes can buy">
      <TableSkeleton
        columns={["Package", "Programs", "Coaches", "Price", "Active"]}
        actionColumn
      />
    </PageSkeleton>
  );
}
