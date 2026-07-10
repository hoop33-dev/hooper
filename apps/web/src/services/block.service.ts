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
export type UpdateBlockInput = {
  name?: string;
  /** Turns this block into (or out of) a superset — a shared round count
   * applied to every exercise placed in it. */
  is_superset?: boolean;
  /** The round count for a superset block. Only meaningful alongside
   * is_superset: true (or when it's already true); changing it cascades
   * `sets` (and resizes each placement's per-set measurement rows) to
   * every exercise currently in the block. */
  sets?: number;
};

/** One set's value within a unit-type slot (Reps, Weight, ...) — a
 * placement's `sets` count determines how many of these each slot holds,
 * so a pyramid/wave set can carry a distinct value per set. */
export type MeasurementSetInput = {
  value?: number | null;
  value_entered_by?: EnteredBy;
};

export type MeasurementInput = {
  unit_type: string;
  value_unit?: string | null;
  /** One entry per set, in set order — length should match the
   * placement's `sets`. */
  sets: MeasurementSetInput[];
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

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
export async function resolveConfiguredUnitTypes(
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
 * with a default value and default display unit for this unit type,
 * repeated across every set (uniform until the coach pyramids it). */
export function defaultMeasurementInput(
  unitType: string,
  setsCount: number,
): MeasurementInput {
  return {
    unit_type: unitType,
    value_unit: defaultUnitFor(unitType),
    sets: Array.from({ length: setsCount }, () => ({
      value: defaultValueFor(unitType),
      value_entered_by: "coach" as const,
    })),
  };
}

function toMeasurementRows(
  blockExerciseId: string,
  measurements: MeasurementInput[],
) {
  return measurements.flatMap((m, position) =>
    m.sets.map((s, set_index) => ({
      block_exercise_id: blockExerciseId,
      position,
      set_index,
      unit_type: m.unit_type,
      value: s.value ?? null,
      value_entered_by: s.value_entered_by ?? "coach",
      value_unit: m.value_unit ?? defaultUnitFor(m.unit_type),
    })),
  );
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

/** Groups a placement's raw measurement rows by unit-type slot (`position`),
 * each sorted by `set_index` — the shape `resizeMeasurements` needs to pad
 * or truncate per slot. */
function groupMeasurementsByPosition(
  measurements: BlockExerciseMeasurementRow[],
): BlockExerciseMeasurementRow[][] {
  const byPosition = new Map<number, BlockExerciseMeasurementRow[]>();
  for (const m of measurements) {
    const list = byPosition.get(m.position) ?? [];
    list.push(m);
    byPosition.set(m.position, list);
  }
  return [...byPosition.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, rows]) => [...rows].sort((a, b) => a.set_index - b.set_index));
}

/** Pads or truncates each unit-type slot's per-set values to exactly
 * `setsCount` — used whenever a placement's `sets` changes without the
 * caller supplying a full new set of measurements (e.g. a superset's round
 * count changing at the block level). Padding repeats the last known set's
 * value rather than resetting to a default, since a coach growing 3 sets to
 * 4 almost always wants the new set to start out matching the last one. */
function resizeMeasurements(
  measurements: BlockExerciseMeasurementRow[],
  setsCount: number,
): MeasurementInput[] {
  return groupMeasurementsByPosition(measurements).map((rows) => {
    const last = rows[rows.length - 1];
    return {
      unit_type: rows[0].unit_type,
      value_unit: rows[0].value_unit,
      sets: Array.from({ length: setsCount }, (_, i) => {
        const row = rows[i] ?? last;
        return {
          value: row?.value ?? null,
          value_entered_by: row?.value_entered_by ?? "coach",
        };
      }),
    };
  });
}

/** Forces every exercise currently placed in a superset block onto the same
 * round count, resizing each placement's per-set measurement rows to match
 * (padding/truncating, see resizeMeasurements) — the fan-out a block's
 * `sets` stepper triggers. */
async function cascadeSupersetSets(
  supabase: SupabaseClient,
  blockId: string,
  newSets: number,
): Promise<Result<void>> {
  const { data: rawExercises, error } = await supabase
    .from("block_exercises")
    .select("*, block_exercise_measurements(*)")
    .eq("block_id", blockId);
  if (error) return err(error.message);

  const exercises = (rawExercises ?? []) as unknown as {
    id: string;
    block_exercise_measurements: BlockExerciseMeasurementRow[];
  }[];

  for (const be of exercises) {
    const { error: setsError } = await supabase
      .from("block_exercises")
      .update({ sets: newSets })
      .eq("id", be.id);
    if (setsError) return err(setsError.message);

    const resized = resizeMeasurements(
      be.block_exercise_measurements ?? [],
      newSets,
    );
    const result = await replaceMeasurements(supabase, be.id, resized);
    if (!result.ok) return err(result.error);
  }
  return ok(undefined);
}

/** Applies the same patch to every sibling block sharing `linkGroupId`,
 * returning their ids so a superset sets cascade can also reach them. */
async function syncSiblingBlocks(
  supabase: SupabaseClient,
  id: string,
  linkGroupId: string,
  patch: Record<string, unknown>,
): Promise<Result<string[]>> {
  const { error: siblingError } = await supabase
    .from("blocks")
    .update(patch)
    .eq("link_group_id", linkGroupId)
    .neq("id", id);
  if (siblingError) return err(siblingError.message);

  const { data: siblings } = await supabase
    .from("blocks")
    .select("id")
    .eq("link_group_id", linkGroupId)
    .neq("id", id);
  return ok((siblings ?? []).map((b) => b.id));
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
      ...(input.is_superset !== undefined && {
        is_superset: input.is_superset,
      }),
      ...(input.sets !== undefined && { sets: input.sets }),
    };

    const { data, error } = await supabase
      .from("blocks")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    const siblingsResult =
      data.link_group_id && Object.keys(patch).length > 0
        ? await syncSiblingBlocks(supabase, id, data.link_group_id, patch)
        : ok<string[]>([]);
    if (!siblingsResult.ok) return err(siblingsResult.error);

    if (input.sets !== undefined && data.is_superset) {
      for (const blockId of [id, ...siblingsResult.data]) {
        const cascadeResult = await cascadeSupersetSets(
          supabase,
          blockId,
          input.sets,
        );
        if (!cascadeResult.ok) return err(cascadeResult.error);
      }
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

/** Every block that a new placement in `blockId` needs a row in (itself,
 * plus any siblings sharing its link group), and a fresh link group id to
 * tag them all with when there's more than one. */
async function resolveTargetBlocks(
  supabase: SupabaseClient,
  blockId: string,
): Promise<{ targetBlockIds: string[]; linkGroupId: string | null }> {
  const blockLinkGroupId = await linkGroupOf(supabase, "blocks", blockId);
  const targetBlockIds = blockLinkGroupId
    ? ((
        await supabase
          .from("blocks")
          .select("id")
          .eq("link_group_id", blockLinkGroupId)
      ).data?.map((b) => b.id) ?? [blockId])
    : [blockId];
  return {
    targetBlockIds,
    linkGroupId: targetBlockIds.length > 1 ? randomUUID() : null,
  };
}

/** A superset block's round count always wins over a caller-supplied sets,
 * so a freshly-added exercise starts in sync with the rest of the block
 * rather than needing an immediate manual fix-up. */
async function resolveNewExerciseSets(
  supabase: SupabaseClient,
  blockId: string,
  requestedSets: number | undefined,
): Promise<number> {
  const { data: block } = await supabase
    .from("blocks")
    .select("is_superset, sets")
    .eq("id", blockId)
    .single();
  if (block?.is_superset && block.sets) return block.sets;
  return requestedSets ?? 1;
}

export async function addExerciseToBlock(
  input: AddExerciseToBlockInput,
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const { targetBlockIds, linkGroupId } = await resolveTargetBlocks(
      supabase,
      input.block_id,
    );
    const setsCount = await resolveNewExerciseSets(
      supabase,
      input.block_id,
      input.sets,
    );

    const blockExerciseRows = await Promise.all(
      targetBlockIds.map(async (blockId) => ({
        block_id: blockId,
        exercise_id: input.exercise_id,
        position: await nextBlockExercisePosition(supabase, blockId),
        sets: setsCount,
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
      toMeasurementRows(
        be.id,
        input.measurements ??
          unitTypes!.map((unitType) =>
            defaultMeasurementInput(unitType, setsCount),
          ),
      ),
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
    .order("position")
    .order("set_index");
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
    // A measurements-only save (e.g. from the superset rounds editor, which
    // never touches sets/notes) leaves patch empty — an empty .update()
    // still hits PostgREST and comes back with no row for .single() to
    // coerce, so skip straight to a plain select in that case.
    const { data: blockExercise, error } =
      Object.keys(patch).length > 0
        ? await supabase
            .from("block_exercises")
            .update(patch)
            .eq("id", id)
            .select()
            .single()
        : await supabase.from("block_exercises").select().eq("id", id).single();
    if (error) return err(error.message);

    // A sets-only change (no explicit new measurements) still has to keep
    // each unit-type slot's row count in sync with the new sets — otherwise
    // a placement grown from 3 sets to 5 would be left with stale/missing
    // per-set rows for the two new sets.
    let measurementsResult: Result<BlockExerciseMeasurementRow[]>;
    if (input.measurements) {
      measurementsResult = await replaceMeasurements(
        supabase,
        id,
        input.measurements,
      );
    } else if (input.sets !== undefined) {
      const existing = await currentMeasurements(supabase, id);
      measurementsResult = await replaceMeasurements(
        supabase,
        id,
        resizeMeasurements(existing, input.sets),
      );
    } else {
      measurementsResult = ok(await currentMeasurements(supabase, id));
    }
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
