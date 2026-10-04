"use client";

import { AuthLink, FormError } from "@/src/components/auth/AuthWrap";
import { Btn } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { withPackage } from "@/src/lib/routes";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type SignInState } from "../actions";

export function SignInForm({ slug }: { slug: string | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signInAction,
    { username: "" },
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {slug && <input type="hidden" name="package" value={slug} />}
      <Field
        dark
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={state.username}
        required
      />
      <Field
        dark
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Link
        href={withPackage("/reset", slug)}
        className="text-orange -mt-1 self-start text-[13px] font-semibold">
        Forgot password
      </Link>
      {state.error && <FormError>{state.error}</FormError>}
      <Btn type="submit" variant="primary" size="lg" full loading={pending}>
        {slug ? "Sign in and continue" : "Sign in"}
      </Btn>
      <div className="mt-1.5 text-center text-[13.5px] text-white/60">
        {slug ? "New to Hooper?" : "New here?"}{" "}
        <AuthLink href={withPackage("/signup", slug)}>
          Create an account
        </AuthLink>
      </div>
    </form>
  );
}
