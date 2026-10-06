"use server";

import { signInWithUsername, signOut as serviceSignOut } from "@/src/services/auth.service";
import { redirect } from "next/navigation";

type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(
  username: string,
  password: string,
): Promise<SignInResult> {
  const result = await signInWithUsername(username, password);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await serviceSignOut();
  redirect("/");
}
