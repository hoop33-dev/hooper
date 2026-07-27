import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { listRegions } from "@/src/services/region.service";
import type {
  AssignedProgramRef,
  AthleteDetail,
  AthleteSummary,
} from "@hooper/db";

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

/** auth.users isn't grant-accessible to a plain authenticated session (see
 * the get_athlete_last_sign_ins migration comment), so last_sign_in_at is
 * fetched via that SECURITY DEFINER RPC instead of a direct table/view
 * query — it returns rows only when the caller is a coach. */
async function fetchLastSignIns(
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

export async function listAthletes(): Promise<Result<AthleteSummary[]>> {
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
      fetchAssignedPrograms(athleteIds),
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
}

export async function getAthleteById(
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
      if (!regionsResult.ok) return err(regionsResult.error);
      regionName =
        regionsResult.data.find((r) => r.id === profile.region_id)?.name ??
        null;
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
}

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
