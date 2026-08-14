import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseRow,
  BlockExerciseSetStyleRow,
  BlockExerciseSetVariantRow,
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

/** One unit-type slot's value within a single set — up to 3 per set (Reps,
 * Weight, Time, ...), independently chosen per set so one set can be
 * Shots+Makes while another is Time. */
export type MeasurementSlotInput = {
  unit_type: string;
  value_unit?: string | null;
  value?: number | null;
  value_entered_by?: EnteredBy;
};

/** One set's full config: its chosen unit-type slots, in display order. */
export type MeasurementSetInput = {
  slots: MeasurementSlotInput[];
};

/** A placement's full measurement payload — one entry per set, in set
 * order (index = set_index), set-major rather than unit-type-major so each
 * set can independently choose its own unit-type combo. */
export type MeasurementInput = MeasurementSetInput[];

export type BlockExerciseWithMeasurements = BlockExerciseRow & {
  measurements: BlockExerciseMeasurementRow[];
};

export type AddExerciseToBlockInput = {
  block_id: string;
  exercise_id: string;
  sets?: number;
  notes?: string;
  /** Omitted → auto-derive every set's slots from the exercise's configured
   * exercise_unit_types (see resolveConfiguredUnitTypes). */
  measurements?: MeasurementInput;
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
  measurements?: MeasurementInput;
  /** Swaps which variant the whole placement points at — a set with no
   * per-set override uses this as its own default. */
  exercise_id?: string;
  /** Null clears the placement's style back to "none" — distinct from
   * omitting the field, which leaves it untouched. */
  style_id?: string | null;
  /** Sparse, keyed by set_index — when provided, fully replaces this
   * placement's per-set variant overrides. A set with no entry here (and
   * none already differing from `exercise_id`) uses the placement's own
   * variant. Passing `{}` clears every override ("apply to all sets"). */
  set_variants?: Record<number, string>;
  /** Sparse, keyed by set_index — when provided, fully replaces this
   * placement's per-set style overrides. A `null` value means that set
   * explicitly has no style; a missing key means it uses the placement's
   * own `style_id`. Passing `{}` clears every override ("apply to all
   * sets"). */
  set_styles?: Record<number, string | null>;
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
 * else (Weight, Time, Distance, RPE, RIR, Shots, Makes, % 1RM) starts at
 * zero. */
function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 8 : 0;
}

/** Sensible starting values for a freshly-placed exercise: coach-entered,
 * with a default value and default display unit for each configured unit
 * type, repeated identically across every set (uniform until the coach
 * customizes individual sets). */
export function defaultMeasurementSets(
  unitTypes: string[],
  setsCount: number,
): MeasurementInput {
  return Array.from({ length: setsCount }, () => ({
    slots: unitTypes.map((unitType) => ({
      unit_type: unitType,
      value_unit: defaultUnitFor(unitType),
      value: defaultValueFor(unitType),
      value_entered_by: "coach" as const,
    })),
  }));
}

