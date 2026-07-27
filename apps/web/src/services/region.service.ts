import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { RegionRow } from "@hooper/db";

export async function listRegions(): Promise<Result<RegionRow[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name");

    if (error) return err(error.message);
    return ok(data ?? []);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
