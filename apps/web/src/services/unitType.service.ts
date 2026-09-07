import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { UnitTypeRow } from "@hooper/db";
import { cache } from "react";
import { moduleTtlCache } from "./_catalogCache";

/**
 * Raw unit-type rows. Global reference data (`unit_types_select_all` RLS) read
 * from several code paths on the program / session / exercise pages.
 * `moduleTtlCache` keeps them warm across navigations (invalidated by the
 * unit-type-management actions); `cache()` on top dedups within a single render.
 */
const unitTypesCache = moduleTtlCache(async (): Promise<UnitTypeRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unit_types")
    .select("*")
    .order("position");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getUnitTypesRaw = cache(() => unitTypesCache.get());

/** Drop the cached catalog after a unit-type create / update / delete. */
export function invalidateUnitTypes(): void {
  unitTypesCache.invalidate();
}

export type CreateUnitTypeInput = {
  name: string;
  description?: string;
  created_by: string;
};

export type UpdateUnitTypeInput = {
  name?: string;
  description?: string;
};

export async function listUnitTypes(): Promise<Result<UnitTypeRow[]>> {
  try {
    return ok(await getUnitTypesRaw());
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createUnitType(
  input: CreateUnitTypeInput,
): Promise<Result<UnitTypeRow>> {
  try {
    const supabase = await createClient();

    const { data: siblings } = await supabase
      .from("unit_types")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      siblings && siblings.length > 0 ? siblings[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("unit_types")
      .insert({
        name: input.name,
        description: input.description ?? null,
        position: nextPosition,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateUnitType(
  id: string,
  input: UpdateUnitTypeInput,
): Promise<Result<UnitTypeRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("unit_types")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
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

export async function deleteUnitType(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("unit_types").delete().eq("id", id);

    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
