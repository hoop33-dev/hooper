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

export async function generateLinkCode(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<{ code: string }>(
    "generate-link-code",
  );
  if (error) throw new Error(error.message);
  if (!data?.code) throw new Error("No code returned");
  return data.code;
}

export async function redeemLinkCode(code: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke("redeem-link-code", {
    body: { code },
  });
  if (error) throw new Error(error.message);
}
