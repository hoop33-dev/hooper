import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";

const STATUS_FILTERS = ["All", "Draft", "Active"] as const;

export default function ProgramsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Programs"
        subtitle="Create and manage training programs for your athletes"
      />
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              disabled
              className={`rounded-md px-3.5 py-1 text-xs font-semibold ${
                f === "All"
                  ? "border-portal-border bg-portal-card text-portal-text1 border"
                  : "text-portal-text3"
              }`}>
              {f}
            </button>
          ))}
        </div>
        <PortalButton variant="primary" className="ml-auto" disabled>
          Create program
        </PortalButton>
      </div>
      <SkeletonTable />
    </div>
  );
}
