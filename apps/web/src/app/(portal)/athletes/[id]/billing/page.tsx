import { AthleteBillingTab } from "@/src/components/portal/athletes/AthleteBillingTab";
import { getAthleteBilling } from "@/src/services/athleteBilling.service";
import { listPackages } from "@/src/services/package.service";
import {
  changeAthleteMembershipAction,
  keepAthleteMembershipAction,
  retryAthletePaymentAction,
} from "../../actions";

/** The Billing tab — read live from Stripe, so it streams in behind its
 * loading.tsx while the header is already up. */
export default async function AthleteBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, packages] = await Promise.all([
    getAthleteBilling(id),
    listPackages(),
  ]);
  return (
    <AthleteBillingTab
      billing={result.ok ? result.data : null}
      error={result.ok ? null : result.error}
      // Only for adding a package; the tab still works without them.
      packages={packages.ok ? packages.data : []}
      retryAction={retryAthletePaymentAction}
      changeAction={changeAthleteMembershipAction}
      keepAction={keepAthleteMembershipAction}
    />
  );
}
