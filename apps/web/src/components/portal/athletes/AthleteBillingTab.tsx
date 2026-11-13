"use client";

import { cn } from "@/src/lib/cn";
import { formatShortDate } from "@/src/lib/format";
import {
  PENDING_PREFIX,
  applyMembershipChange,
  changeSuccessMessage,
  isUpcoming,
} from "@/src/lib/membershipChange";
import { money } from "@/src/lib/packages";
import type {
  AthleteBilling,
  AthleteCard,
  AthleteInvoice,
  AthleteMembership,
  AthletePayer,
  MembershipChange,
} from "@/src/services/athleteBilling.service";
import { useState } from "react";
import {
  DetailCardHead,
  detailCardClass,
  detailLabelClass,
} from "../ui/DetailListCard";
import { ExternalLinkIcon, PlusIcon } from "../ui/icons";
import { Modal, ModalFooter } from "../ui/Modal";
import { PortalBadge } from "../ui/PortalBadge";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useOptimisticList } from "../ui/useOptimisticList";
import { athleteName } from "./AthleteAvatar";
import { useAthleteDetailContext } from "./AthleteDetailShell";
import { PackageStatusBadge, PackageTile } from "./AthleteTrainingTab";
import { CardMark, cardExpiry, cardLabel } from "./billing/cards";
import {
  ChangePackageModal,
  cancellableMemberships,
  type ChangeInit,
} from "./billing/ChangePackageModal";
import type { PackageOption } from "./billing/PackageSearchSelect";

type ActionResult = { ok: boolean; error?: string };

const INVOICE_BADGE = {
  paid: { variant: "green", label: "Paid" },
  failed: { variant: "red", label: "Failed" },
  due: { variant: "orange", label: "Due" },
} as const;

/** The first charge's date while it's still ahead (coach-started packages
 * can bill later than they start). */
function pendingFirstCharge(m: AthleteMembership): string | null {
  return !m.paidAt && m.billingStartsAt
    ? formatShortDate(m.billingStartsAt)
    : null;
}

function accessLabel(m: AthleteMembership): string {
  return m.accessUntil
    ? `access until ${formatShortDate(m.accessUntil)}`
    : "unlimited access";
}

function upcomingSub(m: AthleteMembership): string {
  const starts = `Starts ${formatShortDate(m.startsAt!)}`;
  const charge = pendingFirstCharge(m);
  if (!charge) return starts;
  const verb = m.kind === "one_time" ? "charged" : "first charge";
  return `${starts}, ${verb} ${money(m.amountCents)} on ${charge}`;
}

function oneOffSub(m: AthleteMembership): string {
  if (m.status === "past_due") {
    return "Charge failed. Retry it from the invoice below.";
  }
  const charge = pendingFirstCharge(m);
  if (charge && m.status === "active") {
    return `Charged ${money(m.amountCents)} on ${charge}, ${accessLabel(m)}`;
  }
  const paid = m.paidAt ? `Paid ${formatShortDate(m.paidAt)}` : "Paid";
  return `${paid}, ${accessLabel(m)}`;
}

function subscriptionSub(m: AthleteMembership): string {
  const end = m.currentPeriodEnd && formatShortDate(m.currentPeriodEnd);
  if (m.status === "past_due") {
    return "Last payment failed. Stripe retries automatically.";
  }
  if (m.cancelAtPeriodEnd) {
    return end ? `Access ends ${end}` : "Cancelling";
  }
  const since = formatShortDate(m.startsAt ?? m.createdAt);
  const charge = pendingFirstCharge(m);
  if (charge) {
    return `First charge ${money(m.amountCents)} on ${charge}, since ${since}`;
  }
  return end
    ? `Next charge ${money(m.amountCents)} on ${end}, since ${since}`
    : `Since ${since}`;
}

/** A cancelled or lapsed membership. A cancel before the period was up
 * leaves its period end in the future, so that isn't when it ended. */
function endedSub(m: AthleteMembership): string {
  const end = m.kind === "one_time" ? m.accessUntil : m.currentPeriodEnd;
  if (!end || new Date(end) > new Date()) {
    return m.status === "canceled" ? "Cancelled" : "Ended";
  }
  return `Ended ${formatShortDate(end)}`;
}

