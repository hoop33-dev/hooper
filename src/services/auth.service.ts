import type { RoleId } from "@/src/constants/roles";
import { supabase } from "@/src/lib/supabase";
import type { Session } from "@supabase/supabase-js";

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
  | { ok: true; requiresVerification: true; email: string }
  | { ok: true; requiresVerification: false; session: Session }
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

  // Unverified account: the edge function issues no session. The client
  // proceeds to the verify-email screen and gets a session from verifyOtp.
  if (data.requires_verification) {
    return { ok: true, requiresVerification: true, email: data.email_for_otp };
  }

  const {
    data: { session },
  } = await supabase.auth.setSession(data.session);

  if (!session) {
    return { ok: false, error: "Unable to sign in. Please try again." };
  }

  return { ok: true, requiresVerification: false, session };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export type VerifyOtpResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired"))
      return { ok: false, error: "Code expired. Request a new one." };
    return { ok: false, error: "Invalid code. Please try again." };
  }
  if (!data.session) {
    return { ok: false, error: "Verification failed. Please try again." };
  }
  return { ok: true, session: data.session };
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

export type PasswordResetResult = { ok: true } | { ok: false; error: string };

export async function sendPasswordResetEmail(
  email: string,
): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "hooper://reset-password",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function exchangeResetCode(
  code: string,
): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { ok: false, error: "Reset link is invalid or expired." };
  return { ok: true };
}

export async function updatePassword(
  newPassword: string,
): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type SendSecurityCodeResult =
  | { ok: true; maskedEmail: string }
  | { ok: false; error: string };

export async function sendSecurityCode(): Promise<SendSecurityCodeResult> {
  const { data, error } = await supabase.functions.invoke("send-security-code");
  if (error) {
    return {
      ok: false,
      error: "Unable to send verification code. Please try again.",
    };
  }
  if (!data?.ok) {
    return {
      ok: false,
      error: data?.error ?? "Unable to send verification code.",
    };
  }
  return { ok: true, maskedEmail: data.maskedEmail };
}

export type VerifySecurityCodeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifySecurityCode(
  email: string,
  token: string,
): Promise<VerifySecurityCodeResult> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired")) {
      return { ok: false, error: "Code expired. Request a new one." };
    }
    return { ok: false, error: "Invalid code. Please try again." };
  }
  return { ok: true };
}

// Notifies an existing account owner when a sign-up is attempted with their
// email. Delegates to an edge function that checks existence server-side and
// sends via Resend, so neither the check nor the email leaks through the client.
// Failures are swallowed — this must not change the sign-up result.
async function sendAccountAlreadyExistsEmail(email: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-account-exists-email", {
      body: { email },
    });
  } catch {
    // best-effort notification
  }
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

  const { data, error } = await supabase.auth.signUp({
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
      await sendAccountAlreadyExistsEmail(params.email);
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  // With email confirmations enabled, GoTrue hides duplicate sign-ups instead
  // of erroring: it returns a fabricated user with an empty `identities` array.
  // Treat that as "email already in use" and notify the real account owner.
  if (data?.user && (data.user.identities?.length ?? 0) === 0) {
    await sendAccountAlreadyExistsEmail(params.email);
    return { ok: true };
  }

  // Supabase's signUp can persist a session for the not-yet-confirmed user,
  // which would let a quit/reopen bypass the OTP step. Drop it locally so the
  // only route to a session is verifyOtp.
  await supabase.auth.signOut({ scope: "local" });

  return { ok: true };
}
