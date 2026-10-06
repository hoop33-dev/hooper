"use client";

import { cn } from "@/src/lib/cn";
import type { PackagePricingDraft } from "@/src/lib/packages";
import type { PackageBillingInterval, PackageBillingType } from "@hooper/db";
import { useId } from "react";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import {
  packageFieldClass,
  packageLabelClass,
  packageLabelTextClass,
} from "./PackageAtoms";

const BILLING_OPTIONS: [PackageBillingType, string][] = [
  ["recurring", "Recurring"],
  ["one_time", "One payment"],
];

const INTERVAL_OPTIONS: [PackageBillingInterval, string][] = [
  ["week", "Week"],
  ["month", "Month"],
  ["quarter", "Quarter"],
  ["year", "Year"],
];

const numberInputClass =
  "min-w-0 flex-1 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function BillingToggle({
  value,
  onChange,
}: {
  value: PackageBillingType;
  onChange: (v: PackageBillingType) => void;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-[3px]">
      {BILLING_OPTIONS.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex-1 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-semibold",
            value === v
              ? "border-portal-border bg-portal-card text-portal-text1"
              : "text-portal-text3 border-transparent",
          )}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Weeks of access for a one-off package, or unlimited. A div rather than a
 * <label> wrapper so clicking the switch doesn't also focus the input. */
function AccessLengthField({
  value,
  onChange,
}: {
  value: PackagePricingDraft;
  onChange: (patch: Partial<PackagePricingDraft>) => void;
}) {
  const inputId = useId();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className={packageLabelTextClass}>
          Access length
        </label>
        <ToggleSwitch
          label="Unlimited"
          checked={value.unlimited_access}
          onChange={(unlimited_access) => onChange({ unlimited_access })}
        />
      </div>
      {value.unlimited_access ? (
        <div className={packageFieldClass({ muted: true })}>Never expires</div>
      ) : (
        <div className={packageFieldClass()}>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={value.access_weeks}
            onChange={(e) => onChange({ access_weeks: e.target.value })}
            className={numberInputClass}
          />
          <span className="text-portal-text3 text-xs font-semibold">weeks</span>
        </div>
      )}
    </div>
  );
}

/** Billing toggle, price, and either the recurring interval or the one-off
 * access length. `stacked` lays the price/second field out vertically for
 * the narrow detail-page card. */
export function PackagePriceFields({
  value,
  onChange,
  stacked = false,
}: {
  value: PackagePricingDraft;
  onChange: (patch: Partial<PackagePricingDraft>) => void;
  stacked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className={packageLabelClass}>Billing</span>
        <BillingToggle
          value={value.billing_type}
          onChange={(billing_type) => onChange({ billing_type })}
        />
      </div>
      <div
        className={cn(
          "grid gap-3",
          stacked ? "grid-cols-1 gap-4" : "grid-cols-2",
        )}>
        <label className="block">
          <span className={packageLabelClass}>Price</span>
          <div className={packageFieldClass()}>
            <span className="text-portal-text3">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={value.price}
              onChange={(e) => onChange({ price: e.target.value })}
              className={numberInputClass}
            />
            <span className="text-portal-text3 text-xs font-semibold">NZD</span>
          </div>
        </label>
        {value.billing_type === "recurring" ? (
          <label className="block">
            <span className={packageLabelClass}>Bills every</span>
            <select
              value={value.billing_interval}
              onChange={(e) =>
                onChange({
                  billing_interval: e.target.value as PackageBillingInterval,
                })
              }
              className={cn(
                packageFieldClass(),
                "cursor-pointer outline-none",
              )}>
              {INTERVAL_OPTIONS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <AccessLengthField value={value} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
