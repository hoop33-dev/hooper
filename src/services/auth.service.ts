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

export async function checkUsernameAvailable(
  username: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: username,
  });
  if (error) return false;
  return data === true;
}

export async function signUp(params: SignUpParams): Promise<SignUpResult> {
  const available = await checkUsernameAvailable(params.username);
  if (!available) {
    return { ok: false, field: "username", error: "That username is already taken." };
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
          ? params.dateOfBirth.toISOString().split("T")[0]
          : null,
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { ok: false, field: "email", error: "An account with this email already exists." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
