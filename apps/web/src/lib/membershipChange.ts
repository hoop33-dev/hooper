import { PORTAL_TIME_ZONE } from "./format";
import { money } from "./packages";

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
  /** It hasn't started or been charged, so ending it removes it outright. */
  unstarted?: boolean;
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
  sub: string;
};

function cancelEvent(cancel: CancelSide, today: Day): TimelineEvent {
  const now = cancel.when === "now";
  return {
    day: now ? today : renewalDay(cancel, today),
    tone: "red",
    title: `${cancel.name} ends`,
    sub: cancel.unstarted
      ? "Removed before it starts, nothing charged"
      : now
        ? "Access ends now, no refund"
        : "Access until then, no further charges",
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
