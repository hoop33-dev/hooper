import type { PackagePricing } from "@/src/lib/packages";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { listRegions } from "@/src/services/region.service";
import type {
  AssignedProgramRef,
  AthleteDashboardRow,
  AthleteDetail,
  AthletePackageProgram,
  AthleteSummary,
} from "@hooper/db";
import { cache } from "react";

type ProgramAthleteJoinRow = {
  profile_id: string;
  programs: AssignedProgramRef | null;
};

async function fetchAssignedPrograms(
  profileIds: string[],
): Promise<Result<Map<string, AssignedProgramRef[]>>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program_athletes")
    .select("profile_id, programs(id, name)")
    .in("profile_id", profileIds);

  if (error) return err(error.message);

  const byAthlete = new Map<string, AssignedProgramRef[]>();
  for (const row of (data ?? []) as unknown as ProgramAthleteJoinRow[]) {
    if (!row.programs) continue;
    const list = byAthlete.get(row.profile_id) ?? [];
    list.push(row.programs);
    byAthlete.set(row.profile_id, list);
  }
  return ok(byAthlete);
}

/** Every program each athlete sees — assigned directly, from a package or
 * from a team — via the coach-only coach_athlete_programs RPC, which does
 * the membership → team → program hop in one round trip. Direct ones come
 * first. For the lists; the detail page keeps `fetchAssignedPrograms`,
 * where `programs` means direct-only (the removable ones). */
async function fetchAthleteProgramList(
  profileIds: string[],
): Promise<Result<Map<string, AssignedProgramRef[]>>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_athlete_programs", {
    p_profile_ids: profileIds,
  });
  if (error) return err(error.message);
  return ok(new Map((data ?? []).map((row) => [row.profile_id, row.programs])));
}

/** auth.users isn't grant-accessible to a plain authenticated session (see
 * the get_athlete_last_sign_ins migration comment), so last_sign_in_at is
 * fetched via that SECURITY DEFINER RPC instead of a direct table/view
 * query — it returns rows only when the caller is a coach. */
export async function fetchLastSignIns(
  profileIds: string[],
): Promise<Result<Map<string, string | null>>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_athlete_last_sign_ins", {
    p_profile_ids: profileIds,
  });

  if (error) return err(error.message);

  const byAthlete = new Map<string, string | null>();
  for (const row of data ?? []) {
    byAthlete.set(row.profile_id, row.last_sign_in_at);
  }
  return ok(byAthlete);
}

/** Cheap dashboard read — how many players this coach can see, without the
 * profiles / assigned-programs / last-sign-in RPC work `listAthletes` does. */
export const countAthletes = cache(async (): Promise<Result<number>> => {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "player");
    if (error) return err(error.message);
    return ok(count ?? 0);
  } catch (e) {
    return err(toErrorMessage(e));
  }
});

