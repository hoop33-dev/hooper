import { TableSkeleton } from "@/src/components/portal/ui/TableSkeleton";

/**
 * Loading placeholder for the exercise library — the filter/manage toolbar plus
 * the exercise table. Mirrors `ExerciseLibraryShell`'s `LibraryToolbar` +
 * `ExerciseTable` layout so nothing shifts when the real content swaps in.
 */
export function ExerciseLibrarySkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-wrap items-center gap-3 border-b px-7 py-3">
        <div className="bg-portal-border/50 h-9 w-40 animate-pulse rounded-lg" />
        <div className="bg-portal-border/40 h-9 w-44 animate-pulse rounded-lg" />
        <div className="bg-portal-border/40 h-9 w-36 animate-pulse rounded-lg" />
        <div className="bg-portal-border/40 h-9 w-40 animate-pulse rounded-lg" />
        <div className="ml-auto flex items-center gap-3">
          <div className="bg-portal-border/50 h-9 w-56 animate-pulse rounded-lg" />
          <div className="bg-portal-border/50 h-9 w-24 animate-pulse rounded-lg" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-7 py-2">
        <TableSkeleton
          columns={["Exercise", "Categories", "Unit types", "Created"]}
        />
      </div>
    </div>
  );
}
