import { CheckIcon } from "@/src/components/icons";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { cn } from "@/src/lib/cn";
import { fullName } from "@/src/lib/format";
import { purchasesFor, visiblePurchases } from "@/src/lib/purchases";
import {
  getMyPurchases,
  getPaymentMethod,
} from "@/src/services/billing.service";
import { getMyChild } from "@/src/services/children.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChildBillingTab } from "./ChildBillingTab";
import { ChildPasswordCard } from "./ChildPasswordCard";
import { ChildProfileForm } from "./ChildProfileForm";

type Tab = "billing" | "profile";

export default async function ChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; created?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const child = await getMyChild(id);
  if (!child.ok) throw new Error(child.error);
  if (!child.data) notFound();
  const c = child.data;
  const tab: Tab = sp.tab === "profile" ? "profile" : "billing";

  const name = fullName(c.first_name, c.last_name) || c.username;
  const sub = `@${c.username}`;

  return (
    <>
      <TopBar
        title={name}
        sub={sub}
        back={{ href: "/children", label: "Children" }}
        crumbs={[{ label: "Children", href: "/children" }, { label: name }]}
      />
      <Tabs id={id} tab={tab} />
      <PageBody>
        <div className="flex max-w-[720px] flex-col gap-4">
          {sp.created === "1" && (
            <div
              role="status"
              className="border-green/25 bg-green/10 text-bp-text1 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px]">
              <CheckIcon size={15} className="text-green" />
              <span>
                <b>{c.first_name || "Their"}&apos;s login is ready.</b> They
                sign in to the Hooper app as <b>@{c.username}</b>.
              </span>
            </div>
          )}
          {tab === "billing" ? (
            <BillingTab childId={id} firstName={c.first_name || c.username} />
          ) : (
            <>
              <ChildProfileForm child={c} />
              {!c.has_real_email && (
                <ChildPasswordCard
                  childId={id}
                  firstName={c.first_name || c.username}
                />
              )}
            </>
          )}
        </div>
      </PageBody>
    </>
  );
}

async function BillingTab({
  childId,
  firstName,
}: {
  childId: string;
  firstName: string;
}) {
  const [purchases, card] = await Promise.all([
    getMyPurchases(),
    getPaymentMethod(),
  ]);
  return (
    <ChildBillingTab
      firstName={firstName}
      purchases={
        purchases.ok
          ? purchasesFor(visiblePurchases(purchases.data), childId)
          : []
      }
      error={purchases.ok ? null : purchases.error}
      card={card.ok ? card.data : null}
    />
  );
}

function Tabs({ id, tab }: { id: string; tab: Tab }) {
  const tabs: [Tab, string][] = [
    ["billing", "Billing"],
    ["profile", "Profile"],
  ];
  return (
    <div className="border-bp-border bg-bp-card flex shrink-0 gap-1.5 border-b px-4 py-3 md:px-7 md:py-3.5">
      {tabs.map(([t, label]) => (
        <Link
          key={t}
          href={
            t === "billing" ? `/children/${id}` : `/children/${id}?tab=${t}`
          }
          aria-current={tab === t ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-[7px] text-[12.5px] font-semibold",
            tab === t
              ? "border-ink bg-ink text-white"
              : "border-bp-border text-bp-text2",
          )}>
          {label}
        </Link>
      ))}
    </div>
  );
}
