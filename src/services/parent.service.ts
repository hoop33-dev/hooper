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
    return {
      ok: false,
      error: "Unable to create child account. Please try again.",
    };
  }

  if (!data.ok) {
    const field = data.field as "username" | "password" | undefined;
    return {
      ok: false,
      field,
      error: data.error ?? "Unable to create child account.",
    };
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

export type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string | null;
  regionId: string | null;
  avatarUrl: string | null;
  profileSettingsLocked: boolean;
};

export type UpdateChildInput = {
  childProfileId: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: Date | null;
  regionId: string | null;
  profileSettingsLocked: boolean;
};

export type UpdateChildResult =
  | { ok: true }
  | { ok: false; field?: "username"; error: string };

// Controls that apply to the *current* player when a guardian manages them.
export type GuardianControls = {
  isManaged: boolean;
  profileSettingsLocked: boolean;
};

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

// Full detail for the Manage child screen. The parent reads the child's
// profile via the profiles_select_children RLS policy and the lock flag via
// parent_player_links_select_parent.
export async function getChildProfile(
  childProfileId: string,
): Promise<ChildProfile | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, username, date_of_birth, region_id, avatar_url",
    )
    .eq("id", childProfileId)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: link } = await supabase
    .from("parent_player_links")
    .select("profile_settings_locked")
    .eq("player_profile_id", childProfileId)
    .eq("status", "active")
    .maybeSingle();

  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    username: profile.username,
    dateOfBirth: profile.date_of_birth,
    regionId: profile.region_id,
    avatarUrl: profile.avatar_url,
    profileSettingsLocked: link?.profile_settings_locked ?? false,
  };
}

export async function updateChildProfile(
  input: UpdateChildInput,
): Promise<UpdateChildResult> {
  const { data, error } = await supabase.functions.invoke(
    "update-child-profile",
    {
      body: {
        childProfileId: input.childProfileId,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        dateOfBirth: input.dateOfBirth
          ? formatLocalDate(input.dateOfBirth)
          : null,
        regionId: input.regionId,
        profileSettingsLocked: input.profileSettingsLocked,
      },
    },
  );

  if (error) {
    return { ok: false, error: "Unable to save changes. Please try again." };
  }

  if (!data.ok) {
    const field = data.field as "username" | undefined;
    return { ok: false, field, error: data.error ?? "Unable to save changes." };
  }

  return { ok: true };
}

// Read the guardian controls that apply to the signed-in player. RLS
// (parent_player_links_select_player) limits results to the caller's own link,
// so a child sees exactly one row and an unmanaged player sees none.
export async function getGuardianControls(): Promise<GuardianControls> {
  const { data, error } = await supabase
    .from("parent_player_links")
    .select("profile_settings_locked")
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    return { isManaged: false, profileSettingsLocked: false };
  }

  return {
    isManaged: true,
    profileSettingsLocked: data.profile_settings_locked,
  };
}
