import { AuthWrap, Hed } from "@/src/components/auth/AuthWrap";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { PackageUnavailable } from "@/src/components/auth/PackageUnavailable";
import { SmartphoneIcon } from "@/src/components/icons";
import { loadPackage, type SearchParams } from "../loadPackage";
import { SignInForm } from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const loaded = await loadPackage((await searchParams).package);
  if (loaded.kind === "unavailable") return <PackageUnavailable />;
  const pkg = loaded.kind === "ok" ? loaded.pkg : null;
  const slug = loaded.kind === "ok" ? loaded.slug : null;

  return (
    <AuthWrap wide={!!pkg}>
      <CheckoutLayout pkg={pkg} forWho="—">
        <div className="max-w-[430px]">
          <Hed
            sub={
              pkg
                ? "Sign in with your Hooper login. You'll confirm and pay next."
                : "Same login as the Hooper app. Manage your packages and payments here."
            }>
            {pkg ? "Sign in to buy." : "Welcome back."}
          </Hed>
          <SignInForm slug={slug} />
          {!pkg && (
            <div className="mt-[34px] flex items-center gap-3 rounded-xl border border-white/10 px-[18px] py-4">
              <SmartphoneIcon size={18} className="text-orange shrink-0" />
              <div className="text-[12.5px] leading-[1.45] text-white/60">
                Training happens in the app. This portal is for packages and
                payments.
              </div>
            </div>
          )}
        </div>
      </CheckoutLayout>
    </AuthWrap>
  );
}