function membershipSub(m: AthleteMembership): string {
  if (m.status === "canceled" || m.status === "expired") return endedSub(m);
  if (m.status === "active" && isUpcoming(m.startsAt)) return upcomingSub(m);
  return m.kind === "one_time" ? oneOffSub(m) : subscriptionSub(m);
}

function MembershipActions({
  membership: m,
  cancellable,
  onChange,
  onKeep,
}: {
  membership: AthleteMembership;
  cancellable: boolean;
  onChange: (init: ChangeInit) => void;
  onKeep: (purchaseId: string) => Promise<ActionResult>;
}) {
  const [keeping, setKeeping] = useState(false);
  if (m.cancelAtPeriodEnd && m.status === "active") {
    return (
      <PortalButton
        size="sm"
        disabled={keeping}
        onClick={async () => {
          setKeeping(true);
          await onKeep(m.id);
          setKeeping(false);
        }}>
        {keeping ? "Keeping…" : "Keep membership"}
      </PortalButton>
    );
  }
  if (!cancellable) return null;
  const scheduled = isUpcoming(m.startsAt) || m.kind === "one_time";
  return (
    <div className="flex gap-2">
      {!scheduled && m.status === "active" && (
        <PortalButton
          size="sm"
          onClick={() => onChange({ cancelId: m.id, add: true })}>
          Switch
        </PortalButton>
      )}
      <PortalButton
        size="sm"
        className="text-red-600"
        onClick={() => onChange({ cancelId: m.id, add: false })}>
        Cancel
      </PortalButton>
    </div>
  );
}

