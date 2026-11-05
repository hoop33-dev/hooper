import type {
  AthleteMembership,
  MembershipChange,
} from "@/src/services/athleteBilling.service";
import { PORTAL_TIME_ZONE } from "./format";
import { money, type PackagePricing } from "./packages";

/** A calendar day in NZ time, "YYYY-MM-DD" — the value of a date input and
 * what the coach-athlete edge function takes for start and billing dates. */
export type Day = string;

export type CancelWhen = "period_end" | "now";

/** The calendar day `at` falls on in NZ time. */
export function zonedDay(at: string | Date): Day {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PORTAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

function dayToUtc(day: Day): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: Day, b: Day): number {
  return Math.round((dayToUtc(b) - dayToUtc(a)) / 86_400_000);
}

/** "Today", "Nov 12", or "Jan 4, 2027" outside the current year. */
export function formatDay(day: Day, today: Day): string {
  if (day === today) return "Today";
  return new Date(dayToUtc(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** A coach-started package that hasn't reached its start date. */
export function isUpcoming(
  startsAt: string | null,
  now: Date = new Date(),
): boolean {
  return !!startsAt && new Date(startsAt) > now;
}

/** "Starts Nov 12" (or "Starts Jan 4, 2027" in a later year) for a package
 * that hasn't reached its start date. */
export function startsLabel(startsAt: string, now: Date = new Date()): string {
  return `Starts ${formatDay(zonedDay(startsAt), zonedDay(now))}`;
}

/** The membership being cancelled, as the change modal sees it. */
export type CancelSide = {
  name: string;
  when: CancelWhen;
  /** When its paid period runs out (and the next charge would have been). */
  periodEnd: string | null;
};

/** The package being added. */
export type AddSide = {
  name: string;
  recurring: boolean;
  priceCents: number;
  interval: string | null;
  accessWeeks: number | null;
};

/** The old package's renewal day, never earlier than today. */
export function renewalDay(cancel: CancelSide, today: Day): Day {
  if (!cancel.periodEnd) return today;
  const day = zonedDay(cancel.periodEnd);
  return day < today ? today : day;
}

/** Start: when the old package ends if it's running to the end of its
 * period, otherwise today. Billing: the old package's renewal day when
 * switching, so the athlete keeps the billing date they had (and an
 * immediate cancel's unused days carry over); otherwise the start. */
export function defaultDates(
  cancel: CancelSide | null,
  today: Day,
  start?: Day,
): { start: Day; billing: Day } {
  const s =
    start ??
    (cancel?.when === "period_end" ? renewalDay(cancel, today) : today);
  return { start: s, billing: cancel ? renewalDay(cancel, today) : s };
}

export type TimelineEvent = {
  day: Day;
  tone: "red" | "green" | "orange";
  title: string;
  sub?: string;
};

function cancelEvent(cancel: CancelSide, today: Day): TimelineEvent {
  const now = cancel.when === "now";
  return {
    day: now ? today : renewalDay(cancel, today),
    tone: "red",
    title: `${cancel.name} ends`,
  };
}

function chargeSub(add: AddSide, cardLabel: string | null): string {
  const to = cardLabel ? ` to ${cardLabel}` : "";
  if (add.recurring) return `Then every ${add.interval}${to}`;
  if (!add.accessWeeks) return `One payment${to}, unlimited access`;
  const weeks = `${add.accessWeeks} ${add.accessWeeks === 1 ? "week" : "weeks"}`;
  return `One payment${to}, ${weeks} of access`;
}

const TONE_ORDER = { red: 0, green: 1, orange: 2 } as const;

/** The "What happens" column: what ends, starts and is charged, in date
 * order. On the same day an ending comes before a start. */
export function buildTimeline({
  cancel,
  add,
  start,
  billing,
  today,
  cardLabel,
}: {
  cancel: CancelSide | null;
  add: AddSide | null;
  start: Day;
  billing: Day;
  today: Day;
  cardLabel: string | null;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (cancel) events.push(cancelEvent(cancel, today));
  if (add) {
    const price = money(add.priceCents);
    events.push(
      {
        day: start,
        tone: "green",
        title: `${add.name} starts`,
        sub: "Programs and teams unlock",
      },
      {
        day: billing,
        tone: "orange",
        title: add.recurring ? `First charge ${price}` : `Charge ${price}`,
        sub: chargeSub(add, cardLabel),
      },
    );
  }
  return events.sort((a, b) =>
    a.day === b.day
      ? TONE_ORDER[a.tone] - TONE_ORDER[b.tone]
      : a.day.localeCompare(b.day),
  );
}

export function changeCtaLabel(
  cancelling: boolean,
  adding: boolean,
  when: CancelWhen,
): string {
  if (cancelling && adding) return "Switch package";
  if (adding) return "Add package";
  return when === "now" ? "Cancel now" : "Cancel at period end";
}

export function changeSuccessMessage(
  cancelling: boolean,
  adding: boolean,
  when: CancelWhen,
): string {
  if (cancelling && adding) return "Package switched";
  if (adding) return "Package added";
  return when === "now" ? "Package cancelled" : "Cancels at period end";
}

/** Marks a row `applyMembershipChange` made up for a package being added:
 * it has no real id yet, so it gets no actions until the refresh. */
export const PENDING_PREFIX = "pending:";

/** A day's instant for display: the old package's period end when the day
 * is its renewal day (the edge function lines a switch up to it), else
 * midday UTC, which is the same NZ day. */
function dayInstant(day: Day, anchor: string | null): string {
  if (anchor && zonedDay(anchor) === day) return anchor;
  return new Date(dayToUtc(day) + 12 * 3_600_000).toISOString();
}

/** The membership a change cancels, as it will read once cancelled. A
 * failed charge, a package that hasn't started and a one-off all end now,
 * as coach-athlete does. */
function cancelledRow(
  m: AthleteMembership,
  when: CancelWhen,
  switchedToName: string | null,
  now: Date,
): AthleteMembership {
  const endsNow =
    when === "now" ||
    m.status === "past_due" ||
    m.kind === "one_time" ||
    isUpcoming(m.startsAt, now);
  return endsNow
    ? { ...m, status: "canceled", cancelAtPeriodEnd: false, switchedToName }
    : { ...m, cancelAtPeriodEnd: true, switchedToName };
}

/** A stand-in row for the package a change adds, until the refresh brings
 * the real one. `old` is the membership it replaces, if any. */
function pendingRow(
  add: NonNullable<MembershipChange["add"]>,
  pkg: PackagePricing & { name: string },
  old: AthleteMembership | undefined,
  now: Date,
): AthleteMembership {
  const today = zonedDay(now);
  const anchor = old?.currentPeriodEnd ?? null;
  const recurring = pkg.billing_type === "recurring";
  const billingAt = dayInstant(add.billingDate, anchor);
  return {
    id: `${PENDING_PREFIX}${add.packageId}`,
    packageId: add.packageId,
    packageName: pkg.name,
    kind: recurring ? "subscription" : "one_time",
    status: "active",
    amountCents: pkg.price_cents,
    currency: old?.currency ?? "nzd",
    interval: recurring ? pkg.billing_interval : null,
    currentPeriodEnd: recurring ? billingAt : null,
    cancelAtPeriodEnd: false,
    paidAt: null,
    accessUntil: null,
    createdAt: now.toISOString(),
    payerProfileId: add.payerProfileId,
    startsAt: add.startDate > today ? dayInstant(add.startDate, anchor) : null,
    billingStartsAt: add.billingDate > today ? billingAt : null,
    switchedToName: null,
  };
}

/** The memberships list as it will read once `change` has gone through,
 * shown while the server catches up. A switch links the old package to
 * the new one, which is listed first (newest first, as the server does). */
export function applyMembershipChange(
  memberships: AthleteMembership[],
  change: MembershipChange,
  added: (PackagePricing & { name: string }) | undefined,
  now: Date = new Date(),
): AthleteMembership[] {
  const { cancel, add } = change;
  const old = cancel
    ? memberships.find((m) => m.id === cancel.purchaseId)
    : undefined;
  const switchedToName = add && added ? added.name : null;
  const rows = memberships.map((m) =>
    m === old && cancel ? cancelledRow(m, cancel.when, switchedToName, now) : m,
  );
  return add && added ? [pendingRow(add, added, old, now), ...rows] : rows;
}
