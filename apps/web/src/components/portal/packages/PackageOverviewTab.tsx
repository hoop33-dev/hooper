"use client";

import { cn } from "@/src/lib/cn";
import { pickPricing } from "@/src/lib/packages";
import { AppLink } from "@hooper/shared/next";
import { DetailError, detailCardClass } from "../ui/DetailListCard";
import { coachName } from "./PackageAtoms";
import {
  ActiveBuyersCard,
  PackageLinkCard,
  PricingCard,
} from "./PackageDetailCards";
import { usePackageDetailContext } from "./PackageDetailShell";

/** Names of everything in the package at a glance; editing happens on the
 * Contents tab. */
function IncludedCard() {
  const { state, basePath } = usePackageDetailContext();
  const { programs, teams, coaches } = state.local;
  const rows: [string, string[]][] = [
    ["Programs", programs.map((p) => p.name)],
    ["Teams", teams.map((t) => t.name)],
    ["Coaches", coaches.map(coachName)],
  ];
  return (
    <div className={detailCardClass}>
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-portal-text1 text-sm font-bold">
          What&apos;s included
        </h2>
        <AppLink
          href={`${basePath}/contents`}
          className="text-portal-orange text-[13px] font-semibold">
          Manage
        </AppLink>
      </div>
      {rows.map(([label, names]) => (
        <div
          key={label}
          className="border-portal-border flex gap-4 border-b px-5 py-3 last:border-b-0">
          <div className="text-portal-text3 w-[76px] flex-shrink-0 pt-0.5 text-[11px] font-semibold tracking-widest uppercase">
            {label}
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 text-[13px] leading-normal",
              names.length ? "text-portal-text1" : "text-portal-text3",
            )}>
            {names.length ? names.join(", ") : "None"}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PackageOverviewTab() {
  const { state, buyers } = usePackageDetailContext();
  const { local } = state;
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <DetailError error={state.error} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <PackageLinkCard slug={local.slug} />
        <ActiveBuyersCard
          count={buyers?.active ?? null}
          billingType={local.billing_type}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <PricingCard
          pricing={pickPricing(local)}
          activeBuyers={buyers?.active ?? null}
          onSave={state.savePricing}
        />
        <IncludedCard />
      </div>
    </div>
  );
}
