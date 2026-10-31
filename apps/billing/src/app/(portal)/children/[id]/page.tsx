import { OpenAppButton } from "@/src/components/app/OpenAppButton";
import { MembershipList } from "@/src/components/billing/MembershipList";
import { CheckIcon } from "@/src/components/icons";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { cn } from "@/src/lib/cn";
import { fullName } from "@/src/lib/format";
import { purchasesFor, visiblePurchases } from "@/src/lib/purchases";
import { getMyPurchases } from "@/src/services/billing.service";
import { getMyChild } from "@/src/services/children.service";
import { getMyProfile } from "@/src/services/profile.service";
import { AppLink } from "@hooper/shared/next";
import { notFound, redirect } from "next/navigation";
import { ChildPasswordCard } from "./ChildPasswordCard";
import { ChildProfileForm } from "./ChildProfileForm";

type Tab = "memberships" | "profile";

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
  // Anything else (including the old ?tab=billing) lands on Memberships.
  const tab: Tab = sp.tab === "profile" ? "profile" : "memberships";

  const name = fullName(c.first_name, c.last_name) || c.username;
  const sub = `@${c.username}`;

  return (
    <>
      <TopBar
        title={name}
        sub={sub}
        back={{ href: "/children", label: "Children" }}
        crumbs={[{ label: "Children", href: "/children" }, { label: name }]}
        right={<OpenAppButton />}
      />
      <Tabs id={id} tab={tab} />
      <PageBody>
        <div
          className={cn(
            "flex flex-col gap-4",
            tab === "profile" ? "max-w-[720px]" : "max-w-[880px]",
          )}>
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
          {tab === "memberships" ? (
            <MembershipsTab
              childId={id}
              firstName={c.first_name || c.username}
            />
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

async function MembershipsTab({
  childId,
  firstName,
}: {
  childId: string;
  firstName: string;
}) {
  const [profile, purchases] = await Promise.all([
    getMyProfile(),
    getMyPurchases(),
  ]);
  if (!profile.ok) redirect("/start");
  return (
    <MembershipList
      purchases={
        purchases.ok
          ? purchasesFor(visiblePurchases(purchases.data), childId)
          : []
      }
      myProfileId={profile.data.id}
      whose={`${firstName}'s`}
      error={purchases.ok ? null : purchases.error}
      emptyHint={`Open your coach's package link and choose "For my child" → ${firstName} at checkout.`}
    />
  );
}

function Tabs({ id, tab }: { id: string; tab: Tab }) {
  const tabs: [Tab, string][] = [
    ["memberships", "Memberships"],
    ["profile", "Profile"],
  ];
  return (
    <div className="border-bp-border bg-bp-card flex shrink-0 gap-1.5 border-b px-4 py-3 md:px-7 md:py-3.5">
      {tabs.map(([t, label]) => (
        <AppLink
          key={t}
          href={
            t === "memberships" ? `/children/${id}` : `/children/${id}?tab=${t}`
          }
          aria-current={tab === t ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-[7px] text-[12.5px] font-semibold",
            tab === t
              ? "border-ink bg-ink text-white"
              : "border-bp-border text-bp-text2",
          )}>
          {label}
        </AppLink>
      ))}
    </div>
  );
}
