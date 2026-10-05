import { AppPrompt } from "@/src/components/app/AppPrompt";
import { PlusIcon } from "@/src/components/icons";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { BtnLink } from "@/src/components/ui/Btn";
import { isLive } from "@/src/lib/household";
import { purchasesFor, visiblePurchases } from "@/src/lib/purchases";
import type { Result } from "@/src/lib/result";
import {
  getMyPurchases,
  getPaymentMethod,
} from "@/src/services/billing.service";
import { getMyChildren } from "@/src/services/children.service";
import { getMyProfile, type MyProfile } from "@/src/services/profile.service";
import type { MyChild, MyPackagePurchase } from "@hooper/db";
import { AddChildCard, EmptyHousehold } from "./AddChildCard";
import { NextChargesCard } from "./NextChargesCard";
import { RosterCard } from "./RosterCard";

export default async function HouseholdPage() {
  const [children, purchases, card, profile] = await Promise.all([
    getMyChildren(),
    getMyPurchases(),
    getPaymentMethod(),
    getMyProfile(),
  ]);
  const kids = children.ok ? children.data : [];
  const { purchasesError, byChild, self, householdPurchases } = household(
    kids,
    purchases,
    profile,
  );

  return (
    <>
      <TopBar
        title="Household"
        sub="One account, a package per child"
        right={
          <BtnLink href="/children/new" variant="primary" size="sm">
            <PlusIcon size={14} /> Add child
          </BtnLink>
        }
      />
      <PageBody>
        {!children.ok && (
          <div className="text-danger mb-4 text-[13px]">{children.error}</div>
        )}
        {children.ok && kids.length === 0 && !self && !purchasesError ? (
          <EmptyHousehold />
        ) : (
          <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.6fr_1fr]">
            <RosterCard
              self={self}
              childList={kids}
              purchasesByChild={byChild}
              purchasesError={purchasesError}
            />
            <div className="flex min-w-0 flex-col gap-3.5">
              <NextChargesCard
                purchases={householdPurchases}
                selfId={self?.profile.id ?? null}
                error={purchasesError}
                card={card.ok ? card.data : null}
              />
              <AddChildCard />
              <AppPrompt
                title="See their training"
                body="Sessions and progress live in the app"
                cta="Open"
              />
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}

/** Splits the account's purchases between the signed-in user and each child. */
function household(
  kids: MyChild[],
  purchases: Result<MyPackagePurchase[]>,
  profile: Result<MyProfile>,
) {
  // A failed lookup isn't "no packages": keep the error so the cards say
  // billing is unavailable instead of showing $0 and no renewals.
  const purchasesError = purchases.ok ? null : purchases.error;
  const paid = purchases.ok ? visiblePurchases(purchases.data) : [];
  const byChild = new Map(
    kids.map((c) => [c.profile_id, purchasesFor(paid, c.profile_id)]),
  );
  // The signed-in user joins the roster only when they're training too.
  const myPurchases = profile.ok ? purchasesFor(paid, profile.data.id) : [];
  const self =
    profile.ok && myPurchases.some((p) => isLive(p))
      ? { profile: profile.data, purchases: myPurchases }
      : null;
  const householdPurchases = [
    ...(self?.purchases ?? []),
    ...[...byChild.values()].flat(),
  ];

  return { purchasesError, byChild, self, householdPurchases };
}
