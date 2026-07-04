import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockRow,
  EnteredBy,
} from "@hooper/db";
import { defaultBlockColor } from "@hooper/shared";
import { randomUUID } from "node:crypto";

export type CreateBlockInput = { session_id: string; name: string };
export type UpdateBlockInput = { name?: string };

export type MeasurementInput = {
  unit_type: string;
  value?: number | null;
  value_entered_by?: EnteredBy;
  value_unit?: string | null;
};

export type BlockExerciseWithMeasurements = BlockExerciseRow & {
  measurements: BlockExerciseMeasurementRow[];
};

export type AddExerciseToBlockInput = {
  block_id: string;
  exercise_id: string;
  sets?: number;
  notes?: string;
  /** Omitted → auto-derive one measurement per the exercise's configured
   * exercise_unit_types (see resolveConfiguredUnitTypes). */
  measurements?: MeasurementInput[];
};

/** How a save to a linked placement's numbers should propagate — mirrors a
 * calendar app's "this event / this and following / all events" choice,
 * since target numbers often intentionally progress week to week and don't
 * fit a single always/never rule. Ignored entirely for unlinked rows. */
export type LinkScope = "this" | "future" | "all";

export type UpdateBlockExerciseInput = {
  sets?: number;
  notes?: string;
  /** When provided, fully replaces this placement's measurement rows. */
  measurements?: MeasurementInput[];
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function nextBlockPosition(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<number> {
  const { data } = await supabase
    .from("blocks")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

async function nextBlockExercisePosition(
  supabase: SupabaseClient,
  blockId: string,
): Promise<number> {
  const { data } = await supabase
    .from("block_exercises")
    .select("position")
    .eq("block_id", blockId)
    .order("position", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].position + 1 : 0;
}

/** All of the exercise's configured unit types, in order, falling back to
 * "Reps" if none are configured. */
async function resolveConfiguredUnitTypes(
  supabase: SupabaseClient,
  exerciseId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("exercise_unit_types")
    .select("unit_type")
    .eq("exercise_id", exerciseId)
    .order("position");
  const types = (data ?? []).map((row) => row.unit_type);
  return types.length > 0 ? types : ["Reps"];
}

/** Reps-like unit types default to a nonzero starting count; everything
 * else (Weight, Time, Distance, RPE, Shots, Makes, % 1RM) starts at zero. */
function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 8 : 0;
}

/** Sensible starting values for a freshly-placed measurement: coach-entered,
 * with a default value and default display unit for this unit type. */
function defaultMeasurementRow(unitType: string, position: number) {
  return {
    position,
    unit_type: unitType,
    value: defaultValueFor(unitType),
    value_entered_by: "coach" as const,
    value_unit: defaultUnitFor(unitType),
  };
}

function toMeasurementRows(
  blockExerciseId: string,
  measurements: MeasurementInput[],
) {
  return measurements.map((m, position) => ({
    block_exercise_id: blockExerciseId,
    position,
    unit_type: m.unit_type,
    value: m.value ?? null,
    value_entered_by: m.value_entered_by ?? "coach",
    value_unit: m.value_unit ?? defaultUnitFor(m.unit_type),
  }));
}

/** Fetches a single row's `link_group_id`, or null if the row/column is
 * unset — used before a mutation to decide whether to fan it out. */
async function linkGroupOf(
  supabase: SupabaseClient,
  table: "sessions" | "blocks" | "block_exercises",
  id: string,
): Promise<string | null> {
  const { data } = await supabase
    .from(table)
    .select("link_group_id")
    .eq("id", id)
    .single();
  return data?.link_group_id ?? null;
}

export async function createBlock(
  input: CreateBlockInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const sessionLinkGroupId = await linkGroupOf(
      supabase,
      "sessions",
      input.session_id,
    );
    const color = defaultBlockColor(input.name);

    const targetSessionIds = sessionLinkGroupId
      ? ((
          await supabase
            .from("sessions")
            .select("id")
            .eq("link_group_id", sessionLinkGroupId)
        ).data?.map((s) => s.id) ?? [input.session_id])
      : [input.session_id];

    const linkGroupId = targetSessionIds.length > 1 ? randomUUID() : null;

    const rows = await Promise.all(
      targetSessionIds.map(async (sessionId) => ({
        session_id: sessionId,
        name: input.name,
        color,
        position: await nextBlockPosition(supabase, sessionId),
        link_group_id: linkGroupId,
      })),
    );

    const { data, error } = await supabase.from("blocks").insert(rows).select();
    if (error) return err(error.message);

    const primary = data?.find((b) => b.session_id === input.session_id);
    if (!primary) return err("Failed to create block.");
    return ok(primary);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateBlock(
  id: string,
  input: UpdateBlockInput,
): Promise<Result<BlockRow>> {
  try {
    const supabase = await createClient();
    const patch = {
      // Color is always derived from the name (never independently set),
      // so a rename recomputes it too.
      ...(input.name !== undefined && {
        name: input.name,
        color: defaultBlockColor(input.name),
      }),
    };

    const { data, error } = await supabase
      .from("blocks")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    if (data.link_group_id && Object.keys(patch).length > 0) {
      const { error: siblingError } = await supabase
        .from("blocks")
        .update(patch)
        .eq("link_group_id", data.link_group_id)
        .neq("id", id);
      if (siblingError) return err(siblingError.message);
    }

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteBlock(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const linkGroupId = await linkGroupOf(supabase, "blocks", id);

    const { error } = linkGroupId
      ? await supabase.from("blocks").delete().eq("link_group_id", linkGroupId)
      : await supabase.from("blocks").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlocks(
  updates: { id: string; session_id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    // Per-row UPDATEs, not upsert: upsert runs an INSERT ... ON CONFLICT,
    // which still validates NOT NULL columns (blocks.name) against the
    // insert payload even for rows that already exist — so a positions-only
    // upsert fails with "null value in column name". UPDATE only touches
    // the columns we pass.
    const results = await Promise.all(
      updates.map(async ({ id, session_id, position }) => {
        const { data, error } = await supabase
          .from("blocks")
          .update({ session_id, position })
          .eq("id", id)
          .select("link_group_id")
          .single();
        if (error) return { error };
        if (!data?.link_group_id) return { error: null };
        // A linked block's siblings stay in their own session — only its
        // position within that session follows.
        return await supabase
          .from("blocks")
          .update({ position })
          .eq("link_group_id", data.link_group_id)
          .neq("id", id);
      }),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function addExerciseToBlock(
  input: AddExerciseToBlockInput,
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const blockLinkGroupId = await linkGroupOf(
      supabase,
      "blocks",
      input.block_id,
    );

    const targetBlockIds = blockLinkGroupId
      ? ((
          await supabase
            .from("blocks")
            .select("id")
            .eq("link_group_id", blockLinkGroupId)
        ).data?.map((b) => b.id) ?? [input.block_id])
      : [input.block_id];

    const linkGroupId = targetBlockIds.length > 1 ? randomUUID() : null;

    const blockExerciseRows = await Promise.all(
      targetBlockIds.map(async (blockId) => ({
        block_id: blockId,
        exercise_id: input.exercise_id,
        position: await nextBlockExercisePosition(supabase, blockId),
        sets: input.sets ?? 1,
        notes: input.notes ?? null,
        link_group_id: linkGroupId,
      })),
    );

    const { data: insertedBlockExercises, error } = await supabase
      .from("block_exercises")
      .insert(blockExerciseRows)
      .select();
    if (error) return err(error.message);
    if (!insertedBlockExercises) return err("Failed to add exercise.");

    const unitTypes = input.measurements
      ? null
      : await resolveConfiguredUnitTypes(supabase, input.exercise_id);

    const measurementRows = insertedBlockExercises.flatMap((be) =>
      input.measurements
        ? toMeasurementRows(be.id, input.measurements)
        : unitTypes!.map((unitType, i) => ({
            block_exercise_id: be.id,
            ...defaultMeasurementRow(unitType, i),
          })),
    );

    const { data: insertedMeasurements, error: measurementsError } =
      await supabase
        .from("block_exercise_measurements")
        .insert(measurementRows)
        .select();
    if (measurementsError) return err(measurementsError.message);

    const primary = insertedBlockExercises.find(
      (be) => be.block_id === input.block_id,
    );
    if (!primary) return err("Failed to add exercise.");
    const primaryMeasurements = (insertedMeasurements ?? []).filter(
      (m) => m.block_exercise_id === primary.id,
    );
    return ok({ ...primary, measurements: primaryMeasurements });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Every distinct week that has a placement sharing this exercise's link
 * group, sorted — empty when it isn't linked. The program canvas already
 * has every session loaded locally and can compute this client-side (see
 * `linkedWeeksOfExercise` in useProgramCanvasState.ts); the single-session
 * page only ever loads its own session, so it needs this as a real lookup
 * to show the same "this / future / all" scope choice on save. */
export async function getLinkedWeeksForExercise(
  id: string,
): Promise<Result<number[]>> {
  try {
    const supabase = await createClient();
    const linkGroupId = await linkGroupOf(supabase, "block_exercises", id);
    if (!linkGroupId) return ok([]);

    const { data: members, error } = await supabase
      .from("block_exercises")
      .select("block_id")
      .eq("link_group_id", linkGroupId);
    if (error) return err(error.message);

    const blockIds = [...new Set((members ?? []).map((m) => m.block_id))];
    if (blockIds.length === 0) return ok([]);

    const { data: blocksData, error: blocksError } = await supabase
      .from("blocks")
      .select("session_id")
      .in("id", blockIds);
    if (blocksError) return err(blocksError.message);

    const sessionIds = [
      ...new Set((blocksData ?? []).map((b) => b.session_id)),
    ];
    if (sessionIds.length === 0) return ok([]);

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("week_number")
      .in("id", sessionIds);
    if (sessionsError) return err(sessionsError.message);

    const weeks = [
      ...new Set((sessionsData ?? []).map((s) => s.week_number)),
    ].sort((a, b) => a - b);
    return ok(weeks);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Resolves which sibling block-exercise ids (sharing `primary`'s link
 * group) a `scope`d edit should also apply to — empty for `"this"`, every
 * sibling for `"all"`, and only ones in a week at or after `primary`'s own
 * for `"future"`. */
async function resolveScopedSiblings(
  supabase: SupabaseClient,
  primary: BlockExerciseRow,
  scope: LinkScope,
): Promise<Result<string[]>> {
  if (scope === "this" || !primary.link_group_id) return ok([]);

  const { data: members, error } = await supabase
    .from("block_exercises")
    .select("id, block_id")
    .eq("link_group_id", primary.link_group_id);
  if (error) return err(error.message);

  const others = (members ?? []).filter((m) => m.id !== primary.id);
  if (scope === "all" || others.length === 0)
    return ok(others.map((m) => m.id));

  const blockIds = [primary.block_id, ...others.map((m) => m.block_id)];
  const { data: blocksData, error: blocksError } = await supabase
    .from("blocks")
    .select("id, session_id")
    .in("id", blockIds);
  if (blocksError) return err(blocksError.message);

  const sessionIds = (blocksData ?? []).map((b) => b.session_id);
  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, week_number")
    .in("id", sessionIds);
  if (sessionsError) return err(sessionsError.message);

  const weekBySession = new Map(
    (sessionsData ?? []).map((s) => [s.id, s.week_number]),
  );
  const sessionByBlock = new Map(
    (blocksData ?? []).map((b) => [b.id, b.session_id]),
  );
  const weekForBlock = (blockId: string) => {
    const sessionId = sessionByBlock.get(blockId);
    return sessionId != null ? weekBySession.get(sessionId) : undefined;
  };

  const primaryWeek = weekForBlock(primary.block_id);
  // Can't resolve a week to compare against — fall back to syncing
  // everything rather than silently skipping siblings.
  if (primaryWeek == null) return ok(others.map((m) => m.id));

  const targets = others.filter((m) => {
    const week = weekForBlock(m.block_id);
    return week != null && week >= primaryWeek;
  });
  return ok(targets.map((m) => m.id));
}

/** Full replace, matching exercise.service.ts's delete-then-reinsert
 * convention for exercise_unit_types: callers always submit the complete
 * set of active measurements for a placement. */
async function replaceMeasurements(
  supabase: SupabaseClient,
  blockExerciseId: string,
  measurements: MeasurementInput[],
): Promise<Result<BlockExerciseMeasurementRow[]>> {
  const { error: deleteError } = await supabase
    .from("block_exercise_measurements")
    .delete()
    .eq("block_exercise_id", blockExerciseId);
  if (deleteError) return err(deleteError.message);

  const { data, error } = await supabase
    .from("block_exercise_measurements")
    .insert(toMeasurementRows(blockExerciseId, measurements))
    .select();
  if (error) return err(error.message);
  return ok(data ?? []);
}

async function currentMeasurements(
  supabase: SupabaseClient,
  blockExerciseId: string,
): Promise<BlockExerciseMeasurementRow[]> {
  const { data } = await supabase
    .from("block_exercise_measurements")
    .select("*")
    .eq("block_exercise_id", blockExerciseId)
    .order("position");
  return data ?? [];
}

/** Applies the same sets/notes patch (and, for a full value sync, the same
 * measurement replace) that was just made to the primary row onto one
 * scoped-in sibling placement. */
async function applyToSibling(
  supabase: SupabaseClient,
  siblingId: string,
  patch: Record<string, unknown>,
  measurements: MeasurementInput[] | undefined,
): Promise<Result<void>> {
  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("block_exercises")
      .update(patch)
      .eq("id", siblingId);
    if (error) return err(error.message);
  }
  if (measurements) {
    const result = await replaceMeasurements(supabase, siblingId, measurements);
    if (!result.ok) return err(result.error);
  }
  return ok(undefined);
}

export async function updateBlockExercise(
  id: string,
  input: UpdateBlockExerciseInput,
  scope: LinkScope = "this",
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const patch = {
      ...(input.sets !== undefined && { sets: input.sets }),
      ...("notes" in input && { notes: input.notes ?? null }),
    };
    const { data: blockExercise, error } = await supabase
      .from("block_exercises")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return err(error.message);

    const measurementsResult = input.measurements
      ? await replaceMeasurements(supabase, id, input.measurements)
      : ok(await currentMeasurements(supabase, id));
    if (!measurementsResult.ok) return err(measurementsResult.error);

    const siblingsResult = await resolveScopedSiblings(
      supabase,
      blockExercise,
      scope,
    );
    if (!siblingsResult.ok) return err(siblingsResult.error);

    for (const siblingId of siblingsResult.data) {
      const result = await applyToSibling(
        supabase,
        siblingId,
        patch,
        input.measurements,
      );
      if (!result.ok) return err(result.error);
    }

    return ok({ ...blockExercise, measurements: measurementsResult.data });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function removeExerciseFromBlock(
  id: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const linkGroupId = await linkGroupOf(supabase, "block_exercises", id);

    const { error } = linkGroupId
      ? await supabase
          .from("block_exercises")
          .delete()
          .eq("link_group_id", linkGroupId)
      : await supabase.from("block_exercises").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function reorderBlockExercises(
  updates: { id: string; block_id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    // Per-row UPDATEs (see reorderBlocks): an upsert would fail the NOT NULL
    // checks on exercise_id for the implicit insert path.
    const results = await Promise.all(
      updates.map(async ({ id, block_id, position }) => {
        const { data, error } = await supabase
          .from("block_exercises")
          .update({ block_id, position })
          .eq("id", id)
          .select("link_group_id")
          .single();
        if (error) return { error };
        if (!data?.link_group_id) return { error: null };
        // A linked placement's siblings stay in their own block — only its
        // position within that block follows.
        return await supabase
          .from("block_exercises")
          .update({ position })
          .eq("link_group_id", data.link_group_id)
          .neq("id", id);
      }),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
