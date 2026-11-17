import { CheckIcon } from "@/src/components/icons";

/** Design `AllPaid`: nothing is owing. */
export function AllPaid({ nextDate }: { nextDate: string | null }) {
  return (
    <div className="border-bp-border bg-bp-card flex items-center gap-3.5 rounded-xl border px-4 py-3.5 md:px-5 md:py-4">
      <div className="bg-green/10 text-green flex size-9 shrink-0 items-center justify-center rounded-full">
        <CheckIcon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-bp-text1 text-sm font-bold">
          You&apos;re all paid up
        </div>
        <div className="text-bp-text2 mt-0.5 text-[12.5px]">
          {nextDate
            ? `Nothing due. Memberships renew automatically on ${nextDate}`
            : "Nothing due."}
        </div>
      </div>
    </div>
  );
}
