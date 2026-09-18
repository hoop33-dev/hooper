import { ArrowLeftIcon } from "@/src/components/portal/ui/icons";

/** Mirrors `TeamDetailShell` so the swap to real content doesn't shift layout.
 * Without this file the teams list's `loading.tsx` would show. */
export default function TeamDetailLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-col border-b">
        <div className="border-portal-border flex items-center justify-between gap-4 border-b px-7 py-2.5">
          <span className="text-portal-text3 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            <ArrowLeftIcon size={13} />
            Back
          </span>
          <div className="bg-portal-border/50 h-3 w-28 animate-pulse rounded" />
        </div>
        <div className="flex items-center justify-between px-7 py-4">
          <div className="flex flex-col gap-2">
            <div className="bg-portal-border/60 h-5 w-44 animate-pulse rounded" />
            <div className="bg-portal-border/40 h-3 w-56 animate-pulse rounded" />
          </div>
          <div className="bg-portal-border/40 h-9 w-24 animate-pulse rounded-lg" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="border-portal-border bg-portal-card rounded-xl border">
          <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
            <div className="bg-portal-border/60 h-4 w-40 animate-pulse rounded" />
            <div className="bg-portal-border/40 h-7 w-32 animate-pulse rounded-lg" />
          </div>
          <div className="px-5 py-4">
            <div className="bg-portal-border/40 h-3 w-48 animate-pulse rounded" />
          </div>
        </div>

        <div className="border-portal-border bg-portal-card mt-6 rounded-xl border">
          <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
            <div className="bg-portal-border/60 h-4 w-32 animate-pulse rounded" />
            <div className="bg-portal-border/40 h-7 w-28 animate-pulse rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 px-5 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-portal-border/60 h-9 w-9 flex-shrink-0 animate-pulse rounded-full" />
                <div className="bg-portal-border/50 h-3 w-36 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
