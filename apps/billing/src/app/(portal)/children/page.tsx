import { AppPrompt } from "@/src/components/app/AppPrompt";
import { PlusIcon } from "@/src/components/icons";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { BtnLink } from "@/src/components/ui/Btn";
import { purchasesFor, visiblePurchases } from "@/src/lib/purchases";
import {
  getMyPurchases,
  getPaymentMethod,
} from "@/src/services/billing.service";
import { getMyChildren } from "@/src/services/children.service";
import { AddChildCard, EmptyHousehold } from "./AddChildCard";
import { NextChargesCard } from "./NextChargesCard";
import { RosterCard } from "./RosterCard";

export default async function HouseholdPage() {
  const [children, purchases, card] = await Promise.all([
    getMyChildren(),
    getMyPurchases(),
    getPaymentMethod(),
  ]);
  const kids = children.ok ? children.data : [];
  const paid = purchases.ok ? visiblePurchases(purchases.data) : [];
  const byChild = new Map(
    kids.map((c) => [c.profile_id, purchasesFor(paid, c.profile_id)]),
  );
  const householdPurchases = [...byChild.values()].flat();

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
        {children.ok && kids.length === 0 ? (
          <EmptyHousehold />
        ) : (
          <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.6fr_1fr]">
            <RosterCard childList={kids} purchasesByChild={byChild} />
            <div className="flex min-w-0 flex-col gap-3.5">
              <NextChargesCard
                purchases={householdPurchases}
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
