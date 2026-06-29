import type { Database } from "@/src/types/database.types";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components.
 *
 * Uses the anon key only — never the service role key in client-facing code.
 * RLS policies enforce access control.
 *
 * NOTE: Pages and components must not import this directly. All data access
 * goes through the service layer in src/services/** (enforced by ESLint).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
