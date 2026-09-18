import { cn } from "@/src/lib/cn";

const bar = "bg-portal-border/60 animate-pulse rounded";

/** The back/breadcrumb rail + title band, for the `loading.tsx` variants that
 * render before the real `<PageHeader />` exists. */
function CanvasHeaderSkeleton() {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b">
      <div className="border-portal-border flex min-h-[38px] items-center justify-between border-b px-7 py-2.5">
        <div className={cn(bar, "h-3 w-14")} />
        <div className={cn(bar, "bg-portal-border/40 h-3 w-40")} />
      </div>
      <div className="flex items-center justify-between px-7 py-4">
        <div className={cn(bar, "h-6 w-56")} />
        <div className="flex gap-2">
          <div className={cn(bar, "bg-portal-border/40 h-8 w-24")} />
          <div className={cn(bar, "bg-portal-border/40 h-8 w-28")} />
        </div>
      </div>
    </div>
  );
}

/** One block card placeholder — `rounded-xl border` with a header strip and a
 * few exercise rows, matching `BlockCard`. `wide` adds the row thumbnails and
 * the "+ Add" affordance the full session-editor card shows. */
function BlockCardSkeleton({
  rows = 2,
  wide = false,
}: {
  rows?: number;
  wide?: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-card overflow-hidden rounded-xl border">
      <div className="border-portal-border bg-portal-bg flex items-center gap-2 border-b px-3 py-2">
        <div className={cn(bar, "bg-portal-border/50 h-3 w-3")} />
        <div className={cn(bar, "h-3 w-24")} />
        {wide && (
          <div className={cn(bar, "bg-portal-border/40 ml-auto h-5 w-12")} />
        )}
      </div>
      <div className={cn("flex flex-col", wide ? "" : "gap-1.5 p-2.5")}>
        {Array.from({ length: rows }).map((_, i) =>
          wide ? (
            <div
              key={i}
              className="border-portal-border flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
              <div
                className={cn(bar, "bg-portal-border/50 h-9 w-9 flex-shrink-0")}
              />
              <div className={cn(bar, "h-3 w-40")} />
              <div
                className={cn(bar, "bg-portal-border/40 ml-auto h-3 w-10")}
              />
              <div className={cn(bar, "bg-portal-border/40 h-3 w-10")} />
            </div>
          ) : (
            <div
              key={i}
              className={cn(bar, "bg-portal-border/40 h-3 w-full")}
            />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * Program-canvas placeholder (`/programs/[id]`): the week-tab strip, a
 * horizontal row of narrow session columns each holding a few block cards, and
 * the collapsed library shelf. Mirrors `ProgramCanvasShell`.
 */
export function ProgramCanvasSkeleton({
  withHeader = false,
}: {
  withHeader?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {withHeader && <CanvasHeaderSkeleton />}

      {/* WeekTabStrip */}
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-5 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(bar, "h-7 w-12")} />
        ))}
        <div className={cn(bar, "bg-portal-border/40 h-7 w-10")} />
        <div className={cn(bar, "bg-portal-border/40 ml-auto h-3 w-28")} />
      </div>

      {/* SessionCanvasRow — horizontal row of w-[220px] session columns */}
      <div className="flex flex-1 items-start gap-4 overflow-hidden p-4">
        {[3, 2, 1].map((blocks, col) => (
          <div
            key={col}
            className="flex w-[220px] flex-shrink-0 flex-col gap-2">
            <div className="border-portal-border bg-portal-card flex flex-col gap-1.5 rounded-lg border p-2.5">
              <div className={cn(bar, "bg-portal-border/40 h-2.5 w-16")} />
              <div className={cn(bar, "h-3.5 w-28")} />
              <div className={cn(bar, "bg-portal-border/40 h-2.5 w-14")} />
            </div>
            {Array.from({ length: blocks }).map((_, b) => (
              <BlockCardSkeleton key={b} rows={b === 0 ? 3 : 1} />
            ))}
          </div>
        ))}
      </div>

      {/* ProgramLibraryShelf collapsed bar */}
      <div className="border-portal-border bg-portal-card flex h-9 flex-shrink-0 items-center gap-3 border-t px-5">
        <div className={cn(bar, "bg-portal-border/40 h-4 w-40")} />
        <div className={cn(bar, "bg-portal-border/40 ml-auto h-3 w-16")} />
      </div>
    </div>
  );
}

/**
 * Session-editor placeholder (`/programs/[id]/sessions/[sessionId]`): the left
 * library sidebar and a single vertical column of full-width block cards.
 * Mirrors `SessionViewShell`.
 */
export function SessionEditorSkeleton({
  withHeader = false,
}: {
  withHeader?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {withHeader && <CanvasHeaderSkeleton />}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* SessionLibrarySidebar — tabs, search, category select, exercise rows */}
        <div className="border-portal-border bg-portal-card flex w-[280px] flex-shrink-0 flex-col gap-3 border-r p-4">
          <div className={cn(bar, "bg-portal-border/40 h-7 w-full")} />
          <div className={cn(bar, "bg-portal-border/40 h-9 w-full")} />
          <div className={cn(bar, "bg-portal-border/40 h-9 w-full")} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 pt-1">
              <div
                className={cn(
                  bar,
                  "bg-portal-border/50 h-10 w-10 flex-shrink-0",
                )}
              />
              <div className="flex flex-col gap-1.5">
                <div className={cn(bar, "bg-portal-border/50 h-3 w-32")} />
                <div className={cn(bar, "bg-portal-border/40 h-2.5 w-20")} />
              </div>
            </div>
          ))}
        </div>

        {/* BlockList — vertical stack of wide block cards */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <BlockCardSkeleton key={i} rows={4 - i} wide />
          ))}
          <div className="border-portal-border-mid rounded-xl border border-dashed p-3">
            <div className={cn(bar, "bg-portal-border/40 mx-auto h-4 w-28")} />
          </div>
        </div>
      </div>
    </div>
  );
}
