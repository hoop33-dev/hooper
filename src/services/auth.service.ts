import { getSupabaseClient } from "@/src/lib/supabase";
import { TablesInsert } from "@/src/lib/database.types";

export interface SignUpParams {
  email: string;
  password: string;
}

export async function signUpWithEmail({ email, password }: SignUpParams) {
  const supabase = getSupabaseClient();
  return supabase.auth.signUp({ email, password });
}

export async function verifyOtp(email: string, token: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.verifyOtp({ email, token, type: "signup" });
}

export async function resendOtp(email: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.resend({ type: "signup", email });
}

export async function createProfile(profile: TablesInsert<"profiles">) {
  const supabase = getSupabaseClient();
  return supabase.from("profiles").insert(profile);
}
