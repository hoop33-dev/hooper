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
  dateOfBirth: Date;
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
        dateOfBirth: formatLocalDate(input.dateOfBirth),
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
  // RLS (parent_player_links_select_parent) already limits results to
  // the authenticated parent's links — no manual parent_profile_id filter needed.
  const { data: links, error: linksError } = await supabase
    .from("parent_player_links")
    .select("player_profile_id")
    .eq("status", "active");

  if (linksError || !links || links.length === 0) return [];

  const ids = links.map((l) => l.player_profile_id);

  // profiles_select_children RLS allows the parent to read their children's profiles.
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username")
    .in("id", ids);

  if (profilesError || !profiles) return [];

  return profiles.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    username: p.username,
  }));
}
