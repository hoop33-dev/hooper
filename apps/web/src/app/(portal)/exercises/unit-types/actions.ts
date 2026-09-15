"use server";

import {
  createUnitType,
  deleteUnitType,
  invalidateUnitTypes,
  updateUnitType,
} from "@/src/services/unitType.service";
import type { UnitTypeRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: boolean; error?: string; data?: UnitTypeRow };

export async function createUnitTypeAction(data: {
  name: string;
  description?: string;
  created_by: string;
}): Promise<ActionResult> {
  const result = await createUnitType(data);
  if (result.ok) {
    invalidateUnitTypes();
    revalidatePath("/exercises/unit-types");
    revalidatePath("/exercises");
  }
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updateUnitTypeAction(
  id: string,
  data: { name?: string; description?: string },
): Promise<ActionResult> {
  const result = await updateUnitType(id, data);
  if (result.ok) {
    invalidateUnitTypes();
    revalidatePath("/exercises/unit-types");
    revalidatePath("/exercises");
  }
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deleteUnitTypeAction(id: string): Promise<ActionResult> {
  const result = await deleteUnitType(id);
  if (result.ok) {
    invalidateUnitTypes();
    revalidatePath("/exercises/unit-types");
    revalidatePath("/exercises");
  }
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
