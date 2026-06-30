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
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
            // The `setAll` method was called from a Server Component. This can
            // be ignored if middleware refreshes the session — which it does.
          }
        },
      },
    },
  );
}
