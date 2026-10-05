import { ChevronIcon } from "@/src/components/icons";
import { Avatar, Money, Tag } from "@/src/components/ui/primitives";
import { formatMoney, fullName, initials } from "@/src/lib/format";
import { cycleLabel, householdTotals, isLive } from "@/src/lib/household";
import { statusTag } from "@/src/lib/purchases";
import type { MyChild, MyPackagePurchase } from "@hooper/db";
import Link from "next/link";

const TONES = ["orange", "navy", "slate", "blue"] as const;

/** Design ChildrenB roster: one row per child with their live packages, and
 * household totals per billing cycle in the footer. */
export function RosterCard({
  childList,
  purchasesByChild,
}: {
  childList: MyChild[];
  purchasesByChild: Map<string, MyPackagePurchase[]>;
}) {
  const all = [...purchasesByChild.values()].flat();
  const totals = householdTotals(all);
  const withPackages = childList.filter((c) =>
    (purchasesByChild.get(c.profile_id) ?? []).some((p) => isLive(p)),
  ).length;

  return (
    <div className="border-bp-border bg-bp-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-bp-border flex items-center justify-between border-b px-5 py-[15px]">
        <span className="text-bp-text1 text-sm font-bold">Roster</span>
        <span className="text-bp-text3 text-[12.5px]">
          {childList.length} {childList.length === 1 ? "child" : "children"} ·{" "}
          {withPackages} with packages
        </span>
      </div>
      <ul>
        {childList.map((c, i) => (
          <RosterRow
            key={c.profile_id}
            child={c}
            tone={TONES[i % TONES.length]}
            purchases={(purchasesByChild.get(c.profile_id) ?? []).filter((p) =>
              isLive(p),
            )}
          />
        ))}
      </ul>
      <div className="bg-bp-bg flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-5 md:py-4">
        <div>
          <div className="text-bp-text1 text-[13px] font-bold">
            Household total
          </div>
          <div className="text-bp-text3 text-xs">
            Each package is charged separately (incl. GST)
          </div>
        </div>
        {totals.length === 0 ? (
          <span className="text-bp-text3 text-[13px]">No active packages</span>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {totals.map((t) => (
              <span key={t.cycle} className="flex items-baseline gap-1.5">
                <Money className="text-bp-text1 text-[26px]">
                  {formatMoney(t.cents)}
                </Money>
                <span className="text-bp-text2 text-xs">
                  {cycleLabel(t.cycle)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RosterRow({
  child,
  tone,
  purchases,
}: {
  child: MyChild;
  tone: (typeof TONES)[number];
  purchases: MyPackagePurchase[];
}) {
  const needsFix = purchases.some((p) => p.status === "past_due");
  return (
    <li className="border-bp-border border-b">
      <Link
        href={`/children/${child.profile_id}`}
        className="hover:bg-bp-bg/60 flex items-center gap-[13px] px-4 py-3.5 md:px-5">
        <Avatar
          initials={initials(child.first_name, child.last_name)}
          size={38}
          tone={tone}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-bp-text1 truncate text-sm font-bold">
              {child.first_name ||
                fullName(child.first_name, child.last_name) ||
                child.username}
            </span>
            {needsFix && <Tag tone="danger">Fix card</Tag>}
          </div>
          <div className="text-bp-text2 mt-px truncate text-[12.5px]">
            {`@${child.username}`}
          </div>
          <PackageChips purchases={purchases} />
        </div>
        <ChevronIcon size={16} className="text-bp-text3 shrink-0" />
      </Link>
    </li>
  );
}

function PackageChips({ purchases }: { purchases: MyPackagePurchase[] }) {
  if (purchases.length === 0) {
    return <div className="text-bp-text3 mt-1.5 text-xs">No package yet</div>;
  }
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {purchases.map((p) => {
        const status = statusTag(p);
        const cycle =
          p.kind === "subscription" && p.billing_interval
            ? p.billing_interval
            : "one_off";
        return (
          <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-bp-text1 font-semibold">
              {p.package_name}
            </span>
            <span className="text-bp-text2 tabular-nums">
              {formatMoney(p.amount_cents)} {cycleLabel(cycle)}
            </span>
            {status.tone !== "green" && (
              <Tag tone={status.tone}>{status.label}</Tag>
            )}
          </div>
        );
      })}
    </div>
  );
}
