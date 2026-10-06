"use server";

import { withPackage } from "@/src/lib/routes";
import {
  validateEmail,
  validateSignUp,
  type FieldErrors,
  type SignUpFields,
} from "@/src/lib/validation";
import {
  resendSignupOtp,
  sendPasswordReset,
  signInWithUsername,
  signOut,
  signUp,
  updatePassword,
  verifySignupOtp,
} from "@/src/services/auth.service";
import { validatePassword } from "@hooper/shared";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function packageFrom(formData: FormData): string | null {
  return str(formData, "package") || null;
}

function verifyUrl(email: string, pkg: string | null, from?: string) {
  const qs = new URLSearchParams({ email });
  if (from) qs.set("from", from);
  return withPackage(`/signup/verify?${qs.toString()}`, pkg);
}

// ── Sign up ───────────────────────────────────────────────────

export type SignUpState = {
  values: Omit<SignUpFields, "password">;
  errors: FieldErrors<keyof SignUpFields>;
  formError?: string;
};

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const fields: SignUpFields = {
    firstName: str(formData, "firstName").trim(),
    lastName: str(formData, "lastName").trim(),
    username: str(formData, "username").trim().toLowerCase(),
    email: str(formData, "email").trim().toLowerCase(),
    password: str(formData, "password"),
  };
  const { password: _pw, ...values } = fields;

  const errors = validateSignUp(fields);
  if (Object.keys(errors).length > 0) return { values, errors };

  const res = await signUp(fields);
  if (!res.ok) {
    const { field, message } = res.error;
    return field
      ? { values, errors: { [field]: message } }
      : { values, errors: {}, formError: message };
  }

  redirect(verifyUrl(fields.email, packageFrom(formData)));
}

// ── Email verification ────────────────────────────────────────

export async function verifyCodeAction(
  email: string,
  code: string,
  pkg: string | null,
): Promise<{ error: string }> {
  const res = await verifySignupOtp(email, code);
  if (!res.ok) return { error: res.error };
  redirect(pkg ? withPackage("/checkout?verified=1", pkg) : "/welcome");
}

export async function resendCodeAction(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await resendSignupOtp(email);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

// ── Sign in ───────────────────────────────────────────────────

export type SignInState = { username: string; error?: string };

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const username = str(formData, "username").trim();
  const password = str(formData, "password");
  const pkg = packageFrom(formData);
  if (!username || !password) {
    return { username, error: "Enter your username and password." };
  }

  const res = await signInWithUsername(username, password);
  if (!res.ok) return { username, error: res.error };

  if (res.data.kind === "needs_verification") {
    // The signup code has likely expired by now — send a fresh one.
    await resendSignupOtp(res.data.email);
    redirect(verifyUrl(res.data.email, pkg, "signin"));
  }
  redirect(pkg ? withPackage("/checkout", pkg) : "/account");
}

export async function signOutAction(formData: FormData): Promise<void> {
  await signOut();
  redirect(withPackage("/start", packageFrom(formData)));
}

// ── Password reset ────────────────────────────────────────────

export type ResetState = { email: string; sent: boolean; error?: string };

export async function sendResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = str(formData, "email").trim().toLowerCase();
  const invalid = validateEmail(email);
  if (invalid) return { email, sent: false, error: invalid };

  const res = await sendPasswordReset(email);
  // Report success either way — never reveal whether an email is registered.
  if (!res.ok && res.error.toLowerCase().includes("rate")) {
    return {
      email,
      sent: false,
      error: "Too many requests. Try again shortly.",
    };
  }
  return { email, sent: true };
}

export type NewPasswordState = { error?: string };

export async function setNewPasswordAction(
  _prev: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  const invalid = validatePassword(password);
  if (invalid) return { error: invalid };
  if (password !== confirm) return { error: "Passwords don't match." };

  const res = await updatePassword(password);
  if (!res.ok) return { error: res.error };
  redirect("/account");
}
