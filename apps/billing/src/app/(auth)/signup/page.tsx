import { AuthWrap, Hed } from "@/src/components/auth/AuthWrap";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { PackageUnavailable } from "@/src/components/auth/PackageUnavailable";
import { loadPackage, type SearchParams } from "../loadPackage";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage({
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
      <CheckoutLayout pkg={pkg} forWho="You">
        <Hed
          sub={
            pkg
              ? "Create your Hooper account, verify your email, then pay."
              : "One account for the app and billing."
          }>
          {pkg ? "Get started." : "Create your account."}
        </Hed>
        <SignUpForm slug={slug} />
      </CheckoutLayout>
    </AuthWrap>
  );
}
