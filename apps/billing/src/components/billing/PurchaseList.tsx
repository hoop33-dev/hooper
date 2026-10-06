import { CalendarIcon } from "@/src/components/icons";
import { Tag } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format";
import { accessLine, statusTag } from "@/src/lib/purchases";
import type { MyPackagePurchase } from "@hooper/db";

/** Rows of packages with price, renewal/access line and status pill. Used on
 * the Account page and a child's Billing tab. */
export function PurchaseList({
  purchases,
}: {
  purchases: MyPackagePurchase[];
}) {
  return (
    <ul>
      {purchases.map((p, i) => {
        const status = statusTag(p);
        return (
          <li
            key={p.id}
            className={cn(
              "flex items-center gap-3 py-3",
              i < purchases.length - 1 && "border-bp-border border-b",
            )}>
            <div className="bg-orange/10 text-orange flex size-9 shrink-0 items-center justify-center rounded-[9px]">
              <CalendarIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-bp-text1 truncate text-sm font-bold">
                {p.package_name}
              </div>
              <div className="text-bp-text2 mt-0.5 text-[12.5px]">
                {formatMoney(p.amount_cents)} - {accessLine(p)}
              </div>
            </div>
            <Tag tone={status.tone}>{status.label}</Tag>
          </li>
        );
      })}
    </ul>
  );
}
