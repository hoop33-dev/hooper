import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { RegionRow } from "@hooper/db";
import { cache } from "react";
import { moduleTtlCache } from "./_catalogCache";

/**
 * Regions are global reference data (`regions` RLS `USING (true)`) and are not
 * mutated anywhere in the portal, so a long-lived module cache is safe — no
 * invalidation hook needed.
 */
const regionsCache = moduleTtlCache(async (): Promise<RegionRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}, 60 * 60_000);

export const listRegions = cache(async (): Promise<Result<RegionRow[]>> => {
  try {
    return ok(await regionsCache.get());
  } catch (e) {
    return err(toErrorMessage(e));
  }
});
