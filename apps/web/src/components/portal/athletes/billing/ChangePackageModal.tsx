"use client";

import { cn } from "@/src/lib/cn";
import {
  buildTimeline,
  changeCtaLabel,
  daysBetween,
  defaultDates,
  formatDay,
  isUpcoming,
  renewalDay,
  zonedDay,
  type AddSide,
  type CancelSide,
  type CancelWhen,
  type Day,
} from "@/src/lib/membershipChange";
import { money } from "@/src/lib/packages";
import type {
  AthleteMembership,
  AthletePayer,
  MembershipChange,
} from "@/src/services/athleteBilling.service";
import { useState, type ReactNode } from "react";
import { CheckIcon } from "../../ui/icons";
import { Modal, ModalFooter } from "../../ui/Modal";
import { PortalButton } from "../../ui/PortalButton";
import { PortalInput } from "../../ui/PortalInput";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { ToggleSwitch } from "../../ui/ToggleSwitch";
import { PackageTile } from "../AthleteTrainingTab";
import { cardLabel } from "./cards";
import { PackageSearchSelect, type PackageOption } from "./PackageSearchSelect";

type ActionResult = { ok: boolean; error?: string };

/** Which membership (if any) to start on cancelling, and whether the add
 * side starts switched on. */
export type ChangeInit = { cancelId: string | null; add: boolean };

const labelClass =
  "text-portal-text3 text-[11px] font-semibold tracking-widest uppercase";
const selectClass =
  "border-portal-border bg-portal-card text-portal-text1 focus:border-portal-orange focus:ring-portal-orange h-10 w-full rounded-lg border px-3 text-sm focus:ring-1 focus:outline-none";

/** Memberships the modal can cancel: running subscriptions not already
 * set to cancel, and coach-started one-offs that haven't been charged. */
export function cancellableMemberships(
  memberships: AthleteMembership[],
): AthleteMembership[] {
  return memberships.filter((m) => {
    if (m.status !== "active" && m.status !== "past_due") return false;
    if (m.kind === "one_time") return !m.paidAt && !!m.billingStartsAt;
    return !m.cancelAtPeriodEnd;
  });
}

/** A failed charge has no paid period left, and a package that hasn't
 * started (or a one-off not yet charged) has nothing to finish, so these
 * can only end now. */
function endsNowOnly(m: AthleteMembership): boolean {
  return (
    m.status === "past_due" || m.kind === "one_time" || isUpcoming(m.startsAt)
  );
}

function Section({
  n,
  on,
  onToggle,
  title,
  sub,
  disabled,
  children,
}: {
  n: number;
  on: boolean;
  onToggle: (on: boolean) => void;
  title: string;
  sub: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-portal-card flex-shrink-0 rounded-xl border transition-colors",
        on ? "border-portal-text3/40" : "border-portal-border",
      )}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-[11px] px-4 py-3.5",
          !on && "bg-portal-bg",
        )}>
        <span
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
            on
              ? "bg-portal-text1 text-white"
              : "bg-portal-border text-portal-text3",
          )}>
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-portal-text1 text-sm font-bold">{title}</div>
          <div className="text-portal-text3 mt-0.5 text-xs">{sub}</div>
        </div>
        {!disabled && (
          <ToggleSwitch
            label={title}
            hideLabel
            checked={on}
            onChange={onToggle}
          />
        )}
      </div>
      {on && (
        <div className="flex flex-col gap-3.5 px-4 pt-1 pb-4">{children}</div>
      )}
    </div>
  );
}

function LinkButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-portal-orange text-[11px] font-semibold">
      {children}
    </button>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
  hint,
}: {
  label: string;
  value: Day;
  min: Day;
  onChange: (day: Day) => void;
  hint: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <PortalInput
        type="date"
        label={label}
        value={value}
        min={min}
        // Clearing the native input gives "" — keep the last real date.
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-10"
      />
      <div className="text-portal-text3 mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-snug">
        {hint}
      </div>
    </div>
  );
}

type ChangeDraft = ReturnType<typeof useChangeDraft>;

/** The cancel side's choices. A membership that can only end now (see
 * `endsNowOnly`) ignores the end-of-period choice. */
