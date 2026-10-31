import { AthleteBillingTab } from "@/src/components/portal/athletes/AthleteBillingTab";
import { getAthleteBilling } from "@/src/services/athleteBilling.service";
import { retryAthletePaymentAction } from "../../actions";

/** The Billing tab — read live from Stripe, so it streams in behind its
 * loading.tsx while the header is already up. */
export default async function AthleteBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAthleteBilling(id);
  return (
    <AthleteBillingTab
      billing={result.ok ? result.data : null}
      error={result.ok ? null : result.error}
      retryAction={retryAthletePaymentAction}
    />
  );
}
