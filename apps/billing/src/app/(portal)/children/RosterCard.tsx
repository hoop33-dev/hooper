import { ChevronIcon } from "@/src/components/icons";
import { Avatar, Money, Tag } from "@/src/components/ui/primitives";
import { formatMoney, fullName, initials } from "@/src/lib/format";
import {
  cycleLabel,
  householdTotals,
  isLive,
  type CycleTotal,
} from "@/src/lib/household";
import { statusTag } from "@/src/lib/purchases";
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
  const withPackages =
    (self ? 1 : 0) +
    childList.filter((c) =>
      (purchasesByChild.get(c.profile_id) ?? []).some((p) => isLive(p)),
    ).length;

  return (
    <div className="border-bp-border bg-bp-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-bp-border flex items-center justify-between border-b px-5 py-[15px]">
        <span className="text-bp-text1 text-sm font-bold">Roster</span>
        <span className="text-bp-text3 text-[12.5px]">
          {self && "You + "}
          {childList.length} {childList.length === 1 ? "child" : "children"}
          {!purchasesError && ` with ${withPackages} packages`}
        </span>
      </div>
      <ul>
        {self && (
          <RosterRow
            href="/account"
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
          Each package is charged separately (incl. GST)
        </div>
      </div>
      {error ? (
        <span className="text-danger text-[13px]">
          Couldn&apos;t load packages: {error}
        </span>
      ) : totals.length === 0 ? (
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
  return (
    <li className="border-bp-border border-b">
      <AppLink
        href={href}
        className="hover:bg-bp-bg/60 flex items-center gap-[13px] px-4 py-3.5 md:px-5">
        <Avatar initials={avatarInitials} size={38} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-bp-text1 truncate text-sm font-bold">
              {name}
            </span>
            {isSelf && <Tag tone="neutral">You</Tag>}
            {needsFix && <Tag tone="danger">Fix card</Tag>}
          </div>
          {username && (
            <div className="text-bp-text2 mt-px truncate text-[12.5px]">
              {`@${username}`}
            </div>
          )}
          {unavailable ? (
            <div className="text-bp-text3 mt-1.5 text-xs">
              Packages unavailable
            </div>
          ) : (
            <PackageChips purchases={purchases} />
          )}
        </div>
        <ChevronIcon size={16} className="text-bp-text3 shrink-0" />
      </AppLink>
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
