import { BackStrip, PageBody, TopBar } from "@/src/components/shell/Shell";
import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

/** Placeholders for the route `loading.tsx` files. Headers reuse the real
 * `TopBar` wherever the title is static so nothing shifts on swap. */

export function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn("bg-bp-border/60 animate-pulse rounded", className)} />
  );
}

/** `Card`-shaped placeholder: a label bar then `rows` of text bars. Set
 * `avatars` for list cards whose rows lead with an avatar (the roster). */
export function CardSkeleton({
  rows,
  avatars,
}: {
  rows: number;
  avatars?: boolean;
}) {
  return (
    <div className="border-bp-border bg-bp-card rounded-xl border p-4 md:p-5">
      <Pulse className="mb-4 h-2.5 w-24" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            {avatars && <Pulse className="size-[38px] shrink-0 rounded-full" />}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Pulse className={cn("h-3", i % 2 ? "w-32" : "w-44")} />
              <Pulse className="bg-bp-border/40 h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Real `TopBar` + `PageBody` around a placeholder body. */
export function PageSkeleton({
  title,
  sub,
  right,
  back,
  children,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <>
      <TopBar title={title} sub={sub} right={right} back={back} />
      <PageBody>{children}</PageBody>
    </>
  );
}

/** For detail pages whose title isn't known until the data loads: the real
 * back strip, then pulse bars in `TopBar`'s box. */
export function DetailHeaderSkeleton({
  back,
}: {
  back: { href: string; label: string };
}) {
  return (
    <>
      <BackStrip back={back} />
      <div className="border-bp-border bg-bp-card flex shrink-0 flex-col gap-2 border-b px-[18px] py-3.5 md:px-7 md:pt-5 md:pb-[18px]">
        <Pulse className="h-[22px] w-44 md:h-[26px]" />
        <Pulse className="bg-bp-border/40 hidden h-3 w-28 md:block" />
      </div>
    </>
  );
}
