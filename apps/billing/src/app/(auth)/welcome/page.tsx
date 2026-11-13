import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { parsePackageParam } from "@/src/lib/routes";
import { firstParam, type SearchParams } from "../loadPackage";
import { WelcomeClient } from "./WelcomeClient";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const purchase = firstParam(params.purchase);
  return (
    <AuthWrap>
      <WelcomeClient
        purchaseId={UUID.test(purchase) ? purchase : null}
        slug={parsePackageParam(params.package)}
        // Stripe appends redirect_status when 3-D Secure etc. bounced the
        // user out and back.
        redirectFailed={firstParam(params.redirect_status) === "failed"}
      />
    </AuthWrap>
  );
}
