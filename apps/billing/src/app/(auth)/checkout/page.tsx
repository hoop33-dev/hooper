import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { PackageUnavailable } from "@/src/components/auth/PackageUnavailable";
import { fullName } from "@/src/lib/format";
import { getMyProfile } from "@/src/services/profile.service";
import { redirect } from "next/navigation";
import { firstParam, loadPackage, type SearchParams } from "../loadPackage";
import { CheckoutClient } from "./CheckoutClient";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const loaded = await loadPackage(params.package);
  if (loaded.kind === "none") redirect("/account");
  if (loaded.kind === "unavailable") return <PackageUnavailable />;

  const profile = await getMyProfile();
  if (!profile.ok) redirect(`/start?package=${loaded.slug}`);
  const name =
    fullName(profile.data.firstName, profile.data.lastName) ||
    profile.data.username ||
    "You";

  return (
    <AuthWrap wide>
      <CheckoutLayout pkg={loaded.pkg} forWho={name}>
        <CheckoutClient
          slug={loaded.slug}
          priceCents={loaded.pkg.price_cents}
          profile={profile.data}
          justVerified={firstParam(params.verified) === "1"}
        />
      </CheckoutLayout>
    </AuthWrap>
  );
}
