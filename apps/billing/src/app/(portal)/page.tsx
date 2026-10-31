import { AppPrompt } from "@/src/components/app/AppPrompt";
import { OpenAppButton } from "@/src/components/app/OpenAppButton";
import { CreditIcon } from "@/src/components/icons";
import { AllPaid } from "@/src/components/overview/AllPaid";
import { ChildrenCard } from "@/src/components/overview/ChildrenCard";
import {
  InvoiceTable,
  InvoiceTableSkeleton,
} from "@/src/components/overview/InvoiceTable";
import { NeedsAttention } from "@/src/components/overview/NeedsAttention";
import { NextChargeCard } from "@/src/components/overview/NextChargeCard";
import { StatCards, type Stat } from "@/src/components/overview/StatCards";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { BtnLink } from "@/src/components/ui/Btn";
import { formatDate, formatMoney } from "@/src/lib/format";
import {
  chargeDays,
  membershipCounts,
  outstanding,
  whoFor,
} from "@/src/lib/overview";
import { visiblePurchases } from "@/src/lib/purchases";
import { getMyPurchases } from "@/src/services/billing.service";
import { getMyChildren } from "@/src/services/children.service";
import { getMyProfile } from "@/src/services/profile.service";
import type { MyPackagePurchase } from "@hooper/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";

/** Design OverviewB ("Cards"): what's owed, what's next, and invoices.
 * Activity isn't built yet. */
export default async function OverviewPage() {
  const [profile, purchases, children] = await Promise.all([
    getMyProfile(),
    getMyPurchases(),
    getMyChildren(),
  ]);
  if (!profile.ok) redirect("/start");
  const me = profile.data.id;
  const paid = purchases.ok ? visiblePurchases(purchases.data) : [];
  const owing = outstanding(paid, me);
  const days = chargeDays(paid, me);
  const kids = children.ok ? children.data : [];

  return (
    <>
      <TopBar
        title={`Hi, ${profile.data.firstName || profile.data.username || "there"}.`}
        sub={today()}
        right={
          <span className="hidden items-center gap-2 md:flex">
            <BtnLink href="/account" variant="ghost" size="sm">
              <CreditIcon size={14} className="text-bp-text2" /> Payment method
            </BtnLink>
            <OpenAppButton />
          </span>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-5">
          {!purchases.ok && (
            <div className="text-danger text-[13px]">
              Couldn&apos;t load memberships: {purchases.error}
            </div>
          )}
          <StatCards stats={stats(paid, owing, days, me)} />
          <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.55fr_1fr]">
            <div className="flex min-w-0 flex-col gap-[18px]">
              {owing.length > 0 ? (
                <NeedsAttention
                  items={owing.map((p) => ({
                    purchaseId: p.id,
                    title: p.package_name,
                    sub:
                      whoFor(p, me) === "You"
                        ? "Your membership"
                        : `${whoFor(p, me)}'s membership`,
                    amountCents: p.amount_cents,
                  }))}
                />
              ) : (
                <AllPaid nextDate={days[0] ? formatDate(days[0].date) : null} />
              )}
              <Suspense fallback={<InvoiceTableSkeleton />}>
                <InvoiceTable />
              </Suspense>
            </div>
            <div className="flex min-w-0 flex-col gap-3.5">
              <NextChargeCard days={days} />
              {kids.length > 0 && (
                <ChildrenCard childList={kids} purchases={paid} />
              )}
              <AppPrompt
                title="Get the app"
                body="Sessions, logging and messaging"
                cta="Open"
              />
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}

/** "Monday, 12 October 2026" in New Zealand time. */
function today() {
  return new Date().toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

function stats(
  paid: MyPackagePurchase[],
  owing: MyPackagePurchase[],
  days: ReturnType<typeof chargeDays>,
  me: string,
): Stat[] {
  const owed = owing.reduce((sum, p) => sum + p.amount_cents, 0);
  const counts = membershipCounts(paid, me);
  return [
    owing.length > 0
      ? {
          value: formatMoney(owed),
          label: "Outstanding",
          sub: `${owing.length} failed ${owing.length === 1 ? "charge" : "charges"}`,
          href: "/memberships",
          alert: true,
        }
      : {
          value: formatMoney(0),
          label: "Outstanding",
          sub: "All paid up",
          href: "/memberships",
        },
    {
      value: days[0] ? formatMoney(days[0].cents) : "—",
      label: "Next charge",
      sub: days[0] ? formatDate(days[0].date) : "Nothing scheduled",
      href: "/memberships",
    },
    {
      value: String(counts.total),
      label: "Memberships",
      sub: counts.byPerson || "None yet",
      href: "/memberships",
    },
  ];
}
