import { supabase } from "@/src/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { RoleId } from "@/src/constants/roles";

export type SignUpParams = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  mobile: string;
  regionSlug: string;
  password: string;
  role: RoleId;
  dateOfBirth?: Date | null;
};

export type SignUpResult =
  | { ok: true }
  | { ok: false; field?: "username" | "email"; error: string };

// Returns true (available), false (taken), or null (RPC error — treat as retryable)
export async function checkUsernameAvailable(
  username: string,
): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: username,
  });
  if (error) return null;
  return data === true;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type SignInResult =
  | { ok: true; requiresVerification: false; session: Session }
  | { ok: true; requiresVerification: true; session: Session; email: string }
  | { ok: false; error: string };

export async function signInWithUsername(
  username: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await supabase.functions.invoke(
    "signin-with-username",
    { body: { username, password } },
  );

  if (error) {
    return { ok: false, error: "Unable to sign in. Please try again." };
  }

  if (!data.ok) {
    return { ok: false, error: data.error ?? "Invalid username or password." };
  }

  const { data: { session } } = await supabase.auth.setSession(data.session);

  if (!session) {
    return { ok: false, error: "Unable to sign in. Please try again." };
  }

  if (data.requires_verification) {
    return { ok: true, requiresVerification: true, session, email: data.email_for_otp };
  }
  return { ok: true, requiresVerification: false, session };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<VerifyOtpResult> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired")) return { ok: false, error: "Code expired. Request a new one." };
    return { ok: false, error: "Invalid code. Please try again." };
  }
  return { ok: true };
}

export type ResendOtpResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function resendVerificationOtp(
  email: string,
): Promise<ResendOtpResult> {
  const { error } = await supabase.auth.resend({ email, type: "signup" });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate")) {
      const match = error.message.match(/(\d+)/);
      return {
        ok: false,
        error: "Too many requests. Please wait before resending.",
        retryAfterSeconds: match ? parseInt(match[1], 10) : 60,
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function signUp(params: SignUpParams): Promise<SignUpResult> {
  const available = await checkUsernameAvailable(params.username);
  if (available === null) {
    return {
      ok: false,
      error: "Unable to verify username availability. Please try again.",
    };
  }
  if (!available) {
    return {
      ok: false,
      field: "username",
      error: "That username is already taken.",
    };
  }

  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        username: params.username.toLowerCase(),
        mobile: params.mobile,
        region_slug: params.regionSlug,
        role: params.role,
        date_of_birth: params.dateOfBirth
          ? formatLocalDate(params.dateOfBirth)
          : null,
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return {
        ok: false,
        field: "email",
        error: "An account with this email already exists.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