function MembershipsCard({
  memberships,
  onChange,
  onKeep,
}: {
  memberships: AthleteMembership[];
  onChange: (init: ChangeInit) => void;
  onKeep: (purchaseId: string) => Promise<ActionResult>;
}) {
  // A row for a package still being added has no real id to act on yet.
  const cancellable = new Set(
    cancellableMemberships(memberships)
      .map((m) => m.id)
      .filter((id) => !id.startsWith(PENDING_PREFIX)),
  );
  return (
    <div className={detailCardClass}>
      <DetailCardHead
        title="Memberships"
        right={
          <button
            type="button"
            onClick={() => onChange({ cancelId: null, add: true })}
            className="text-portal-orange flex items-center gap-1 text-[13px] font-semibold">
            <PlusIcon size={14} /> Add package
          </button>
        }
      />
      {memberships.length === 0 ? (
        <p className="text-portal-text3 p-7 text-center text-[13px]">
          No packages yet.
        </p>
      ) : (
        memberships.map((m) => {
          const ended = m.status === "canceled" || m.status === "expired";
          return (
            <div
              key={m.id}
              className="border-portal-border flex flex-wrap items-center gap-3.5 border-b px-5 py-4 last:border-b-0">
              <PackageTile size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-portal-text1 truncate text-sm font-bold">
                    {m.packageName}
                  </span>
                  <PackageStatusBadge
                    status={m.status}
                    recurring={m.kind === "subscription"}
                    cancelAtPeriodEnd={m.cancelAtPeriodEnd}
                    startsAt={m.startsAt}
                    switchedTo={m.switchedToName}
                  />
                </div>
                <div className="text-portal-text3 mt-0.5 text-xs">
                  {membershipSub(m)}
                </div>
              </div>
              <div
                className={cn(
                  "font-title text-[22px] font-extrabold tracking-wide",
                  ended ? "text-portal-text3" : "text-portal-text1",
                )}>
                {money(m.amountCents)}
                {m.interval && (
                  <span className="text-portal-text3 font-sans text-xs font-medium">
                    /{m.interval}
                  </span>
                )}
              </div>
              <MembershipActions
                membership={m}
                cancellable={cancellable.has(m.id)}
                onChange={onChange}
                onKeep={onKeep}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

function PaymentMethodCard({ payers }: { payers: AthletePayer[] }) {
  return (
    <div className={detailCardClass}>
      <DetailCardHead title="Payment method" />
      {payers.length === 0 ? (
        <p className="text-portal-text3 p-7 text-center text-[13px]">
          No card on file.
        </p>
      ) : (
        payers.map((p) => (
          <div
            key={p.profileId}
            className="border-portal-border flex flex-col gap-3 border-b p-5 last:border-b-0">
            {p.card ? (
              <div className="flex items-center gap-3">
                <CardMark brand={p.card.brand} />
                <div>
                  <div className="text-portal-text1 text-sm font-semibold">
                    {cardLabel(p.card)}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-xs",
                      p.card.expired
                        ? "font-semibold text-red-600"
                        : "text-portal-text3",
                    )}>
                    {p.card.expired ? "Expired" : "Expires"}{" "}
                    {cardExpiry(p.card)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-portal-text3 text-sm">No card on file</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function InvoiceTable({
  invoices,
  onOpen,
}: {
  invoices: AthleteInvoice[];
  onOpen: (invoice: AthleteInvoice) => void;
}) {
  const th =
    "border-portal-border bg-portal-bg text-portal-text3 border-b px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest uppercase";
  const td = "border-portal-border border-b px-4 py-3 text-[13px]";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Invoice</th>
            <th className={th}>Date</th>
            <th className={th}>Package</th>
            <th className={cn(th, "text-right")}>Amount</th>
            <th className={th}>Status</th>
            <th className={cn(th, "w-12")} />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const badge = INVOICE_BADGE[inv.status];
            return (
              <tr
                key={inv.id}
                onClick={() => onOpen(inv)}
                className="hover:bg-portal-bg cursor-pointer">
                <td className={cn(td, "text-portal-text1 font-semibold")}>
                  {inv.number ?? "Receipt"}
                </td>
                <td className={cn(td, "text-portal-text2 whitespace-nowrap")}>
                  {formatShortDate(inv.date)}
                </td>
                <td className={cn(td, "text-portal-text1")}>
                  {inv.description}
                </td>
                <td
                  className={cn(
                    td,
                    "text-portal-text1 text-right font-semibold tabular-nums",
                  )}>
                  {money(inv.amountCents)}
                </td>
                <td className={td}>
                  <PortalBadge variant={badge.variant}>
                    {badge.label}
                  </PortalBadge>
                </td>
                <td className={td}>
                  {inv.url && (
                    <a
                      href={inv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open in Stripe"
                      aria-label={`Open ${inv.number ?? "receipt"} in Stripe`}
                      className="border-portal-border text-portal-text2 hover:bg-portal-card flex h-7 w-7 items-center justify-center rounded-md border">
                      <ExternalLinkIcon size={13} />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The modal's body: amount, line item with GST, and the card charged. */
function InvoiceSummary({
  invoice,
  card,
}: {
  invoice: AthleteInvoice;
  card: AthleteCard | null;
}) {
  const badge = INVOICE_BADGE[invoice.status];
  // NZ prices include 15% GST, which is 3/23 of the total.
  const gst = Math.round((invoice.amountCents * 3) / 23);
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <div className={detailLabelClass}>Amount</div>
          <div className="font-title text-portal-text1 text-[40px] leading-tight font-black tracking-wide">
            {money(invoice.amountCents)}
          </div>
        </div>
        <PortalBadge variant={badge.variant}>{badge.label}</PortalBadge>
      </div>
      <div className="border-portal-border rounded-[10px] border text-[13px]">
        <div className="border-portal-border flex justify-between border-b px-3.5 py-3">
          <span className="text-portal-text1 font-semibold">
            {invoice.description}
          </span>
          <span className="text-portal-text1 font-semibold">
            {money(invoice.amountCents)}
          </span>
        </div>
        <div className="text-portal-text3 flex justify-between px-3.5 py-3">
          <span>GST included</span>
          <span className="font-semibold">{money(gst)}</span>
        </div>
      </div>
      {card && (
        <div className="text-portal-text2 flex items-center gap-2.5 text-[13px]">
          <CardMark brand={card.brand} />
          {cardLabel(card)}
        </div>
      )}
    </>
  );
}

function InvoiceModal({
  invoice,
  membership,
  card,
  onClose,
  onRetry,
}: {
  invoice: AthleteInvoice;
  /** The membership it billed — retry is offered only while past due. */
  membership: AthleteMembership | undefined;
  card: AthleteCard | null;
  onClose: () => void;
  onRetry: (purchaseId: string, invoiceId: string) => Promise<ActionResult>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRetry =
    invoice.status !== "paid" && membership?.status === "past_due";

  const retry = async () => {
    if (!membership) return;
    setRetrying(true);
    setError(null);
    const result = await onRetry(membership.id, invoice.id);
    setRetrying(false);
    setConfirming(false);
    if (result.ok) onClose();
    else setError(result.error ?? "The payment didn't go through.");
  };

  return (
    <Modal
      title={invoice.number ?? "Receipt"}
      subtitle={`Issued ${formatShortDate(invoice.date)}`}
      onClose={onClose}>
      <div className="flex flex-col gap-4 overflow-y-auto p-6">
        <InvoiceSummary invoice={invoice} card={card} />
        {confirming && card && (
          <div className="border-portal-orange/30 bg-portal-orange-soft text-portal-text1 rounded-lg border px-4 py-3 text-[13px]">
            Charge {money(invoice.amountCents)} to {cardLabel(card)} now?
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
      <ModalFooter>
        {invoice.url && (
          <a
            href={invoice.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-portal-card border-portal-border text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm transition">
            <ExternalLinkIcon size={14} /> Open invoice
          </a>
        )}
        {canRetry &&
          (confirming ? (
            <>
              <PortalButton
                onClick={() => setConfirming(false)}
                disabled={retrying}>
                Cancel
              </PortalButton>
              <PortalButton
                variant="primary"
                onClick={retry}
                disabled={retrying}>
                {retrying ? "Charging…" : "Charge card"}
              </PortalButton>
            </>
          ) : (
            <PortalButton
              variant="primary"
              onClick={() => setConfirming(true)}
              disabled={!card}
              title={card ? undefined : "No card on file"}>
              Retry payment
            </PortalButton>
          ))}
      </ModalFooter>
    </Modal>
  );
}

function InvoicesCard({
  invoices,
  onOpen,
}: {
  invoices: AthleteInvoice[];
  onOpen: (invoice: AthleteInvoice) => void;
}) {
  const paidToDate = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountCents, 0);
  return (
    <div className={detailCardClass}>
      <DetailCardHead
        title={`Invoices (${invoices.length})`}
        right={
          <span className="text-portal-text3 text-xs">
            {money(paidToDate)} paid to date
          </span>
        }
      />
      {invoices.length === 0 ? (
        <p className="text-portal-text3 p-7 text-center text-[13px]">
          No invoices yet.
        </p>
      ) : (
        <InvoiceTable invoices={invoices} onOpen={onOpen} />
      )}
    </div>
  );
}

/** The change-package modal, while the shell has one open. Packages the
 * athlete already holds live are left out: they can hold at most one live
 * purchase of each. */
function BillingChangeModal({
  billing,
  packages,
  onSubmit,
}: {
  billing: AthleteBilling;
  packages: PackageOption[];
  onSubmit: (change: MembershipChange) => Promise<ActionResult>;
}) {
  const { athlete, packageChange } = useAthleteDetailContext();
  if (!packageChange.init) return null;

  const held = new Set(
    billing.memberships
      .filter((m) => m.status === "active" || m.status === "past_due")
      .map((m) => m.packageId),
  );
  return (
    <ChangePackageModal
      athleteName={athleteName(athlete)}
      memberships={billing.memberships}
      // Before coach-athlete returned `billable`, fall back to the existing
      // payers with a usable card; the edge function re-checks the payer.
      billable={
        billing.billable ??
        billing.payers.filter((p) => p.card && !p.card.expired)
      }
      packages={packages.filter((p) => !held.has(p.id))}
      init={packageChange.init}
      onClose={packageChange.close}
      onSubmit={onSubmit}
    />
  );
}

const NO_MEMBERSHIPS: AthleteMembership[] = [];

/** The memberships list, changed straight away by a switch, cancel, add or
 * keep. The billing summary is read live from Stripe, so the refresh that
 * confirms a change lags it by seconds. */
function useMembershipMutations(
  billing: AthleteBilling | null,
  packages: PackageOption[],
  changeAction: (
    profileId: string,
    change: MembershipChange,
  ) => Promise<ActionResult>,
  keepAction: (profileId: string, purchaseId: string) => Promise<ActionResult>,
) {
  const { athlete } = useAthleteDetailContext();
  const toast = useToast();
  const { items: memberships, mutate } = useOptimisticList(
    billing?.memberships ?? NO_MEMBERSHIPS,
  );

  const submitChange = async (change: MembershipChange) => {
    const added = packages.find((p) => p.id === change.add?.packageId);
    const result = await mutate(
      (prev) => applyMembershipChange(prev, change, added),
      () => changeAction(athlete.id, change),
    );
    if (result.ok) {
      toast.showSuccess(
        changeSuccessMessage(
          !!change.cancel,
          !!change.add,
          change.cancel?.when ?? "now",
        ),
      );
    }
    return result;
  };

  const keep = async (purchaseId: string) => {
    const result = await mutate(
      (prev) =>
        prev.map((m) =>
          m.id === purchaseId
            ? { ...m, cancelAtPeriodEnd: false, switchedToName: null }
            : m,
        ),
      () => keepAction(athlete.id, purchaseId),
    );
    if (result.ok) toast.showSuccess("Membership kept");
    else toast.showError(result.error ?? "Couldn't keep it.");
    return result;
  };

  return { memberships, submitChange, keep };
}

/** The Billing tab, read live from Stripe through the coach-athlete edge
 * function. Coaches can open invoices, retry a failed membership charge,
 * and cancel, add or switch packages — a new package is charged to a card
 * the payer saved themselves. Coaches never see or change the card, and
 * nothing here refunds. */
export function AthleteBillingTab({
  billing,
  error,
  packages,
  retryAction,
  changeAction,
  keepAction,
}: {
  billing: AthleteBilling | null;
  error: string | null;
  /** Every live package, for the add side of the change modal. */
  packages: PackageOption[];
  retryAction: (
    profileId: string,
    purchaseId: string,
    invoiceId: string,
  ) => Promise<ActionResult>;
  changeAction: (
    profileId: string,
    change: MembershipChange,
  ) => Promise<ActionResult>;
  keepAction: (profileId: string, purchaseId: string) => Promise<ActionResult>;
}) {
  const { athlete, packageChange } = useAthleteDetailContext();
  const toast = useToast();
  const [open, setOpen] = useState<AthleteInvoice | null>(null);
  const { memberships, submitChange, keep } = useMembershipMutations(
    billing,
    packages,
    changeAction,
    keepAction,
  );

  if (!billing) {
    return (
      <div className="flex-1 overflow-y-auto p-7">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Couldn&apos;t load billing: {error}
        </div>
      </div>
    );
  }

  const { payers, invoices } = billing;
  const membershipFor = (inv: AthleteInvoice) =>
    memberships.find((m) => m.id === inv.purchaseId);
  const cardFor = (inv: AthleteInvoice) => {
    const m = membershipFor(inv);
    return payers.find((p) => p.profileId === m?.payerProfileId)?.card ?? null;
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MembershipsCard
          memberships={memberships}
          onChange={packageChange.open}
          onKeep={keep}
        />
        <PaymentMethodCard payers={payers} />
      </div>

      <InvoicesCard invoices={invoices} onOpen={setOpen} />

      <BillingChangeModal
        billing={billing}
        packages={packages}
        onSubmit={submitChange}
      />

      {open && (
        <InvoiceModal
          invoice={open}
          membership={membershipFor(open)}
          card={cardFor(open)}
          onClose={() => setOpen(null)}
          onRetry={async (purchaseId, invoiceId) => {
            const result = await retryAction(athlete.id, purchaseId, invoiceId);
            if (result.ok) toast.showSuccess("Payment collected");
            return result;
          }}
        />
      )}
    </div>
  );
}
