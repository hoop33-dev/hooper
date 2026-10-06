import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type { PublicPackage } from "@hooper/db";
import { cache } from "react";

/** A package's public checkout view by slug. `null` data means the slug is
 * unknown or the package was deleted ("no longer available"). Works signed
 * out — get_public_package is granted to anon. */
export const getPublicPackage = cache(
  async (slug: string): Promise<Result<PublicPackage | null>> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_package", {
      p_slug: slug,
    });
    if (error) return err(error.message);
    return ok(data ?? null);
  },
);
