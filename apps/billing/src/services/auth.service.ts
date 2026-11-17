import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";

type SignInResponse = {
  ok: boolean;
  error?: string;
  session?: { access_token: string; refresh_token: string } | null;
  requires_verification?: boolean;
  email_for_otp?: string;
};

export type SignInOutcome =
  | { kind: "signed_in" }
  | { kind: "needs_verification"; email: string };

/** Sign in with username + password via the signin-with-username edge
 * function (any role — the billing portal isn't coach-only). An account
 * whose email was never verified gets no session; the caller routes to the
 * verify step, where the OTP completes sign-in. */
export async function signInWithUsername(
  username: string,
  password: string,
): Promise<Result<SignInOutcome>> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signin-with-username`;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let data: SignInResponse;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ username, password }),
    });
    data = await res.json();
  } catch {
    return err("Unable to reach the server. Please try again.");
  }

  if (!data.ok) return err(data.error ?? "Invalid username or password.");

  if (data.requires_verification && data.email_for_otp) {
    return ok({ kind: "needs_verification", email: data.email_for_otp });
  }
  if (!data.session) return err("Unable to sign in. Please try again.");

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (error) return err(error.message);
  return ok({ kind: "signed_in" });
}

export type SignUpParams = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export type SignUpError = { field?: "username" | "email"; message: string };

/** Creates a Hooper account (role player). Mirrors the mobile app's signUp
 * (packages/api auth.service): username pre-check, duplicate-email handling
 * that never reveals whether an email is registered, and no session until the
 * email OTP is verified. */
export async function signUp(
  params: SignUpParams,
): Promise<{ ok: true } | { ok: false; error: SignUpError }> {
  const supabase = await createClient();

  const { data: available, error: availabilityError } = await supabase.rpc(
    "is_username_available",
    { p_username: params.username },
  );
  if (availabilityError) {
    return {
      ok: false,
      error: {
        message: "Unable to verify username availability. Please try again.",
      },
    };
  }
  if (!available) {
    return {
      ok: false,
      error: { field: "username", message: "That username is already taken." },
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
        role: "player",
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      await sendAccountAlreadyExistsEmail(params.email);
      return { ok: true };
    }
    return { ok: false, error: { message: error.message } };
  }

  // With email confirmations on, GoTrue hides duplicate sign-ups behind a
  // fabricated user with no identities. Treat it like success (the verify
  // step just never gets a valid code) and notify the real owner.
  if (data?.user && (data.user.identities?.length ?? 0) === 0) {
    await sendAccountAlreadyExistsEmail(params.email);
    return { ok: true };
  }

  // Never hold a session for an unverified user — verifyOtp is the only way in.
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true };
}

async function sendAccountAlreadyExistsEmail(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.functions.invoke("send-account-exists-email", {
      body: { email },
    });
  } catch {
    // best-effort notification
  }
}

/** Confirms the 6-digit signup code; on success the session cookie is set. */
export async function verifySignupOtp(
  email: string,
  token: string,
): Promise<Result<void>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) {
    return err(
      error.message.toLowerCase().includes("expired")
        ? "Code expired. Request a new one."
        : "Invalid code. Please try again.",
    );
  }
  if (!data.session) return err("Verification failed. Please try again.");
  return ok(undefined);
}

export async function resendSignupOtp(email: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ email, type: "signup" });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate")) {
      return err("Too many requests. Please wait a minute before resending.");
    }
    return err(error.message);
  }
  return ok(undefined);
}

/** Emails a recovery link that lands on /reset/callback. The PKCE verifier is
 * stored in this browser's cookies, so the link must be opened here. */
export async function sendPasswordReset(email: string): Promise<Result<void>> {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_BILLING_APP_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset/callback`,
  });
  if (error) return err(error.message);
  return ok(undefined);
}

export async function exchangeRecoveryCode(
  code: string,
): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return err("This reset link is invalid or has expired.");
  return ok(undefined);
}

export async function updatePassword(password: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function signOut(): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return err(error.message);
  return ok(undefined);
}

/** True when a verified session cookie is present. */
export async function hasSession(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}
