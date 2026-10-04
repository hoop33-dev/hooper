import { isPublicPath, isSignedOutOnlyPath } from "@/src/lib/routes";
import type { Database } from "@/src/types/database.types";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and gates routes:
 *   - signed out on a private route → /start (keeping ?package=)
 *   - signed in on /start, /signin or /signup → straight on to checkout (with
 *     a package) or the account page
 *
 * Must run as Next.js middleware so the session cookie is refreshed before any
 * Server Component reads it.
 */
export async function updateSession(request: NextRequest) {
  // Prefetch requests don't need an auth check — the real navigation that
  // follows does one.
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-purpose") === "prefetch";
  if (isPrefetch) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const pkg = searchParams.get("package");

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/start";
    url.search = pkg ? `?package=${encodeURIComponent(pkg)}` : "";
    return NextResponse.redirect(url);
  }

  if (user && isSignedOutOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pkg ? "/checkout" : "/account";
    url.search = pkg ? `?package=${encodeURIComponent(pkg)}` : "";
    return NextResponse.redirect(url);
  }

  return response;
}
