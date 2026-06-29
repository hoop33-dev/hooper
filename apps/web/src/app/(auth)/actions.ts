"use server";

import { signInWithPassword } from "@/src/services/auth.service";

type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    const message =
      result.error === "Invalid login credentials"
        ? "Incorrect email or password."
        : result.error;
    return { ok: false, error: message };
  }
  return { ok: true };
}