export const listAthletes = cache(
  async (): Promise<Result<AthleteSummary[]>> => {
    try {
      const supabase = await createClient();

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("profile_id")
        .eq("role", "player");
      if (roleError) return err(roleError.message);

      const athleteIds = (roleRows ?? []).map((r) => r.profile_id);
      if (athleteIds.length === 0) return ok([]);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", athleteIds)
        .order("first_name");
      if (profilesError) return err(profilesError.message);

      const [programsResult, lastSignInsResult] = await Promise.all([
        fetchAthleteProgramList(athleteIds),
        fetchLastSignIns(athleteIds),
      ]);
      if (!programsResult.ok) return err(programsResult.error);
      if (!lastSignInsResult.ok) return err(lastSignInsResult.error);

      const rows: AthleteSummary[] = (profiles ?? []).map((profile) => ({
        ...profile,
        last_sign_in_at: lastSignInsResult.data.get(profile.id) ?? null,
        programs: programsResult.data.get(profile.id) ?? [],
      }));

      return ok(rows);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

/** The dashboard's Athletes card: the N athletes who logged in most
 * recently, ranked server-side via the `list_athletes_by_last_sign_in` RPC
 * (mirrors get_athlete_last_sign_ins, but sorts + limits across every
 * athlete instead of looking up a known id list). */
export const listRecentAthletesByLogin = cache(
  async (limit = 6): Promise<Result<AthleteDashboardRow[]>> => {
    try {
      const supabase = await createClient();
      const { data: ranked, error: rankedError } = await supabase.rpc(
        "list_athletes_by_last_sign_in",
        { p_limit: limit },
      );
      if (rankedError) return err(rankedError.message);

      const orderedIds = (ranked ?? []).map((row) => row.profile_id);
      if (orderedIds.length === 0) return ok([]);

      const lastSignInById = new Map(
        (ranked ?? []).map((row) => [row.profile_id, row.last_sign_in_at]),
      );

      const [profilesResult, programsResult, regionsResult] = await Promise.all(
        [
          supabase.from("profiles").select("*").in("id", orderedIds),
          fetchAthleteProgramList(orderedIds),
          listRegions(),
        ],
      );
      if (profilesResult.error) return err(profilesResult.error.message);
      if (!programsResult.ok) return err(programsResult.error);
      if (!regionsResult.ok) return err(regionsResult.error);

      const regionNameById = new Map(
        regionsResult.data.map((region) => [region.id, region.name]),
      );
      const profileById = new Map(
        profilesResult.data.map((profile) => [profile.id, profile]),
      );

      const rows: AthleteDashboardRow[] = orderedIds
        .map((id) => profileById.get(id))
        .filter((profile): profile is NonNullable<typeof profile> =>
          Boolean(profile),
        )
        .map((profile) => ({
          ...profile,
          last_sign_in_at: lastSignInById.get(profile.id) ?? null,
          regionName: profile.region_id
            ? (regionNameById.get(profile.region_id) ?? null)
            : null,
          programs: programsResult.data.get(profile.id) ?? [],
        }));

      return ok(rows);
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

/** cache()'d so the athlete layout and its tab pages share one fetch. */
export const getAthleteById = cache(async function getAthleteById(
  id: string,
): Promise<Result<AthleteDetail>> {
  try {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (profileError) return err(profileError.message);

    let regionName: string | null = null;
    if (profile.region_id) {
      const regionsResult = await listRegions();
      if (regionsResult.ok) {
        regionName =
          regionsResult.data.find((r) => r.id === profile.region_id)?.name ??
          null;
      }
    }

    const [programsResult, lastSignInsResult] = await Promise.all([
      fetchAssignedPrograms([id]),
      fetchLastSignIns([id]),
    ]);
    if (!programsResult.ok) return err(programsResult.error);
    if (!lastSignInsResult.ok) return err(lastSignInsResult.error);

    return ok({
      ...profile,
      last_sign_in_at: lastSignInsResult.data.get(id) ?? null,
      regionName,
      programs: programsResult.data.get(id) ?? [],
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
});

/** Programs an athlete gets through their active package purchases, one
 * entry per (package, program) — see the package_program_access view. */
export const listPackageProgramsForAthlete = cache(
  async function listPackageProgramsForAthlete(
    profileId: string,
  ): Promise<Result<AthletePackageProgram[]>> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("package_program_access")
        .select("program_id, program_name, package_id, package_name")
        .eq("profile_id", profileId)
        .order("package_name")
        .order("program_name");
      if (error) return err(error.message);

      return ok(
        (data ?? []).map((row) => ({
          id: row.program_id,
          name: row.program_name,
          package: { id: row.package_id, name: row.package_name },
        })),
      );
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

export async function assignProgramToAthlete(
  profileId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("program_athletes")
      .insert({ profile_id: profileId, program_id: programId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function unassignProgramFromAthlete(
  profileId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("program_athletes")
      .delete()
      .eq("profile_id", profileId)
      .eq("program_id", programId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** What the athlete page's Details tab shows about the account itself —
 * from the coach-only coach_athlete_account RPC, since auth.users isn't
 * readable directly. `email` is null for a child account (its email is a
 * placeholder), whose password the linked parent manages. */
export type AthleteAccount = {
  email: string | null;
  hasRealEmail: boolean;
  joinedAt: string;
  lastSignInAt: string | null;
  parentName: string | null;
};

export const getAthleteAccount = cache(
  async (profileId: string): Promise<Result<AthleteAccount>> => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("coach_athlete_account", {
        p_profile_id: profileId,
      });
      if (error) return err(error.message);
      const row = data?.[0];
      if (!row) return err("Athlete not found.");
      return ok({
        email: row.email,
        hasRealEmail: row.has_real_email,
        joinedAt: row.joined_at,
        lastSignInAt: row.last_sign_in_at,
        parentName: row.parent_name,
      });
    } catch (e) {
      return err(toErrorMessage(e));
    }
  },
);

export type AthleteProfileFields = {
  firstName: string;
  lastName: string;
  username: string;
  mobile: string | null;
  dateOfBirth: string | null;
  regionId: string | null;
  bio: string | null;
};

/** Coach edit of an athlete's profile via the coach_update_athlete_profile
 * RPC, which whitelists these fields (never email), refuses coach profiles
 * and audits the change. */
export async function updateAthleteProfile(
  profileId: string,
  fields: AthleteProfileFields,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("coach_update_athlete_profile", {
      p_profile_id: profileId,
      p_first_name: fields.firstName,
      p_last_name: fields.lastName,
      p_username: fields.username,
      p_mobile: fields.mobile,
      p_date_of_birth: fields.dateOfBirth,
      p_region_id: fields.regionId,
      p_bio: fields.bio,
    });
    if (error) {
      if (error.code === "23505") return err("That username is taken.");
      return err(error.message);
    }
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** A package the athlete holds (or held), from the coach-only
 * package_buyers view — no Stripe call, so the Programs & teams tab can
 * show it without waiting on billing. */
export type AthletePackage = PackagePricing & {
  purchaseId: string;
  packageId: string;
  slug: string;
  name: string;
  status: "active" | "past_due" | "canceled" | "expired";
  /** Has access now: active/past_due and not past access_until. */
  isActive: boolean;
  currentPeriodEnd: string | null;
  accessUntil: string | null;
  cancelAtPeriodEnd: boolean;
  paidAt: string | null;
  createdAt: string;
};

export const listAthletePackages = cache(async function listAthletePackages(
  profileId: string,
): Promise<Result<AthletePackage[]>> {
  try {
    const supabase = await createClient();
    const { data: buys, error } = await supabase
      .from("package_buyers")
      .select("*")
      .eq("profile_id", profileId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return err(error.message);
    if (!buys?.length) return ok([]);

    const { data: pkgs, error: pkgError } = await supabase
      .from("packages")
      .select(
        "id, name, price_cents, billing_type, billing_interval, access_weeks",
      )
      .in("id", [...new Set(buys.map((b) => b.package_id))]);
    if (pkgError) return err(pkgError.message);
    const byId = new Map((pkgs ?? []).map((p) => [p.id, p]));

    return ok(
      buys.flatMap((b) => {
        // Soft-deleted packages are hidden by packages RLS.
        const p = byId.get(b.package_id);
        if (!p) return [];
        return [
          {
            purchaseId: b.purchase_id,
            packageId: b.package_id,
            slug: b.package_slug,
            name: p.name,
            price_cents: p.price_cents,
            billing_type: p.billing_type,
            billing_interval: p.billing_interval,
            access_weeks: p.access_weeks,
            status: b.status as AthletePackage["status"],
            isActive: b.is_active,
            currentPeriodEnd: b.current_period_end,
            accessUntil: b.access_until,
            cancelAtPeriodEnd: b.cancel_at_period_end,
            paidAt: b.paid_at,
            createdAt: b.created_at,
          },
        ];
      }),
    );
  } catch (e) {
    return err(toErrorMessage(e));
  }
});
