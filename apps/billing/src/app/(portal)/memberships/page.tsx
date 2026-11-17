import { OpenAppButton } from "@/src/components/app/OpenAppButton";
import { MembershipList } from "@/src/components/billing/MembershipList";
import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { purchasesFor, visiblePurchases } from "@/src/lib/purchases";
import { getMyPurchases } from "@/src/services/billing.service";
import { getMyProfile } from "@/src/services/profile.service";
import { redirect } from "next/navigation";

/** The signed-in user's own memberships. Children's live on their pages. */
export default async function MembershipsPage() {
  const [profile, purchases] = await Promise.all([
    getMyProfile(),
    getMyPurchases(),
  ]);
  if (!profile.ok) redirect("/start");
  const me = profile.data.id;

  return (
    <>
      <TopBar
        title="Memberships"
        sub="Your packages. Stop any time"
        right={<OpenAppButton />}
      />
      <PageBody>
        <MembershipList
          purchases={
            purchases.ok
              ? purchasesFor(visiblePurchases(purchases.data), me)
              : []
          }
          myProfileId={me}
          whose="Your"
          error={purchases.ok ? null : purchases.error}
          emptyHint="Packages you buy from a coach show up here."
        />
      </PageBody>
    </>
  );
}
