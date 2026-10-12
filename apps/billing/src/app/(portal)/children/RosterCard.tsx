import { PackageTile } from "@/src/components/billing/PackageTile";
import { ChevronIcon } from "@/src/components/icons";
import { Avatar, Money, Tag } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { formatDate, formatMoney, fullName, initials } from "@/src/lib/format";
import {
  cycleLabel,
  householdTotals,
  isLive,
  type CycleTotal,
} from "@/src/lib/household";
import { accessLine, statusTag } from "@/src/lib/purchases";
import type { MyProfile } from "@/src/services/profile.service";
import type { MyChild, MyPackagePurchase } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";

const TONES = ["orange", "navy", "slate", "blue"] as const;

/** Design ChildrenB roster: the signed-in user first when they have a
 * package of their own, then one row per child with their live packages, and
 * household totals per billing cycle in the footer. */
export function RosterCard({
  self,
  childList,
  purchasesByChild,
  purchasesError,
}: {
  self: { profile: MyProfile; purchases: MyPackagePurchase[] } | null;
  childList: MyChild[];
  purchasesByChild: Map<string, MyPackagePurchase[]>;
  /** Set when the purchases lookup failed; packages and totals are unknown. */
  purchasesError: string | null;
}) {
  const all = [
    ...(self?.purchases ?? []),
    ...[...purchasesByChild.values()].flat(),
  ];
  const totals = householdTotals(all);
  const livePackages = all.filter((p) => isLive(p)).length;

  return (
    <div className="border-bp-border bg-bp-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-bp-border flex items-center justify-between border-b px-5 py-[15px]">
        <span className="text-bp-text1 text-sm font-bold">Roster</span>
        <span className="text-bp-text3 text-[12.5px]">
          {self && "You + "}
          {childList.length} {childList.length === 1 ? "child" : "children"}
          {!purchasesError &&
            `, ${livePackages} ${livePackages === 1 ? "membership" : "memberships"}`}
        </span>
      </div>
      <ul>
        {self && (
          <RosterRow
            href="/memberships"
            name={
              self.profile.firstName ||
              fullName(self.profile.firstName, self.profile.lastName) ||
              self.profile.username ||
              "You"
            }
            username={self.profile.username}
            avatarInitials={initials(
              self.profile.firstName,
              self.profile.lastName,
            )}
            tone="navy"
            isSelf
            unavailable={false}
            purchases={self.purchases.filter((p) => isLive(p))}
          />
        )}
        {childList.map((c, i) => (
          <RosterRow
            key={c.profile_id}
            href={`/children/${c.profile_id}`}
            name={
              c.first_name || fullName(c.first_name, c.last_name) || c.username
            }
            username={c.username}
            avatarInitials={initials(c.first_name, c.last_name)}
            tone={TONES[i % TONES.length]}
            unavailable={purchasesError !== null}
            purchases={(purchasesByChild.get(c.profile_id) ?? []).filter((p) =>
              isLive(p),
            )}
          />
        ))}
      </ul>
      <RosterFooter totals={totals} error={purchasesError} />
    </div>
  );
}

