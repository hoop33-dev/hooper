import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { getPaymentMethod } from "@/src/services/billing.service";
import { getMyProfile } from "@/src/services/profile.service";
import { redirect } from "next/navigation";
import { AppCard } from "./AppCard";
import { DetailsCard } from "./DetailsCard";
import { PaymentMethodCard } from "./PaymentMethodCard";

/** Set by ./card-return after a redirected card update. */
const CARD_RESULT = {
  updated: { tone: "ok", text: "Card updated." },
  failed: { tone: "error", text: "Couldn't save that card. Please try again." },
} as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const { card: cardResult } = await searchParams;
  const [profile, card] = await Promise.all([
    getMyProfile(),
    getPaymentMethod(),
  ]);
  if (!profile.ok) redirect("/start");

  return (
    <>
      <TopBar title="Account" sub="Your details and payment method" />
      <PageBody>
        <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.5fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <DetailsCard profile={profile.data} />
          </div>
          <div className="flex min-w-0 flex-col gap-3.5">
            <PaymentMethodCard
              card={card.ok ? card.data : null}
              error={card.ok ? null : card.error}
              initialMessage={
                cardResult === "updated" || cardResult === "failed"
                  ? CARD_RESULT[cardResult]
                  : null
              }
            />
            <AppCard />
          </div>
        </div>
      </PageBody>
    </>
  );
}
