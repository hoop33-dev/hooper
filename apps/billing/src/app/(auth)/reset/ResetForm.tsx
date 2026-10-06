"use client";

import { DarkCard, FormError, Hed } from "@/src/components/auth/AuthWrap";
import { MailIcon } from "@/src/components/icons";
import { Btn, BtnLink } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { withPackage } from "@/src/lib/routes";
import { AppLink } from "@hooper/shared/next";
import { useActionState } from "react";
import { sendResetAction, type ResetState } from "../actions";

export function ResetForm({ slug }: { slug: string | null }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    sendResetAction,
    { email: "", sent: false },
  );
  const signInHref = withPackage("/signin", slug);

  if (state.sent) {
    return (
      <>
        <Hed sub="If that email has a Hooper account, a reset link is on its way. Open it on this device.">
          Link sent.
        </Hed>
        <div className="flex flex-col gap-4">
          <DarkCard className="flex items-center gap-3.5 p-[22px]">
            <MailIcon size={20} className="text-orange shrink-0" />
            <div className="text-[13.5px] text-white/60">
              Sent to{" "}
              <span className="font-semibold text-white">{state.email}</span>
            </div>
          </DarkCard>
          <BtnLink href={signInHref} variant="ghostDark" size="lg" full>
            Back to sign in
          </BtnLink>
        </div>
      </>
    );
  }

  return (
    <>
      <Hed sub="We’ll email you a link to set a new one.">Reset password.</Hed>
      <form action={action} className="flex flex-col gap-4">
        <Field
          dark
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
        {state.error && <FormError>{state.error}</FormError>}
        <Btn type="submit" variant="primary" size="lg" full loading={pending}>
          Send reset link
        </Btn>
        <AppLink
          href={signInHref}
          className="text-center text-[13.5px] text-white/60">
          Back to sign in
        </AppLink>
      </form>
    </>
  );
}
