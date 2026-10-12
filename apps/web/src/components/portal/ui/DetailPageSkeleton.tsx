import { cn } from "@/src/lib/cn";
import { ArrowLeftIcon } from "./icons";

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="border-portal-border bg-portal-card rounded-xl border">
      <div className="border-portal-border border-b px-5 py-4">
        <div className="bg-portal-border/60 h-4 w-28 animate-pulse rounded" />
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-portal-border/60 h-9 w-9 flex-shrink-0 animate-pulse rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <div className="bg-portal-border/50 h-3 w-40 animate-pulse rounded" />
              <div className="bg-portal-border/40 h-2.5 w-24 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading shell for the card-based detail pages (package, athlete, team,
 * form): the PageHeader's back rail + title band, then `columns` of card
 * placeholders. Each inner array is one column, top to bottom, giving the
 * row count of each card.
 */
export function DetailPageSkeleton({
  gridClassName,
  columns,
  action = true,
}: {
  /** Tailwind grid-cols classes matching the real page's grid. */
  gridClassName: string;
  columns: number[][];
  /** Placeholder for the header's action button. */
  action?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b">
        <div className="border-portal-border flex min-h-[38px] items-center justify-between gap-4 border-b px-7 py-2.5">
          <span className="text-portal-text3 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            <ArrowLeftIcon size={13} />
            Back
          </span>
          <div className="bg-portal-border/50 h-3 w-28 animate-pulse rounded" />
        </div>
        <div className="flex items-center justify-between px-7 py-4">
          <div className="flex flex-col gap-2">
            <div className="bg-portal-border/60 h-5 w-44 animate-pulse rounded" />
            <div className="bg-portal-border/40 h-3 w-72 animate-pulse rounded" />
          </div>
          {action && (
            <div className="bg-portal-border/40 h-9 w-28 animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        <div className={cn("grid items-start gap-5", gridClassName)}>
          {columns.map((cards, i) => (
            <div key={i} className="flex flex-col gap-5">
              {cards.map((rows, j) => (
                <CardSkeleton key={j} rows={rows} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
