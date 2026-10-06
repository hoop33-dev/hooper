import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database.types";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads and writes auth cookies via Next.js's cookie store.
 *
 * Uses the anon key only — never the service role key. RLS enforces access.
 *
 * NOTE: Pages and components must not import this directly. All data access
 * goes through the service layer in src/services/** (enforced by ESLint).
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // @supabase/ssr@0.5.2 returns SupabaseClient<Db, SchemaName, Schema> (3 type
  // args) but @supabase/supabase-js@2.101.1 has 5 type params. The 3-arg
  // mapping places Schema in the SchemaName slot, collapsing all row types to
  // never. Casting to SupabaseClient<Database> (1 arg) uses the correct
  // defaults: SchemaName='public', Schema=Database['public'].
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // ignore in Server Components — middleware handles session refresh
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
