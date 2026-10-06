"use client";

import { AuthLink, FormError, Sec } from "@/src/components/auth/AuthWrap";
import { Btn } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { withPackage } from "@/src/lib/routes";
import { PASSWORD_MESSAGE } from "@hooper/shared";
import { useActionState } from "react";
import { signUpAction, type SignUpState } from "../actions";

const INITIAL: SignUpState = {
  values: { firstName: "", lastName: "", username: "", email: "" },
  errors: {},
};

export function SignUpForm({ slug }: { slug: string | null }) {
  const [state, action, pending] = useActionState(signUpAction, INITIAL);
  const { values, errors } = state;

  return (
    <form action={action} noValidate>
      {slug && <input type="hidden" name="package" value={slug} />}
      <Sec n={1} title="Your details">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              dark
              label="First name"
              name="firstName"
              autoComplete="given-name"
              defaultValue={values.firstName}
              error={errors.firstName}
            />
            <Field
              dark
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              defaultValue={values.lastName}
              error={errors.lastName}
            />
          </div>
          <Field
            dark
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={values.username}
            error={errors.username}
            hint="You'll use this to sign in to the app and billing"
          />
          <Field
            dark
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values.email}
            error={errors.email}
            hint="We'll send a code to verify it"
          />
          <Field
            dark
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            hint={PASSWORD_MESSAGE}
          />
          <div className="text-[13px] text-white/60">
            Already have an account?{" "}
            <AuthLink href={withPackage("/signin", slug)}>
              Sign in{slug ? " to buy" : ""}
            </AuthLink>
          </div>
        </div>
      </Sec>
      {state.formError && (
        <div className="mb-4">
          <FormError>{state.formError}</FormError>
        </div>
      )}
      <Btn type="submit" variant="primary" size="lg" full loading={pending}>
        Continue
      </Btn>
    </form>
  );
}
