import { supabase } from "@/src/lib/supabase";

export type ChildSummary = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type CreateChildInput = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  dateOfBirth: Date | null;
  regionSlug?: string | null;
  mobile?: string | null;
};

export type CreateChildResult =
  | { ok: true; child: ChildSummary }
  | { ok: false; field?: "username" | "password"; error: string };

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function createChildAccount(
  input: CreateChildInput,
): Promise<CreateChildResult> {
  const { data, error } = await supabase.functions.invoke(
    "create-child-account",
    {
      body: {
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        password: input.password,
        dateOfBirth: input.dateOfBirth
          ? formatLocalDate(input.dateOfBirth)
          : null,
        regionSlug: input.regionSlug ?? null,
        mobile: input.mobile ?? null,
      },
    },
  );

  if (error) {
    return { ok: false, error: "Unable to create child account. Please try again." };
  }

  if (!data.ok) {
    const field = data.field as "username" | "password" | undefined;
    return { ok: false, field, error: data.error ?? "Unable to create child account." };
  }

  return {
    ok: true,
    child: {
      id: data.child.id,
      firstName: data.child.firstName,
      lastName: data.child.lastName,
      username: data.child.username,
    },
  };
}

export async function listChildren(): Promise<ChildSummary[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  // Get caller's profile id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", session.session.user.id)
    .single();

  if (!profile) return [];

  // Query via RLS-protected join (profiles_select_children policy covers children rows)
  const { data, error } = await supabase
    .from("parent_player_links")
    .select(
      "player_profile_id, profiles!player_profile_id(id, first_name, last_name, username)",
    )
    .eq("parent_profile_id", profile.id)
    .eq("status", "active");

  if (error || !data) return [];

  return data
    .map((row) => {
      const p = row.profiles as unknown as {
        id: string;
        first_name: string;
        last_name: string;
        username: string;
      } | null;
      if (!p) return null;
      return {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        username: p.username,
      };
    })
    .filter((c): c is ChildSummary => c !== null);
}
