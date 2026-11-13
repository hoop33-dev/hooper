/** Routes reachable without a session. /signup/verify and /reset/* must work
 * both before and right after a session exists (verifyOtp and the recovery
 * link both create one mid-flow). */
export function isPublicPath(pathname: string): boolean {
  return (
    isSignedOutOnlyPath(pathname) ||
    pathname.startsWith("/signup/") ||
    pathname === "/reset" ||
    pathname.startsWith("/reset/")
  );
}

/** Entry screens that make no sense once signed in. */
export function isSignedOutOnlyPath(pathname: string): boolean {
  return (
    pathname === "/start" || pathname === "/signin" || pathname === "/signup"
  );
}

/** Appends ?package=<slug> (or &package=) to an internal path when a package
 * is being bought, so the slug survives every hop of the flow. */
export function withPackage(path: string, slug: string | null | undefined) {
  if (!slug) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}package=${encodeURIComponent(slug)}`;
}

/** Package slugs are lowercase kebab-case (see the packages migration). Treat
 * anything else as "no package" rather than passing it to the backend. */
export function parsePackageParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw) && raw.length <= 40 ? raw : null;
}
