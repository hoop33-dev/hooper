import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { validateEmail } from "@/src/lib/validation";
import { redirect } from "next/navigation";
import { firstParam, loadPackage, type SearchParams } from "../../loadPackage";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const email = firstParam(params.email);
  if (validateEmail(email)) redirect("/signup");

  const loaded = await loadPackage(params.package);
  const pkg = loaded.kind === "ok" ? loaded.pkg : null;
  const slug = loaded.kind === "ok" ? loaded.slug : null;
  const fromSignIn = firstParam(params.from) === "signin";

  return (
    <AuthWrap wide={!!pkg}>
      <CheckoutLayout pkg={pkg} forWho="You">
        <VerifyForm email={email} slug={slug} fromSignIn={fromSignIn} />
      </CheckoutLayout>
    </AuthWrap>
  );
}
