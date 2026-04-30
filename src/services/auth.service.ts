import { supabase } from "@/src/lib/supabase";
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

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid") || msg.includes("credentials")) {
      return { ok: false, error: "Incorrect email or password." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
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
