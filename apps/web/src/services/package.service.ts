import type { PackageBuyerCounts, PackagePricing } from "@/src/lib/packages";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  AssignedProgramRef,
  PackageBuyerRow,
  PackageCoachRef,
  PackageDetail,
  PackageProgramRef,
  PackageRow,
  PackageSummary,
  PackageTeamRef,
} from "@hooper/db";
import { cache } from "react";

const COACH_COLUMNS = "id, first_name, last_name, username, avatar_url";

/** Postgres unique_violation — the only unique constraint on packages that
 * a create can hit is the slug. */
const UNIQUE_VIOLATION = "23505";

export const SLUG_IN_USE = "Already in use";

type PackageJoinRow = PackageRow & {
  package_programs: { programs: AssignedProgramRef | null }[] | null;
  package_coaches: { profiles: PackageCoachRef | null }[] | null;
};

type DetailProgramJoin = {
  programs:
    | (AssignedProgramRef & {
        weeks: number;
        sessions: { week_number: number }[] | null;
      })
    | null;
};

/** Same derivation as program.service's sessionsPerWeekRange. */
function sessionsPerWeekRange(
  sessions: { week_number: number }[],
): [number, number] | null {
  if (sessions.length === 0) return null;
  const counts = new Map<number, number>();
  for (const { week_number } of sessions) {
    counts.set(week_number, (counts.get(week_number) ?? 0) + 1);
  }
  const values = [...counts.values()];
  return [Math.min(...values), Math.max(...values)];
}

function coachesOf(
  joins: PackageJoinRow["package_coaches"],
): PackageCoachRef[] {
  return (joins ?? [])
    .map((pc) => pc.profiles)
    .filter((p): p is PackageCoachRef => p !== null);
}

export type CreatePackageInput = PackagePricing & {
  slug: string;
  name: string;
  created_by: string;
};

export type UpdatePackageInput = Partial<PackagePricing> & { name?: string };

/** Distinct athletes with active access, per package id — grouped in the
 * database, so it's one row per package rather than per purchase. */
async function activeBuyerCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Result<Map<string, number>>> {
  const { data, error } = await supabase
    .from("package_buyer_counts")
    .select("package_id, active_buyers");
  if (error) return err(error.message);
  return ok(new Map((data ?? []).map((r) => [r.package_id, r.active_buyers])));
}