function useCancelDraft(cancellable: AthleteMembership[], init: ChangeInit) {
  const [on, setOn] = useState(!!init.cancelId && cancellable.length > 0);
  const [cancelId, setCancelId] = useState(
    init.cancelId ?? cancellable[0]?.id ?? null,
  );
  const [chosenWhen, setChosenWhen] = useState<CancelWhen>("period_end");
  const old = cancellable.find((m) => m.id === cancelId) ?? null;
  const forcedNow = !!old && endsNowOnly(old);
  const when: CancelWhen = forcedNow ? "now" : chosenWhen;
  const side: CancelSide | null =
    on && old
      ? {
          name: old.packageName,
          when,
          periodEnd: old.currentPeriodEnd,
        }
      : null;
  return {
    on,
    setOn,
    old,
    setCancelId,
    chosenWhen,
    setChosenWhen,
    forcedNow,
    when,
    side,
  };
}

/** The add side's choices. The payer defaults to whoever paid for the
 * package being cancelled, when they have a card. */
function useAddDraft(
  billable: AthletePayer[],
  packages: PackageOption[],
  init: ChangeInit,
  payerHint: string | undefined,
) {
  const [on, setOn] = useState(init.add);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [payerId, setPayerId] = useState<string | null>(() => {
    const hinted = billable.find((p) => p.profileId === payerHint);
    return (hinted ?? billable[0])?.profileId ?? null;
  });
  const pkg = packages.find((p) => p.id === packageId) ?? null;
  const payer = billable.find((p) => p.profileId === payerId) ?? null;
  return {
    on,
    setOn,
    pkg,
    setPackageId,
    payer,
    payerId,
    setPayerId,
    ready: on && !!pkg && !!payer,
  };
}

/** Start and billing dates: the defaults (which follow the cancel side)
 * until the coach picks their own. */
function useDates(cancel: CancelSide | null, today: Day) {
  const [startOverride, setStartOverride] = useState<Day | null>(null);
  const [billingOverride, setBillingOverride] = useState<Day | null>(null);
  const defaults = defaultDates(cancel, today, startOverride ?? undefined);
  return {
    start: defaults.start,
    billing: billingOverride ?? defaults.billing,
    startOverride,
    setStartOverride,
    billingOverride,
    setBillingOverride,
    reset: () => {
      setStartOverride(null);
      setBillingOverride(null);
    },
  };
}

function addSideOf(pkg: PackageOption | null): AddSide | null {
  if (!pkg) return null;
  return {
    name: pkg.name,
    recurring: pkg.billing_type === "recurring",
    priceCents: pkg.price_cents,
    interval: pkg.billing_interval,
    accessWeeks: pkg.access_weeks,
  };
}

function useChangeDraft({
  memberships,
  billable,
  packages,
  init,
}: {
  memberships: AthleteMembership[];
  billable: AthletePayer[];
  packages: PackageOption[];
  init: ChangeInit;
}) {
  const [today] = useState(() => zonedDay(new Date()));
  const cancellable = cancellableMemberships(memberships);
  const cancel = useCancelDraft(cancellable, init);
  const add = useAddDraft(billable, packages, init, cancel.old?.payerProfileId);
  const dates = useDates(cancel.side, today);
  const events = buildTimeline({
    cancel: cancel.side,
    add: add.on ? addSideOf(add.pkg) : null,
    start: dates.start,
    billing: dates.billing,
    today,
    cardLabel: add.payer?.card ? cardLabel(add.payer.card) : null,
  });
  return { today, cancellable, billable, cancel, add, dates, events };
}

/** The change as the edge function takes it. */
function toChange({ cancel, add, dates }: ChangeDraft): MembershipChange {
  const change: MembershipChange = {};
  if (cancel.side && cancel.old) {
    change.cancel = { purchaseId: cancel.old.id, when: cancel.when };
  }
  if (add.ready && add.pkg && add.payer) {
    change.add = {
      packageId: add.pkg.id,
      payerProfileId: add.payer.profileId,
      startDate: dates.start,
      billingDate: dates.billing,
    };
  }
  return change;
}

function OldPackageSummary({
  membership: m,
  today,
}: {
  membership: AthleteMembership;
  today: Day;
}) {
  const paidThrough =
    m.kind === "subscription" && m.currentPeriodEnd && !isUpcoming(m.startsAt)
      ? `, paid through ${formatDay(zonedDay(m.currentPeriodEnd), today)}`
      : "";
  return (
    <div className="bg-portal-bg flex items-center gap-3 rounded-[10px] px-3.5 py-3">
      <PackageTile />
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {m.packageName}
        </div>
        <div className="text-portal-text3 mt-0.5 text-[11px]">
          {money(m.amountCents)}
          {m.interval ? `/${m.interval}` : " one-off"}
          {paidThrough}
        </div>
      </div>
    </div>
  );
}

