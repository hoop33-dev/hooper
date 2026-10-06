"use client";

import { cn } from "@/src/lib/cn";
import {
  draftToPricing,
  PACKAGE_LINK_PREFIX,
  packageBillingSummary,
  packageLink,
  pricingToDraft,
  samePricing,
  type PackagePricing,
  type PackagePricingDraft,
} from "@/src/lib/packages";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, LockIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import { PackagePriceFields } from "./PackagePriceFields";

type ActionResult = { ok: boolean; error?: string };

const FLASH_MS = 1800;

const cardClass =
  "border-portal-border bg-portal-card overflow-hidden rounded-xl border";

/** true for FLASH_MS after `flash()` — the "Copied" / "Pricing saved"
 * confirmations. */
function useFlash(): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);
  return [
    on,
    () => {
      setOn(true);
      clearTimeout(timer.current ?? undefined);
      timer.current = setTimeout(() => setOn(false), FLASH_MS);
    },
  ];
}

export function PackageLinkCard({ slug }: { slug: string }) {
  const [copied, flashCopied] = useFlash();

  async function copy() {
    try {
      await navigator.clipboard.writeText(packageLink(slug));
      flashCopied();
    } catch (e) {
      console.error("Failed to copy package link:", e);
    }
  }

  return (
    <div className={cn(cardClass, "px-5 py-[18px]")}>
      <h2 className="text-portal-text1 mb-3 text-sm font-bold">Package link</h2>
      <div className="flex gap-2">
        <div className="border-portal-border bg-portal-bg flex h-10 min-w-0 flex-1 items-center truncate rounded-lg border px-3.5 text-sm">
          <span className="text-portal-text3">{PACKAGE_LINK_PREFIX}</span>
          <span className="text-portal-text1 font-bold">{slug}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "flex h-10 min-w-[124px] cursor-pointer items-center justify-center gap-[7px] rounded-lg px-4 text-[13px] font-bold text-white transition-colors duration-200",
            copied ? "bg-[#38A169]" : "bg-portal-orange",
          )}>
          {copied ? (
            <>
              <CheckIcon size={13} /> Copied
            </>
          ) : (
            <>
              <CopyIcon size={14} /> Copy link
            </>
          )}
        </button>
      </div>
      <p className="text-portal-text3 mt-3 flex items-center gap-1.5 text-xs">
        <LockIcon />
        <span>
          ID <b className="text-portal-text2 font-semibold">{slug}</b> is
          permanent, so shared links always work.
        </span>
      </p>
    </div>
  );
}

/** Purchases arrive in a later billing phase — always zero for now. */
export function ActiveBuyersCard() {
  return (
    <div
      className={cn(
        cardClass,
        "flex flex-col justify-between gap-2 px-5 py-[18px]",
      )}>
      <div className="text-portal-text3 text-[11px] font-semibold tracking-widest uppercase">
        Active buyers
      </div>
      <div className="font-title text-portal-text3 text-5xl leading-none font-black">
        0
      </div>
      <div className="text-portal-text3 text-xs">No active purchases yet</div>
    </div>
  );
}

export function PricingCard({
  pricing,
  onSave,
}: {
  pricing: PackagePricing;
  onSave: (pricing: PackagePricing) => Promise<ActionResult>;
}) {
  const [draft, setDraft] = useState<PackagePricingDraft>(() =>
    pricingToDraft(pricing),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, flashSaved] = useFlash();

  const parsed = draftToPricing(draft);
  const dirty = !parsed.ok || !samePricing(parsed.pricing, pricing);

  async function save() {
    if (!parsed.ok || saving) return;
    setSaving(true);
    setError(null);
    const result = await onSave(parsed.pricing);
    setSaving(false);
    if (result.ok) {
      setDraft(pricingToDraft(parsed.pricing));
      flashSaved();
    } else {
      setError(result.error ?? "Failed to save pricing.");
    }
  }

  return (
    <div className={cardClass}>
      <h2 className="border-portal-border text-portal-text1 border-b px-5 py-3.5 text-sm font-bold">
        Pricing
      </h2>
      <div className="flex flex-col gap-4 p-5">
        <PackagePriceFields
          stacked
          value={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        />
        {!parsed.ok && <p className="text-xs text-red-500">{parsed.error}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          {dirty ? (
            <>
              <PortalButton
                size="sm"
                disabled={saving}
                onClick={() => setDraft(pricingToDraft(pricing))}>
                Discard
              </PortalButton>
              <PortalButton
                variant="primary"
                size="sm"
                disabled={saving || !parsed.ok}
                onClick={save}>
                {saving ? "Saving…" : "Save pricing"}
              </PortalButton>
            </>
          ) : (
            <span
              className={cn(
                "flex h-8 items-center gap-1.5 text-xs",
                saved ? "text-[#38A169]" : "text-portal-text3",
              )}>
              {saved ? (
                <>
                  <CheckIcon /> Pricing saved
                </>
              ) : (
                packageBillingSummary(pricing)
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
