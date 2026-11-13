"use client";

import { FormError } from "@/src/components/auth/AuthWrap";
import { Btn } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { PASSWORD_MESSAGE } from "@hooper/shared";
import { useActionState } from "react";
import { setNewPasswordAction, type NewPasswordState } from "../../actions";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(
    setNewPasswordAction,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        dark
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_MESSAGE}
        required
      />
      <Field
        dark
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {state.error && <FormError>{state.error}</FormError>}
      <Btn type="submit" variant="primary" size="lg" full loading={pending}>
        Save password
      </Btn>
    </form>
  );
}
