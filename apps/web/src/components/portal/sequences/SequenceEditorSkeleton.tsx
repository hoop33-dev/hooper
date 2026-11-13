import { PageHeader } from "../ui/PageHeader";

/** Loading shell for the sequence editor page. */
export function SequenceEditorSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Sequence"
        backHref="/sequences"
        breadcrumbs={[
          { label: "Sequences", href: "/sequences" },
          { label: "…" },
        ]}
        hideMiddle
      />
      <div className="border-portal-border bg-portal-card flex flex-col gap-3 border-b px-7 pt-5 pb-4">
        <div className="bg-portal-border/50 h-3 w-28 animate-pulse rounded" />
        <div className="bg-portal-border/50 h-8 w-72 animate-pulse rounded-lg" />
      </div>
      <div className="bg-portal-bg flex-1 px-7 py-4">
        <div className="bg-portal-border/50 h-72 w-full animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
