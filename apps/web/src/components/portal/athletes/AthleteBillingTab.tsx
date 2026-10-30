"use client";

import { cn } from "@/src/lib/cn";
import { formatShortDate } from "@/src/lib/format";
import { money } from "@/src/lib/packages";
import type {
  AthleteBilling,
  AthleteCard,
  AthleteInvoice,
  AthleteMembership,
  AthletePayer,
} from "@/src/services/athleteBilling.service";
import { useState } from "react";
import {
  DetailCardHead,
  detailCardClass,
  detailLabelClass,
} from "../ui/DetailListCard";
import { ExternalLinkIcon } from "../ui/icons";
import { Modal, ModalFooter } from "../ui/Modal";
import { PortalBadge } from "../ui/PortalBadge";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useAthleteDetailContext } from "./AthleteDetailShell";
import { PackageStatusBadge, PackageTile } from "./AthleteTrainingTab";

type ActionResult = { ok: boolean; error?: string };

const INVOICE_BADGE = {
  paid: { variant: "green", label: "Paid" },
  failed: { variant: "red", label: "Failed" },
  due: { variant: "orange", label: "Due" },
} as const;

/** Brand tile for a saved card — read-only; coaches can't change cards. */
function CardMark({ brand }: { brand: string }) {
  const label =
    brand === "mastercard" ? "MC" : brand === "amex" ? "AMEX" : brand;
  return (
    <div className="font-title flex h-[30px] w-11 flex-shrink-0 items-center justify-center rounded-[5px] bg-[#1A1718] text-[13px] font-black tracking-wide text-white uppercase italic">
      {label.slice(0, 4)}
    </div>
  );
}

function cardLabel(card: AthleteCard): string {
  const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
  return `${brand} •••• ${card.last4}`;
}

function cardExpiry(card: AthleteCard): string {
  return `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}`;
}

function membershipSub(m: AthleteMembership): string {
  if (m.kind === "one_time") {
    const paid = m.paidAt ? `Paid ${formatShortDate(m.paidAt)}` : "Paid";
    return m.accessUntil
      ? `${paid}, access until ${formatShortDate(m.accessUntil)}`
      : `${paid}, unlimited access`;
  }
  const end = m.currentPeriodEnd && formatShortDate(m.currentPeriodEnd);
  if (m.status === "past_due") {
    return "Last payment failed. Stripe retries automatically.";
  }
  if (m.status === "canceled" || m.status === "expired") {
    return end ? `Ended ${end}` : "Ended";
  }
  if (m.cancelAtPeriodEnd) {
    return end ? `Access ends ${end}, no further charges` : "Cancelling";
  }
  return end
    ? `Next charge ${money(m.amountCents)} on ${end}, since ${formatShortDate(m.createdAt)}`
    : `Since ${formatShortDate(m.createdAt)}`;
}

function MembershipsCard({
  memberships,
}: {
  memberships: AthleteMembership[];
}) {
  return (
    <div className={detailCardClass}>
      <DetailCardHead title="Memberships" />
      {memberships.length === 0 ? (
        <p className="text-portal-text3 p-7 text-center text-[13px]">
          No packages bought yet.
        </p>
      ) : (
        memberships.map((m) => {
          const ended = m.status === "canceled" || m.status === "expired";
          return (
            <div
              key={m.id}
              className="border-portal-border flex items-center gap-3.5 border-b px-5 py-4 last:border-b-0">
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
            <div className="text-portal-text3 text-xs leading-relaxed">
              {p.isSelf
                ? "Paid by the athlete."
                : `Paid by ${p.name}, their parent.`}{" "}
              Only the card holder can change it, from the billing portal.
            </div>
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

/** The Billing tab, read live from Stripe through the coach-athlete edge
 * function. Coaches can look, open invoices and retry a failed membership
 * charge — never change the card, cancel or buy anything. */
export function AthleteBillingTab({
  billing,
  error,
  retryAction,
}: {
  billing: AthleteBilling | null;
  error: string | null;
  retryAction: (
    profileId: string,
    purchaseId: string,
    invoiceId: string,
  ) => Promise<ActionResult>;
}) {
  const { athlete } = useAthleteDetailContext();
  const toast = useToast();
  const [open, setOpen] = useState<AthleteInvoice | null>(null);

  if (!billing) {
    return (
      <div className="flex-1 overflow-y-auto p-7">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Couldn&apos;t load billing: {error}
        </div>
      </div>
    );
  }

  const { memberships, payers, invoices } = billing;
  const paidToDate = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountCents, 0);
  const membershipFor = (inv: AthleteInvoice) =>
    memberships.find((m) => m.id === inv.purchaseId);
  const cardFor = (inv: AthleteInvoice) => {
    const m = membershipFor(inv);
    return payers.find((p) => p.profileId === m?.payerProfileId)?.card ?? null;
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MembershipsCard memberships={memberships} />
        <PaymentMethodCard payers={payers} />
      </div>

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
          <InvoiceTable invoices={invoices} onOpen={setOpen} />
        )}
      </div>

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
