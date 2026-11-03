"use client";

import {
  keepMembershipAction,
  stopMembershipAction,
} from "@/src/app/membershipActions";
import { MembershipCard } from "@/src/components/billing/MembershipCard";
import { PackageTile } from "@/src/components/billing/PackageTile";
import { StopSheet } from "@/src/components/billing/StopSheet";
import { CheckIcon, ChevronIcon } from "@/src/components/icons";
import { BtnLink } from "@/src/components/ui/Btn";
import { Title } from "@/src/components/ui/primitives";
import { formatDate } from "@/src/lib/format";
import { isLive } from "@/src/lib/household";
import { accessLine, canStop, isEnding } from "@/src/lib/purchases";
import { withPackage } from "@/src/lib/routes";
import type { MyPackagePurchase } from "@hooper/db";
import { useEffect, useState, useTransition } from "react";

/** Design `MembershipList`: one person's live memberships as cards, past
 * ones folded away, and the Stop sheet. Shared by the Memberships page and
 * each child's page. */
export function MembershipList({
  purchases,
  myProfileId,
  whose,
  error,
  emptyHint,
}: {
  /** Visible (paid) purchases for this one person. */
  purchases: MyPackagePurchase[];
  /** The signed-in user — only the payer can stop or keep. */
  myProfileId: string;
  /** "Your" or "Liam's". */
  whose: string;
  error: string | null;
  emptyHint: string;
}) {
  const [stopping, setStopping] = useState<MyPackagePurchase | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [keepingId, setKeepingId] = useState<string | null>(null);
  const [keepError, setKeepError] = useState<string | null>(null);
  const [toast, setToast] = useToast();
  const [saving, startSaving] = useTransition();

  const live = purchases.filter((p) => isLive(p));
  const past = purchases.filter((p) => !isLive(p));

  // The action revalidates the portal, so its response carries the
  // refreshed page — the sheet stays on "saving" until the card has
  // already flipped to Cancelled underneath.
  function stop(reason: string | null) {
    const p = stopping;
    if (!p) return;
    setSheetError(null);
    startSaving(async () => {
      const res = await stopMembershipAction(p.id, reason);
      if (!res.ok) {
        setSheetError(res.error);
        return;
      }
      setStopping(null);
      setToast(
        p.status === "past_due" || !p.current_period_end
          ? "Membership stopped."
          : `Cancelled. Access until ${formatDate(p.current_period_end)}.`,
      );
    });
  }

  async function keep(p: MyPackagePurchase) {
    setKeepingId(p.id);
    setKeepError(null);
    const res = await keepMembershipAction(p.id);
    setKeepingId(null);
    if (res.ok) setToast("Membership kept.");
    else setKeepError(res.error);
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-3.5">
      {error && (
        <div className="border-danger/30 bg-bp-card text-danger rounded-xl border p-4 text-[13px]">
          Couldn&apos;t load memberships: {error}
        </div>
      )}
      {keepError && (
        <div role="alert" className="text-danger text-[13px]">
          {keepError}
        </div>
      )}
      {!error && live.length === 0 && (
        <div className="border-bp-border bg-bp-card rounded-xl border p-7 text-center">
          <Title className="text-[20px]">No memberships</Title>
          <div className="text-bp-text2 mt-1.5 text-[13px]">{emptyHint}</div>
        </div>
      )}
      {live.map((p) => {
        const payer = p.payer_profile_id === myProfileId;
        return (
          <MembershipCard
            key={p.id}
            purchase={p}
            canStop={canStop(p, myProfileId)}
            canKeep={payer && isEnding(p)}
            keeping={keepingId === p.id}
            onStop={() => {
              setSheetError(null);
              setStopping(p);
            }}
            onKeep={() => keep(p)}
          />
        );
      })}
      {past.length > 0 && <PastMemberships purchases={past} />}
      {stopping && (
        <StopSheet
          purchase={stopping}
          whose={whose}
          saving={saving}
          error={sheetError}
          onClose={() => setStopping(null)}
          onConfirm={stop}
        />
      )}
      {toast && <Toast text={toast} />}
    </div>
  );
}

/** Ended memberships, folded away, each with a Rejoin link back to the
 * package's checkout. */
function PastMemberships({ purchases }: { purchases: MyPackagePurchase[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-bp-border bg-bp-card rounded-xl border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-5 py-[13px] text-left">
        <span className="text-bp-text1 flex-1 text-[13.5px] font-bold">
          Past memberships
        </span>
        <span className="text-bp-text3 text-[12.5px]">{purchases.length}</span>
        <ChevronIcon
          size={15}
          dir={open ? "up" : "down"}
          className="text-bp-text3"
        />
      </button>
      {open &&
        purchases.map((p) => (
          <div
            key={p.id}
            className="border-bp-border flex items-center gap-3 border-t px-4 py-3 md:px-5">
            <PackageTile name={p.package_name} size={32} dim />
            <div className="min-w-0 flex-1">
              <div className="text-bp-text1 truncate text-[13.5px] font-semibold">
                {p.package_name}
              </div>
              <div className="text-bp-text3 text-xs">{accessLine(p)}</div>
            </div>
            <BtnLink
              href={withPackage("/checkout", p.package_slug)}
              variant="ghost"
              size="sm">
              Rejoin
            </BtnLink>
          </div>
        ))}
    </div>
  );
}

/** A message that clears itself after a couple of seconds. */
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, setToast] as const;
}

function Toast({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="bg-ink fixed bottom-[78px] left-1/2 z-[60] flex -translate-x-1/2 items-center gap-[9px] rounded-full px-[18px] py-[11px] text-[13px] font-semibold whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] md:bottom-7">
      <CheckIcon size={12} className="text-orange" />
      {text}
    </div>
  );
}
