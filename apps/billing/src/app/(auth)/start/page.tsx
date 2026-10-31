import { AuthWrap, Hed } from "@/src/components/auth/AuthWrap";
import { ChoiceCard } from "@/src/components/auth/ChoiceCard";
import { CheckoutLayout } from "@/src/components/auth/PackageCard";
import { PackageUnavailable } from "@/src/components/auth/PackageUnavailable";
import { PlusIcon, UserIcon } from "@/src/components/icons";
import { withPackage } from "@/src/lib/routes";
import { loadPackage, type SearchParams } from "../loadPackage";

export default async function StartPage({
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
        <div className="max-w-[470px]">
          <Hed
            size="xl"
            sub={
              pkg
                ? `You're buying ${pkg.name}. Use your Hooper login or create one — you'll pay next.`
                : "One login for the Hooper app and billing."
            }>
            {pkg ? "Let’s get you in." : "Welcome to Hooper."}
          </Hed>
          <div className="flex flex-col gap-3">
            <ChoiceCard
              primary
              href={withPackage("/signup", slug)}
              icon={<PlusIcon size={19} />}
              title="I'm new to Hooper"
              sub={
                pkg
                  ? "Create an account, verify your email, then pay"
                  : "Create your Hooper account"
              }
              cta="Sign up"
            />
            <ChoiceCard
              href={withPackage("/signin", slug)}
              icon={<UserIcon size={19} />}
              title="I have an account"
              sub={
                pkg
                  ? "Sign in with your app login, then pay"
                  : "Sign in with your app login"
              }
              cta="Sign in"
            />
          </div>
        </div>
      </CheckoutLayout>
    </AuthWrap>
  );
}
