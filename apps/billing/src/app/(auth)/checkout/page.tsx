import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { PackageUnavailable } from "@/src/components/auth/PackageUnavailable";
import { getMyChildren } from "@/src/services/children.service";
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

  const [profile, children] = await Promise.all([
    getMyProfile(),
    getMyChildren(),
  ]);
  if (!profile.ok) redirect(`/start?package=${loaded.slug}`);

  return (
    <AuthWrap wide>
      <CheckoutClient
        slug={loaded.slug}
        pkg={loaded.pkg}
        profile={profile.data}
        initialChildren={children.ok ? children.data : []}
        justVerified={firstParam(params.verified) === "1"}
      />
    </AuthWrap>
  );
}
