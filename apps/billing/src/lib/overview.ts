import type { MyPackagePurchase } from "@hooper/db";
import { isLive, nextCharges } from "./household";

/** Failed renewals the signed-in user pays for — the overview's "Needs
 * attention" list and the nav badge. A child signed in sees none: their
 * parent is the one who can pay. */
export function outstanding(
  purchases: MyPackagePurchase[],
  myProfileId: string,
): MyPackagePurchase[] {
  return purchases.filter(
    (p) => p.status === "past_due" && p.payer_profile_id === myProfileId,
  );
}

/** "You" for the signed-in user's own purchase, else the athlete's first
 * name (or username). */
export function whoFor(p: MyPackagePurchase, myProfileId: string): string {
  if (p.athlete_profile_id === myProfileId) return "You";
  return p.athlete_first_name || p.athlete_username || "Your child";
}

/** "You", "You and Liam", "You, Liam and Maya". */
export function joinNames(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length < 2) return unique[0] ?? "";
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}

export type ChargeDay = {
  /** ISO timestamp of the first renewal that day. */
  date: string;
  cents: number;
  /** Who's being charged for, e.g. ["You", "Liam"]. */
  who: string[];
};

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    timeZone: "Pacific/Auckland",
  });
}

/** Upcoming renewals grouped by day, soonest first — "Next charge" is the
 * first entry and "After that" the rest. */
export function chargeDays(
  purchases: MyPackagePurchase[],
  myProfileId: string,
  now = new Date(),
): ChargeDay[] {
  const days = new Map<string, ChargeDay>();
  for (const p of nextCharges(purchases, now)) {
    const key = dayKey(p.current_period_end!);
    const day = days.get(key) ?? {
      date: p.current_period_end!,
      cents: 0,
      who: [],
    };
    day.cents += p.amount_cents;
    day.who.push(whoFor(p, myProfileId));
    days.set(key, day);
  }
  return [...days.values()];
}

/** "You 1, Liam 2" — live memberships per person, signed-in user first. */
export function membershipCounts(
  purchases: MyPackagePurchase[],
  myProfileId: string,
  now = new Date(),
): { total: number; byPerson: string } {
  const counts = new Map<string, number>();
  for (const p of purchases) {
    if (!isLive(p, now)) continue;
    const who = whoFor(p, myProfileId);
    counts.set(who, (counts.get(who) ?? 0) + 1);
  }
  const entries = [...counts.entries()].sort(([a], [b]) =>
    a === "You" ? -1 : b === "You" ? 1 : a.localeCompare(b),
  );
  return {
    total: entries.reduce((sum, [, n]) => sum + n, 0),
    byPerson: entries.map(([who, n]) => `${who} ${n}`).join(", "),
  };
}
