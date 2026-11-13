import { AuthWrap, DarkCard, Hed } from "@/src/components/auth/AuthWrap";
import { BtnLink } from "@/src/components/ui/Btn";
import { hasSession } from "@/src/services/auth.service";
import { firstParam, type SearchParams } from "../../loadPackage";
import { NewPasswordForm } from "./NewPasswordForm";

export default async function ResetConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const failed = firstParam((await searchParams).error) !== "";
  const signedIn = !failed && (await hasSession());

  if (!signedIn) {
    return (
      <AuthWrap>
        <Hed sub="Reset links expire after a while and only work in the browser you requested them from.">
          Link expired.
        </Hed>
        <DarkCard className="p-[18px]">
          <BtnLink href="/reset" variant="primary" size="lg" full>
            Send a new link
          </BtnLink>
        </DarkCard>
      </AuthWrap>
    );
  }

  return (
    <AuthWrap>
      <Hed sub="Choose a new password for the Hooper app and billing.">
        New password.
      </Hed>
      <NewPasswordForm />
    </AuthWrap>
  );
}