export async function listPackages(): Promise<Result<PackageSummary[]>> {
  try {
    const supabase = await createClient();
    const [{ data, error }, counts] = await Promise.all([
      supabase
        .from("packages")
        .select(
          `*, package_programs(programs(id, name)), package_coaches(profiles(${COACH_COLUMNS}))`,
        )
        .order("created_at", { ascending: false }),
      activeBuyerCounts(supabase),
    ]);
    if (error) return err(error.message);
    // A secondary stat — list the packages without it rather than fail.
    if (!counts.ok) {
      console.error("Failed to load package buyer counts:", counts.error);
    }
    const activeBuyers = counts.ok ? counts.data : new Map<string, number>();

    const rows = ((data ?? []) as unknown as PackageJoinRow[]).map(
      ({ package_programs, package_coaches, ...row }) => ({
        ...row,
        programs: (package_programs ?? [])
          .map((pp) => pp.programs)
          .filter((p): p is AssignedProgramRef => p !== null),
        coaches: coachesOf(package_coaches),
        activeBuyers: activeBuyers.get(row.id) ?? 0,
      }),
    );
    return ok(rows);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** `cache()`d so the detail layout and the Buyers tab share one fetch. */
export const getPackageBySlug = cache(async function getPackageBySlug(
  slug: string,
): Promise<Result<PackageDetail>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("packages")
      .select(
        `*, package_programs(programs(id, name, weeks, sessions(week_number))), package_coaches(profiles(${COACH_COLUMNS})), package_teams(teams(id, name, avatar_url))`,
      )
      .eq("slug", slug)
      .single();
    if (error) return err(error.message);

    const { package_programs, package_coaches, package_teams, ...row } =
      data as unknown as Omit<PackageJoinRow, "package_programs"> & {
        package_programs: DetailProgramJoin[] | null;
        package_teams: { teams: PackageTeamRef | null }[] | null;
      };

    const programs: PackageProgramRef[] = (package_programs ?? [])
      .map((pp) => pp.programs)
      .filter((p): p is NonNullable<DetailProgramJoin["programs"]> => !!p)
      .map((p) => ({
        id: p.id,
        name: p.name,
        weeks: p.weeks,
        sessionsPerWeek: sessionsPerWeekRange(p.sessions ?? []),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const teams = (package_teams ?? [])
      .map((pt) => pt.teams)
      .filter((t): t is PackageTeamRef => t !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    return ok({
      ...row,
      programs,
      coaches: coachesOf(package_coaches),
      teams,
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
});

/** Everyone who has bought a package, one row per purchase: people with
 * access first, then newest purchase first. Keyed by slug so the Buyers tab
 * can run it alongside `getPackageBySlug` rather than after it. */
export const listPackageBuyers = cache(async function listPackageBuyers(
  slug: string,
): Promise<Result<PackageBuyerRow[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("package_buyers")
      .select("*")
      .eq("package_slug", slug)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return err(error.message);
    return ok(data ?? []);
  } catch (e) {
    return err(toErrorMessage(e));
  }
});

/** The detail header's buyer numbers, counted in the database. A package
 * nobody has bought has no row, which reads as zero. */
export async function getPackageBuyerCounts(
  slug: string,
): Promise<Result<PackageBuyerCounts>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("package_buyer_counts")
      .select("active_buyers, purchases")
      .eq("package_slug", slug)
      .maybeSingle();
    if (error) return err(error.message);
    return ok({
      active: data?.active_buyers ?? 0,
      total: data?.purchases ?? 0,
    });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Every coach profile — the "Add coach" picker's candidates. */
export async function listCoaches(): Promise<Result<PackageCoachRef[]>> {
  try {
    const supabase = await createClient();
    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("profile_id")
      .eq("role", "coach");
    if (roleError) return err(roleError.message);

    const ids = (roleRows ?? []).map((r) => r.profile_id);
    if (ids.length === 0) return ok([]);

    const { data, error } = await supabase
      .from("profiles")
      .select(COACH_COLUMNS)
      .in("id", ids)
      .order("first_name");
    if (error) return err(error.message);
    return ok((data ?? []) as PackageCoachRef[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function isPackageSlugAvailable(
  slug: string,
): Promise<Result<boolean>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("package_slug_available", {
      p_slug: slug,
    });
    if (error) return err(error.message);
    return ok(data === true);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createPackage(
  input: CreatePackageInput,
): Promise<Result<PackageRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("packages")
      .insert({
        slug: input.slug,
        name: input.name,
        price_cents: input.price_cents,
        billing_type: input.billing_type,
        billing_interval: input.billing_interval,
        access_weeks: input.access_weeks,
        created_by: input.created_by,
      })
      .select()
      .single();
    if (error) {
      return err(error.code === UNIQUE_VIOLATION ? SLUG_IN_USE : error.message);
    }

    // The creator is listed as the package's first coach. The package row
    // already exists, so a failure here isn't fatal — they can still edit it
    // as the creator and add themselves from the detail page.
    const { error: coachError } = await supabase
      .from("package_coaches")
      .insert({ package_id: data.id, profile_id: input.created_by });
    if (coachError) {
      console.error("Failed to add creator as package coach:", coachError);
    }

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updatePackage(
  id: string,
  input: UpdatePackageInput,
): Promise<Result<PackageRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("packages")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.price_cents !== undefined && {
          price_cents: input.price_cents,
        }),
        ...(input.billing_type !== undefined && {
          billing_type: input.billing_type,
        }),
        ...(input.billing_interval !== undefined && {
          billing_interval: input.billing_interval,
        }),
        ...(input.access_weeks !== undefined && {
          access_weeks: input.access_weeks,
        }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deletePackage(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("soft_delete_package", {
      p_package_id: id,
    });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addPackageProgram(
  packageId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_programs")
      .insert({ package_id: packageId, program_id: programId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removePackageProgram(
  packageId: string,
  programId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_programs")
      .delete()
      .eq("package_id", packageId)
      .eq("program_id", programId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addPackageTeam(
  packageId: string,
  teamId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_teams")
      .insert({ package_id: packageId, team_id: teamId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removePackageTeam(
  packageId: string,
  teamId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_teams")
      .delete()
      .eq("package_id", packageId)
      .eq("team_id", teamId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addPackageCoach(
  packageId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_coaches")
      .insert({ package_id: packageId, profile_id: profileId });
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removePackageCoach(
  packageId: string,
  profileId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("package_coaches")
      .delete()
      .eq("package_id", packageId)
      .eq("profile_id", profileId);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
