import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import type { createClient } from "@/src/lib/supabase/server";
import { normalizeStepPicks } from "@hooper/shared";
import { randomUUID } from "node:crypto";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** One step as submitted from an editor: picks are exercise ids per set
 * index, sparse. */
export type SequenceStepInput = {
  label: string;
  category_id: string | null;
  picks: Record<number, string>;
};

// Each owner of sequence steps (a library sequence, a placement, a template
// placement) has its own steps + picks table pair with the same shape.
export type SequenceOwner = "library" | "placement" | "template";

const TABLES = {
  library: {
    steps: "sequence_steps",
    picks: "sequence_step_picks",
    parent: "sequence_id",
  },
  placement: {
    steps: "block_exercise_sequence_steps",
    picks: "block_exercise_sequence_picks",
    parent: "block_exercise_id",
  },
  template: {
    steps: "block_template_exercise_sequence_steps",
    picks: "block_template_exercise_sequence_picks",
    parent: "block_template_exercise_id",
  },
} as const;

function buildRows(
  owner: SequenceOwner,
  parentId: string,
  steps: SequenceStepInput[],
  setCount: number,
) {
  const { parent } = TABLES[owner];
  const stepRows: Record<string, unknown>[] = [];
  const pickRows: {
    step_id: string;
    set_index: number;
    exercise_id: string;
  }[] = [];
  steps.forEach((step, position) => {
    const id = randomUUID();
    stepRows.push({
      id,
      [parent]: parentId,
      position,
      label: step.label,
      category_id: step.category_id,
    });
    for (const [setIndex, exerciseId] of Object.entries(
      normalizeStepPicks(step.picks, setCount),
    )) {
      pickRows.push({
        step_id: id,
        set_index: Number(setIndex),
        exercise_id: exerciseId,
      });
    }
  });
  return { stepRows, pickRows };
}

async function insertRows(
  supabase: SupabaseClient,
  owner: SequenceOwner,
  rows: ReturnType<typeof buildRows>,
): Promise<Result<void>> {
  const tables = TABLES[owner];
  if (rows.stepRows.length > 0) {
    const { error } = await supabase
      // Dynamic table name; the row shapes match each table's columns.
      .from(tables.steps as "block_exercise_sequence_steps")
      .insert(rows.stepRows as never);
    if (error) return err(error.message);
  }
  if (rows.pickRows.length > 0) {
    const { error } = await supabase
      .from(tables.picks as "block_exercise_sequence_picks")
      .insert(rows.pickRows);
    if (error) return err(error.message);
  }
  return ok(undefined);
}

/** Steps in the shape the replace_sequence_steps / save_sequence RPCs take:
 * display order, picks normalized for the set count. */
export function toStepsPayload(steps: SequenceStepInput[], setCount: number) {
  return steps.map((step) => ({
    label: step.label,
    category_id: step.category_id,
    picks: Object.entries(normalizeStepPicks(step.picks, setCount)).map(
      ([setIndex, exerciseId]) => ({
        set_index: Number(setIndex),
        exercise_id: exerciseId,
      }),
    ),
  }));
}

/** Full replace of one owner's steps, in one transaction: a failed insert
 * leaves the old steps in place rather than none. */
export async function replaceSequenceSteps(
  supabase: SupabaseClient,
  owner: SequenceOwner,
  parentId: string,
  steps: SequenceStepInput[],
  setCount: number,
): Promise<Result<void>> {
  const { error } = await supabase.rpc("replace_sequence_steps", {
    p_owner: owner,
    p_parent_id: parentId,
    p_steps: toStepsPayload(steps, setCount),
  });
  return error ? err(error.message) : ok(undefined);
}

/** Inserts the same steps under several new parents at once (e.g. every
 * linked week a new placement lands in). */
export async function insertSequenceSteps(
  supabase: SupabaseClient,
  owner: SequenceOwner,
  parentIds: string[],
  steps: SequenceStepInput[],
  setCount: number,
): Promise<Result<void>> {
  const all = parentIds.map((id) => buildRows(owner, id, steps, setCount));
  return insertRows(supabase, owner, {
    stepRows: all.flatMap((r) => r.stepRows),
    pickRows: all.flatMap((r) => r.pickRows),
  });
}

/** Drops picks for sets that no longer exist after a sets count shrinks.
 * Growing needs nothing: new sets carry every step forward. */
export async function trimSequencePicks(
  supabase: SupabaseClient,
  owner: SequenceOwner,
  parentId: string,
  setsCount: number,
): Promise<Result<void>> {
  const tables = TABLES[owner];
  const { data: steps, error } = await supabase
    .from(tables.steps as "block_exercise_sequence_steps")
    .select("id")
    .eq(tables.parent as "block_exercise_id", parentId);
  if (error) return err(error.message);
  const stepIds = (steps ?? []).map((st) => st.id);
  if (stepIds.length === 0) return ok(undefined);
  const { error: deleteError } = await supabase
    .from(tables.picks as "block_exercise_sequence_picks")
    .delete()
    .in("step_id", stepIds)
    .gte("set_index", setsCount);
  return deleteError ? err(deleteError.message) : ok(undefined);
}

type RawStep = {
  id: string;
  position: number;
  label: string;
  category_id: string | null;
  picks: { set_index: number; exercise_id: string }[];
};

/** Reads every step of the given parents, grouped by parent id. */
export async function readSequenceSteps(
  supabase: SupabaseClient,
  owner: SequenceOwner,
  parentIds: string[],
): Promise<Result<Map<string, SequenceStepInput[]>>> {
  const result = new Map<string, SequenceStepInput[]>();
  if (parentIds.length === 0) return ok(result);
  const tables = TABLES[owner];
  const { data, error } = await supabase
    .from(tables.steps as "block_exercise_sequence_steps")
    .select(
      `${tables.parent}, id, position, label, category_id, picks:${tables.picks}(set_index, exercise_id)`,
    )
    .in(tables.parent as "block_exercise_id", parentIds);
  if (error) return err(error.message);

  const rows = (data ?? []) as unknown as (RawStep & Record<string, string>)[];
  rows.sort((a, b) => a.position - b.position);
  for (const row of rows) {
    const parentId = row[tables.parent];
    const list = result.get(parentId) ?? [];
    list.push({
      label: row.label,
      category_id: row.category_id,
      picks: Object.fromEntries(
        (row.picks ?? []).map((p) => [p.set_index, p.exercise_id]),
      ),
    });
    result.set(parentId, list);
  }
  return ok(result);
}

/** Deep-copies steps from source parents onto their copies. `pairs` maps a
 * source parent id to the new parent id(s) it was copied to. */
export async function copySequenceSteps(
  supabase: SupabaseClient,
  from: SequenceOwner,
  to: SequenceOwner,
  pairs: { from: string; to: string; sets: number }[],
): Promise<Result<void>> {
  if (pairs.length === 0) return ok(undefined);
  const read = await readSequenceSteps(supabase, from, [
    ...new Set(pairs.map((p) => p.from)),
  ]);
  if (!read.ok) return err(read.error);
  const all = pairs
    .filter((p) => read.data.has(p.from))
    .map((p) => buildRows(to, p.to, read.data.get(p.from)!, p.sets));
  return insertRows(supabase, to, {
    stepRows: all.flatMap((r) => r.stepRows),
    pickRows: all.flatMap((r) => r.pickRows),
  });
}