function toMeasurementRows(
  blockExerciseId: string,
  measurements: MeasurementInput,
) {
  return measurements.flatMap((set, set_index) =>
    set.slots.map((slot, position) => ({
      block_exercise_id: blockExerciseId,
      position,
      set_index,
      unit_type: slot.unit_type,
      value: slot.value ?? null,
      value_entered_by: slot.value_entered_by ?? "coach",
      value_unit: slot.value_unit ?? defaultUnitFor(slot.unit_type),
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

/** Groups a placement's raw measurement rows by `set_index`, each sorted by
 * `position` — the shape `resizeMeasurements` needs to pad or truncate the
 * placement's list of sets. */
function groupMeasurementsBySet(
  measurements: BlockExerciseMeasurementRow[],
): BlockExerciseMeasurementRow[][] {
  const bySet = new Map<number, BlockExerciseMeasurementRow[]>();
  for (const m of measurements) {
    const list = bySet.get(m.set_index) ?? [];
    list.push(m);
    bySet.set(m.set_index, list);
  }
  return [...bySet.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, rows]) => [...rows].sort((a, b) => a.position - b.position));
}

/** Pads or truncates a placement's list of sets to exactly `setsCount` —
 * used whenever a placement's `sets` changes without the caller supplying
 * full new measurements (e.g. a superset's round count changing at the
 * block level). Padding deep-copies the last known set's *entire* slot list
 * (unit types, values, and units together) rather than resetting to a
 * default, since a coach growing 3 sets to 4 almost always wants the new
 * set to start out matching the last one exactly. */
function resizeMeasurements(
  measurements: BlockExerciseMeasurementRow[],
  setsCount: number,
): MeasurementInput {
  const sets = groupMeasurementsBySet(measurements).map((rows) => ({
    slots: rows.map((row) => ({
      unit_type: row.unit_type,
      value_unit: row.value_unit,
      value: row.value,
      value_entered_by: row.value_entered_by,
    })),
  }));
  const last = sets[sets.length - 1];
  return Array.from({ length: setsCount }, (_, i) => {
    const set = sets[i] ?? last;
    return { slots: set ? set.slots.map((slot) => ({ ...slot })) : [] };
  });
}

/** Pads/truncates a sparse per-set override map (set_index -> value) to a
 * new sets count. Shrinking drops indices that no longer exist. Growing
 * copies the last existing set's override (if it had one) onto every new
 * index, matching the "new set copies the last set's full config" rule —
 * a new index that ends up with no entry simply inherits the placement
 * default, which is correct since the set it was copied from also had no
 * override in that case. */
function resizeSparseOverrideMap<T>(
  overrides: Record<number, T>,
  oldSetsCount: number,
  newSetsCount: number,
): Record<number, T> {
  const result: Record<number, T> = {};
  for (const [key, value] of Object.entries(overrides)) {
    const index = Number(key);
    if (index < newSetsCount) result[index] = value;
  }
  const lastIndex = oldSetsCount - 1;
  if (newSetsCount > oldSetsCount && lastIndex in overrides) {
    const lastOverride = overrides[lastIndex];
    for (let i = oldSetsCount; i < newSetsCount; i++) {
      result[i] = lastOverride;
    }
  }
  return result;
}

/** Forces every exercise currently placed in a superset block onto the same
 * round count, resizing each placement's per-set measurement rows (padding/
 * truncating, see resizeMeasurements) and per-set variant/style overrides
 * (see resizeSparseOverrideMap) to match — the fan-out a block's `sets`
 * stepper triggers. */
async function cascadeSupersetSets(
  supabase: SupabaseClient,
  blockId: string,
  newSets: number,
): Promise<Result<void>> {
  const { data: rawExercises, error } = await supabase
    .from("block_exercises")
    .select(
      "*, block_exercise_measurements(*), block_exercise_set_variants(*), block_exercise_set_styles(*)",
    )
    .eq("block_id", blockId);
  if (error) return err(error.message);

  const exercises = (rawExercises ?? []) as unknown as (BlockExerciseRow & {
    block_exercise_measurements: BlockExerciseMeasurementRow[];
    block_exercise_set_variants: BlockExerciseSetVariantRow[];
    block_exercise_set_styles: BlockExerciseSetStyleRow[];
  })[];

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

    const currentVariants = Object.fromEntries(
      (be.block_exercise_set_variants ?? []).map((v) => [
        v.set_index,
        v.exercise_id,
      ]),
    );
    const variantsResult = await replaceSetVariants(
      supabase,
      be.id,
      be.exercise_id,
      resizeSparseOverrideMap(currentVariants, be.sets, newSets),
    );
    if (!variantsResult.ok) return err(variantsResult.error);

    const currentStyles = Object.fromEntries(
      (be.block_exercise_set_styles ?? []).map((s) => [
        s.set_index,
        s.style_id,
      ]),
    );
    const stylesResult = await replaceSetStyles(
      supabase,
      be.id,
      be.style_id,
      resizeSparseOverrideMap(currentStyles, be.sets, newSets),
    );
    if (!stylesResult.ok) return err(stylesResult.error);
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
    const { data: exerciseRow } = await supabase
      .from("exercises")
      .select("default_style_id")
      .eq("id", input.exercise_id)
      .single();

    const blockExerciseRows = await Promise.all(
      targetBlockIds.map(async (blockId) => ({
        block_id: blockId,
        exercise_id: input.exercise_id,
        position: await nextBlockExercisePosition(supabase, blockId),
        sets: setsCount,
        notes: input.notes ?? null,
        link_group_id: linkGroupId,
        style_id: exerciseRow?.default_style_id ?? null,
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
        input.measurements ?? defaultMeasurementSets(unitTypes!, setsCount),
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
  measurements: MeasurementInput,
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

/** Full replace, sparse: only inserts rows for sets whose variant differs
 * from the placement's own `exercise_id` — a set matching the placement
 * default simply has no row, so "apply to all sets" is just deleting
 * everything for this placement. */
async function replaceSetVariants(
  supabase: SupabaseClient,
  blockExerciseId: string,
  exerciseId: string,
  setVariants: Record<number, string>,
): Promise<Result<void>> {
  const { error: deleteError } = await supabase
    .from("block_exercise_set_variants")
    .delete()
    .eq("block_exercise_id", blockExerciseId);
  if (deleteError) return err(deleteError.message);

  const rows = Object.entries(setVariants)
    .filter(([, variantExerciseId]) => variantExerciseId !== exerciseId)
    .map(([setIndex, variantExerciseId]) => ({
      block_exercise_id: blockExerciseId,
      set_index: Number(setIndex),
      exercise_id: variantExerciseId,
    }));
  if (rows.length === 0) return ok(undefined);

  const { error } = await supabase
    .from("block_exercise_set_variants")
    .insert(rows);
  if (error) return err(error.message);
  return ok(undefined);
}

/** Full replace, sparse: only inserts rows for sets whose style differs
 * from the placement's own `style_id` — a set matching the placement
 * default simply has no row, so "apply to all sets" is just deleting
 * everything for this placement. Mirrors replaceSetVariants, except style
 * (unlike exercise_id) can legitimately be null, so a set's row may itself
 * store a null style_id to represent "this set explicitly has no style"
 * even when the placement default does have one. */
async function replaceSetStyles(
  supabase: SupabaseClient,
  blockExerciseId: string,
  styleId: string | null,
  setStyles: Record<number, string | null>,
): Promise<Result<void>> {
  const { error: deleteError } = await supabase
    .from("block_exercise_set_styles")
    .delete()
    .eq("block_exercise_id", blockExerciseId);
  if (deleteError) return err(deleteError.message);

  const rows = Object.entries(setStyles)
    .filter(([, setStyleId]) => setStyleId !== styleId)
    .map(([setIndex, setStyleId]) => ({
      block_exercise_id: blockExerciseId,
      set_index: Number(setIndex),
      style_id: setStyleId,
    }));
  if (rows.length === 0) return ok(undefined);

  const { error } = await supabase
    .from("block_exercise_set_styles")
    .insert(rows);
  if (error) return err(error.message);
  return ok(undefined);
}

/** Applies the same sets/notes patch (and, for a full value sync, the same
 * measurement replace and per-set variant/style override replace) that was
 * just made to the primary row onto one scoped-in sibling placement. The
 * variant/style overrides are re-resolved against the *sibling's own*
 * exercise_id/style_id (post-patch, so a scoped exercise_id/style_id swap is
 * already reflected) rather than reusing the primary row's values as-is —
 * mirrors how the primary row itself resolves "matches the default, so no
 * override row needed" in replaceSetVariants/replaceSetStyles, and a sibling
 * can carry a different default than the primary when scope is "future". */
/** Applies `patch` to a sibling row (a plain unselected update when nothing
 * downstream needs its resulting columns, to avoid an unneeded round trip),
 * optionally returning its post-patch exercise_id/style_id when a variant/
 * style sync needs them to resolve against. `undefined` defaults (rather
 * than an error) when the sibling was concurrently deleted out from under
 * this scoped save — maybeSingle tolerates that the same way a plain
 * .update() against a missing row already silently no-ops, instead of
 * failing the whole scoped save over one sibling's race. */
async function patchSiblingRow(
  supabase: SupabaseClient,
  siblingId: string,
  patch: Record<string, unknown>,
  needsDefaults: boolean,
): Promise<
  Result<{ exercise_id: string; style_id: string | null } | undefined>
> {
  const hasPatch = Object.keys(patch).length > 0;
  if (!hasPatch && !needsDefaults) return ok(undefined);
  if (hasPatch && !needsDefaults) {
    const { error } = await supabase
      .from("block_exercises")
      .update(patch)
      .eq("id", siblingId);
    return error ? err(error.message) : ok(undefined);
  }

  const { data, error } = hasPatch
    ? await supabase
        .from("block_exercises")
        .update(patch)
        .eq("id", siblingId)
        .select("exercise_id, style_id")
        .maybeSingle()
    : await supabase
        .from("block_exercises")
        .select("exercise_id, style_id")
        .eq("id", siblingId)
        .maybeSingle();
  return error ? err(error.message) : ok(data ?? undefined);
}

/** Applies the same sets/notes patch (and, for a full value sync, the same
 * measurement replace and per-set variant/style override replace) that was
 * just made to the primary row onto one scoped-in sibling placement. The
 * variant/style overrides are re-resolved against the *sibling's own*
 * exercise_id/style_id (post-patch, so a scoped exercise_id/style_id swap is
 * already reflected) rather than reusing the primary row's values as-is —
 * mirrors how the primary row itself resolves "matches the default, so no
 * override row needed" in replaceSetVariants/replaceSetStyles, and a sibling
 * can carry a different default than the primary when scope is "future". */
async function applyToSibling(
  supabase: SupabaseClient,
  siblingId: string,
  patch: Record<string, unknown>,
  measurements: MeasurementInput | undefined,
  setVariants: Record<number, string> | undefined,
  setStyles: Record<number, string | null> | undefined,
): Promise<Result<void>> {
  const needsDefaults = setVariants !== undefined || setStyles !== undefined;
  const patchResult = await patchSiblingRow(
    supabase,
    siblingId,
    patch,
    needsDefaults,
  );
  if (!patchResult.ok) return err(patchResult.error);
  const defaults = patchResult.data;

  if (measurements) {
    const result = await replaceMeasurements(supabase, siblingId, measurements);
    if (!result.ok) return err(result.error);
  }
  if (setVariants && defaults) {
    const result = await replaceSetVariants(
      supabase,
      siblingId,
      defaults.exercise_id,
      setVariants,
    );
    if (!result.ok) return err(result.error);
  }
  if (setStyles && defaults) {
    const result = await replaceSetStyles(
      supabase,
      siblingId,
      defaults.style_id,
      setStyles,
    );
    if (!result.ok) return err(result.error);
  }
  return ok(undefined);
}

/** Only the columns the caller actually touched — `exercise_id`/`style_id`
 * use `in`/`!== undefined` checks so a swap to null (style_id) is
 * distinguishable from "leave it alone" (omitted entirely). */
function buildBlockExercisePatch(input: UpdateBlockExerciseInput) {
  return {
    ...(input.sets !== undefined && { sets: input.sets }),
    ...("notes" in input && { notes: input.notes ?? null }),
    ...(input.exercise_id !== undefined && {
      exercise_id: input.exercise_id,
    }),
    ...("style_id" in input && { style_id: input.style_id ?? null }),
  };
}

/** A sets-only change (no explicit new measurements) still has to keep each
 * unit-type slot's row count in sync with the new sets — otherwise a
 * placement grown from 3 sets to 5 would be left with stale/missing per-set
 * rows for the two new sets. */
async function resolveMeasurementsForUpdate(
  supabase: SupabaseClient,
  id: string,
  input: UpdateBlockExerciseInput,
): Promise<Result<BlockExerciseMeasurementRow[]>> {
  if (input.measurements) {
    return replaceMeasurements(supabase, id, input.measurements);
  }
  if (input.sets !== undefined) {
    const existing = await currentMeasurements(supabase, id);
    return replaceMeasurements(
      supabase,
      id,
      resizeMeasurements(existing, input.sets),
    );
  }
  return ok(await currentMeasurements(supabase, id));
}

export async function updateBlockExercise(
  id: string,
  input: UpdateBlockExerciseInput,
  scope: LinkScope = "this",
): Promise<Result<BlockExerciseWithMeasurements>> {
  try {
    const supabase = await createClient();
    const patch = buildBlockExercisePatch(input);
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

    const measurementsResult = await resolveMeasurementsForUpdate(
      supabase,
      id,
      input,
    );
    if (!measurementsResult.ok) return err(measurementsResult.error);

    if (input.set_variants) {
      const setVariantsResult = await replaceSetVariants(
        supabase,
        id,
        blockExercise.exercise_id,
        input.set_variants,
      );
      if (!setVariantsResult.ok) return err(setVariantsResult.error);
    }

    if (input.set_styles) {
      const setStylesResult = await replaceSetStyles(
        supabase,
        id,
        blockExercise.style_id,
        input.set_styles,
      );
      if (!setStylesResult.ok) return err(setStylesResult.error);
    }

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
        input.set_variants,
        input.set_styles,
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