/** Household totals per billing cycle, or the lookup error. */
function RosterFooter({
  totals,
  error,
}: {
  totals: CycleTotal[];
  error: string | null;
}) {
  return (
    <div className="bg-bp-bg flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 md:px-5 md:py-4">
      <div>
        <div className="text-bp-text1 text-[13px] font-bold">
          Household total
        </div>
        <div className="text-bp-text3 text-xs">
          Each membership is charged separately (incl. GST)
        </div>
      </div>
      {error ? (
        <span className="text-danger text-[13px]">
          Couldn&apos;t load memberships: {error}
        </span>
      ) : totals.length === 0 ? (
        <span className="text-bp-text3 text-[13px]">No active memberships</span>
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
  );
}

function RosterRow({
  href,
  name,
  username,
  avatarInitials,
  tone,
  isSelf = false,
  unavailable,
  purchases,
}: {
  href: string;
  name: string;
  username: string | null;
  avatarInitials: string;
  tone: (typeof TONES)[number];
  isSelf?: boolean;
  /** The purchases lookup failed, so `purchases` is empty but not "none". */
  unavailable: boolean;
  purchases: MyPackagePurchase[];
}) {
  const needsFix = purchases.some((p) => p.status === "past_due");
  const count = purchases.length;
  const meta = [
    username && `@${username}`,
    unavailable
      ? "Memberships unavailable"
      : `${count} membership${count === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <li className="border-bp-border border-b">
      {/* The whole row — header and package list — is one link. */}
      <AppLink href={href} className="hover:bg-bp-bg/60 block">
        <div className="flex items-center gap-[13px] px-4 pt-3.5 pb-1.5 md:px-5">
          <Avatar initials={avatarInitials} size={38} tone={tone} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-bp-text1 truncate text-sm font-bold">
                {name}
              </span>
              {isSelf && <Tag tone="neutral">You</Tag>}
              {needsFix && <Tag tone="danger">Fix card</Tag>}
            </div>
            <div className="text-bp-text2 mt-px truncate text-[12.5px]">
              {meta}
            </div>
          </div>
          {!unavailable && <RowTotals totals={householdTotals(purchases)} />}
          <ChevronIcon size={16} className="text-bp-text3 shrink-0" />
        </div>
        {count > 0 ? (
          <ul className="px-4 pb-2 pl-[67px] md:px-5 md:pl-[71px]">
            {purchases.map((p, i) => (
              <PackageLine key={p.id} purchase={p} last={i === count - 1} />
            ))}
          </ul>
        ) : (
          !unavailable && (
            <div className="text-bp-text3 px-4 pb-3.5 pl-[67px] text-xs md:px-5 md:pl-[71px]">
              No memberships yet
            </div>
          )
        )}
      </AppLink>
    </li>
  );
}

/** What this person's memberships charge, per billing cycle (design
 * `chargeOf`, which assumed everything was monthly). Cancelled ones that
 * are running out their period don't count. */
function RowTotals({ totals }: { totals: CycleTotal[] }) {
  if (totals.length === 0) return null;
  return (
    <span className="flex flex-col items-end text-sm font-bold tabular-nums">
      {totals.map((t) => (
        <span key={t.cycle} className="text-bp-text1 whitespace-nowrap">
          {formatMoney(t.cents)}
          <span className="text-bp-text3 text-[11px] font-medium">
            {" "}
            {cycleLabel(t.cycle)}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Design `PkgLine`: tile, name, renewal line, status, price. */
function PackageLine({
  purchase: p,
  last,
}: {
  purchase: MyPackagePurchase;
  last: boolean;
}) {
  const status = statusTag(p);
  const line =
    p.kind === "one_time" && !p.access_until && p.paid_at
      ? `One-off, paid ${formatDate(p.paid_at)}`
      : accessLine(p);
  const per =
    p.kind === "subscription" && p.billing_interval
      ? p.billing_interval === "month"
        ? " /mo"
        : ` ${cycleLabel(p.billing_interval)}`
      : "";
  return (
    <li
      className={cn(
        "flex items-center gap-3 py-2.5",
        !last && "border-bp-border border-b",
      )}>
      <PackageTile name={p.package_name} size={30} />
      <div className="min-w-0 flex-1">
        <div className="text-bp-text1 truncate text-[13px] font-semibold">
          {p.package_name}
        </div>
        <div className="text-bp-text3 text-[11.5px]">{line}</div>
      </div>
      {status && (
        <span className="hidden md:inline">
          <Tag tone={status.tone}>{status.label}</Tag>
        </span>
      )}
      <span className="text-bp-text1 min-w-[58px] text-right text-[13.5px] font-bold tabular-nums">
        {formatMoney(p.amount_cents)}
        <span className="text-bp-text3 text-[11px] font-medium">{per}</span>
      </span>
    </li>
  );
}
