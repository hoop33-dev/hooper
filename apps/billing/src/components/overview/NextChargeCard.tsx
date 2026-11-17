import { Card, Label, Money } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { formatDate, formatMoney } from "@/src/lib/format";
import { joinNames, type ChargeDay } from "@/src/lib/overview";

/** Design OverviewB "Next charge" with the "After that" schedule. */
export function NextChargeCard({ days }: { days: ChargeDay[] }) {
  const [next, ...later] = days;
  return (
    <Card>
      <Label className="mb-3">Next charge</Label>
      {!next ? (
        <div className="text-bp-text2 text-[13px]">No upcoming renewals.</div>
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-2">
            <Money className="text-bp-text1 text-[32px]">
              {formatMoney(next.cents)}
            </Money>
            <span className="text-bp-text2 text-[13px]">
              on {formatDate(next.date)}
            </span>
          </div>
          <div className="text-bp-text3 -mt-1.5 text-[12.5px]">
            {joinNames(next.who)}
          </div>
          {later.length > 0 && (
            <>
              <Label className="mt-3.5 mb-0.5">After that</Label>
              <ul>
                {later.slice(0, 3).map((d, i, arr) => (
                  <li
                    key={d.date}
                    className={cn(
                      "flex items-center gap-3 py-[11px]",
                      i < arr.length - 1 && "border-bp-border border-b",
                    )}>
                    <div className="min-w-0 flex-1">
                      <div className="text-bp-text1 text-[13.5px] font-semibold">
                        {formatDate(d.date)}
                      </div>
                      <div className="text-bp-text3 truncate text-xs">
                        {joinNames(d.who)}
                      </div>
                    </div>
                    <span className="text-bp-text1 text-[13.5px] font-bold tabular-nums">
                      {formatMoney(d.cents)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Card>
  );
}
