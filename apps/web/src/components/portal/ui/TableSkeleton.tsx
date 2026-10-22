import { cn } from "@/src/lib/cn";

interface TableSkeletonProps {
  /** Column headers — pass the same array the real table renders. */
  columns: string[];
  rows?: number;
  /** Render a trailing narrow action column (matches tables with an Edit btn). */
  actionColumn?: boolean;
}

/**
 * Placeholder that mirrors the portal list-table markup
 * (`ProgramsTable` / `AthletesTable` / …) so the swap to real content doesn't
 * shift layout. Used by the route `loading.tsx` files.
 */
export function TableSkeleton({
  columns,
  rows = 8,
  actionColumn = false,
}: TableSkeletonProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {columns.map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
              {h}
            </th>
          ))}
          {actionColumn && <th className="w-20" />}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-portal-border border-b">
            <td className="py-3.5 pr-4">
              <div className="flex items-center gap-3">
                <div className="bg-portal-border/60 h-9 w-9 flex-shrink-0 animate-pulse rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <div className="bg-portal-border/60 h-3 w-40 animate-pulse rounded" />
                  <div className="bg-portal-border/40 h-2.5 w-24 animate-pulse rounded" />
                </div>
              </div>
            </td>
            {columns.slice(1).map((h) => (
              <td key={h} className="py-3.5 pr-4">
                <div
                  className={cn(
                    "bg-portal-border/50 h-3 animate-pulse rounded",
                    r % 2 === 0 ? "w-16" : "w-24",
                  )}
                />
              </td>
            ))}
            {actionColumn && (
              <td className="py-3.5">
                <div className="bg-portal-border/50 ml-auto h-6 w-12 animate-pulse rounded-lg" />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