function EndsChoice({ draft }: { draft: ChangeDraft }) {
  const { cancel, dates, today } = draft;
  if (!cancel.old || cancel.forcedNow) return null;
  const renewal = cancel.side ? renewalDay(cancel.side, today) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>Ends</span>
      <SegmentedControl
        value={cancel.chosenWhen}
        onChange={(w) => {
          cancel.setChosenWhen(w);
          dates.setStartOverride(null);
        }}
        options={[
          [
            "period_end",
            `End of period${renewal ? `, ${formatDay(renewal, today)}` : ""}`,
          ],
          ["now", "Immediately"],
        ]}
      />
    </div>
  );
}

function CancelSection({ draft }: { draft: ChangeDraft }) {
  const { cancel, cancellable, dates, today } = draft;
  return (
    <Section
      n={1}
      on={!!cancel.side}
      onToggle={(on) => {
        cancel.setOn(on);
        dates.reset();
      }}
      disabled={cancellable.length === 0}
      title="Cancel current package"
      sub={
        cancellable.length
          ? "Stop billing and remove access"
          : "No packages to cancel"
      }>
      {cancellable.length > 1 && (
        <select
          aria-label="Package to cancel"
          value={cancel.old?.id ?? ""}
          onChange={(e) => {
            cancel.setCancelId(e.target.value);
            dates.reset();
          }}
          className={selectClass}>
          {cancellable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.packageName}
            </option>
          ))}
        </select>
      )}
      {cancel.old && (
        <OldPackageSummary membership={cancel.old} today={today} />
      )}
      <EndsChoice draft={draft} />
    </Section>
  );
}

function StartHint({ draft }: { draft: ChangeDraft }) {
  const { cancel, dates } = draft;
  if (dates.startOverride) {
    return (
      <LinkButton onClick={() => dates.setStartOverride(null)}>
        Reset
      </LinkButton>
    );
  }
  return cancel.side?.when === "period_end"
    ? `When ${cancel.side.name} ends`
    : "Access unlocks today";
}

function BillingHint({ draft }: { draft: ChangeDraft }) {
  const { cancel, dates, today } = draft;
  const useDefault = () => dates.setBillingOverride(null);
  if (!cancel.side) {
    return dates.billingOverride ? (
      <LinkButton onClick={useDefault}>Same as start</LinkButton>
    ) : (
      "Same as package start"
    );
  }
  const renewal = renewalDay(cancel.side, today);
  if (dates.billing === renewal) {
    return (
      <>
        <span className="text-[#38A169]">
          <CheckIcon size={11} />
        </span>
        Matches {cancel.side.name} billing date
      </>
    );
  }
  return (
    <>
      <span>Old billing date was {formatDay(renewal, today)}</span>
      <LinkButton onClick={useDefault}>Use it</LinkButton>
    </>
  );
}

function PayerSelect({ draft }: { draft: ChangeDraft }) {
  const { add } = draft;
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>Billed to</span>
      <select
        aria-label="Billed to"
        value={add.payerId ?? ""}
        onChange={(e) => add.setPayerId(e.target.value)}
        className={selectClass}>
        {draft.billable.map((p) => (
          <option key={p.profileId} value={p.profileId}>
            {p.name} ({p.isSelf ? "athlete" : "parent"})
            {p.card ? `, ${cardLabel(p.card)}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function AddSection({
  draft,
  packages,
  onPicked,
}: {
  draft: ChangeDraft;
  packages: PackageOption[];
  onPicked: () => void;
}) {
  const { add, dates, today } = draft;
  const payers = draft.billable;
  const oneOff = add.pkg?.billing_type === "one_time";
  return (
    <Section
      n={2}
      on={add.on}
      onToggle={(on) => {
        add.setOn(on);
        dates.reset();
      }}
      title="Add new package"
      sub="Pick a package, when it starts and when billing starts">
      {payers.length === 0 ? (
        <p className="border-portal-orange/30 bg-portal-orange-soft text-portal-text1 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed">
          No card on file. They need to buy a package once in the billing portal
          first, so a card is saved.
        </p>
      ) : (
        <>
          <PackageSearchSelect
            packages={packages}
            value={add.pkg?.id ?? null}
            onChange={(id) => {
              add.setPackageId(id);
              onPicked();
            }}
          />
          {payers.length > 1 && <PayerSelect draft={draft} />}
          <div
            className={cn(
              "flex flex-col gap-3 sm:flex-row",
              !add.pkg && "pointer-events-none opacity-45",
            )}>
            <DateField
              label="Package starts"
              value={dates.start}
              min={today}
              onChange={dates.setStartOverride}
              hint={<StartHint draft={draft} />}
            />
            <DateField
              label={oneOff ? "Charge on" : "Billing starts"}
              value={dates.billing}
              min={today}
              onChange={dates.setBillingOverride}
              hint={<BillingHint draft={draft} />}
            />
          </div>
        </>
      )}
    </Section>
  );
}

const DOT = {
  red: "bg-red-500",
  green: "bg-[#38A169]",
  orange: "bg-portal-orange",
} as const;

function GapNote({ draft }: { draft: ChangeDraft }) {
  const { add, dates } = draft;
  if (!add.on || !add.pkg) return null;
  const gap = daysBetween(dates.start, dates.billing);
  const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
  if (gap > 0) {
    return (
      <div className="border-portal-border bg-portal-card text-portal-text2 mt-5 rounded-lg border px-3 py-2.5 text-xs leading-snug">
        {days(gap)} of access before the first charge.
      </div>
    );
  }
  if (gap < 0) {
    return (
      <div className="border-portal-orange/30 bg-portal-orange-soft text-portal-orange mt-5 rounded-lg border px-3 py-2.5 text-xs leading-snug font-semibold">
        Charged {days(-gap)} before access starts.
      </div>
    );
  }
  return null;
}

/** The "What happens" column. */
function Timeline({ draft }: { draft: ChangeDraft }) {
  const { events, today } = draft;
  return (
    <div className="border-portal-border bg-portal-bg border-t p-6 md:overflow-y-auto md:border-t-0 md:border-l">
      <div className={cn(labelClass, "mb-4")}>What happens</div>
      {events.length === 0 ? (
        <p className="text-portal-text3 text-[13px] leading-relaxed">
          Choose a package to cancel or add.
        </p>
      ) : (
        <ol className="flex flex-col">
          {events.map((e, i) => {
            const last = i === events.length - 1;
            return (
              <li key={`${e.tone}-${e.day}`} className="flex gap-3">
                <div className="flex w-2.5 flex-shrink-0 flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      DOT[e.tone],
                    )}
                  />
                  {!last && (
                    <span className="bg-portal-border my-1 w-0.5 flex-1" />
                  )}
                </div>
                <div className={cn("min-w-0", !last && "pb-4.5")}>
                  <div className="text-portal-text2 text-[10px] font-semibold tracking-widest uppercase">
                    {formatDay(e.day, today)}
                  </div>
                  <div className="text-portal-text1 mt-0.5 text-[13px] font-semibold">
                    {e.title}
                  </div>
                  {e.sub && (
                    <div className="text-portal-text3 mt-0.5 text-xs leading-snug">
                      {e.sub}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <GapNote draft={draft} />
    </div>
  );
}

/** Cancel a package, add one, or both in one go (a switch). Adding charges
 * the payer's saved card on the billing date; with a cancel, billing
 * defaults to the old package's renewal day so the athlete keeps their
 * billing date. The right column spells out what will happen, in order. */
export function ChangePackageModal({
  athleteName,
  memberships,
  billable,
  packages,
  init,
  onClose,
  onSubmit,
}: {
  athleteName: string;
  memberships: AthleteMembership[];
  /** Who a new package can be charged to (each has a saved card). */
  billable: AthletePayer[];
  /** Packages that can be added — ones the athlete already holds are
   * left out by the caller. */
  packages: PackageOption[];
  init: ChangeInit;
  onClose: () => void;
  onSubmit: (change: MembershipChange) => Promise<ActionResult>;
}) {
  const draft = useChangeDraft({ memberships, billable, packages, init });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cancel, add } = draft;
  const cancelling = !!cancel.side;
  const ready = (cancelling || add.on) && (!add.on || add.ready) && !saving;

  const submit = async () => {
    if (!ready) return;
    setSaving(true);
    setError(null);
    const result = await onSubmit(toChange(draft));
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Something went wrong. Please try again.");
  };

  return (
    <Modal
      title="Change package"
      subtitle={
        add.payer?.card
          ? `${athleteName}, billed to ${cardLabel(add.payer.card)}`
          : athleteName
      }
      width="xl"
      onClose={onClose}>
      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px] md:overflow-hidden">
        <div className="flex flex-col gap-3.5 p-6 md:overflow-y-auto">
          <CancelSection draft={draft} />
          <AddSection
            draft={draft}
            packages={packages}
            onPicked={() => setError(null)}
          />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
        <Timeline draft={draft} />
      </div>
      <ModalFooter>
        <PortalButton onClick={onClose} disabled={saving}>
          Close
        </PortalButton>
        <PortalButton
          variant={add.on ? "primary" : "danger"}
          onClick={submit}
          disabled={!ready}>
          {saving ? "Saving…" : changeCtaLabel(cancelling, add.on, cancel.when)}
        </PortalButton>
      </ModalFooter>
    </Modal>
  );
}
