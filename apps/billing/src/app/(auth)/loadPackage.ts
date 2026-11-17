import { parsePackageParam } from "@/src/lib/routes";
import { getPublicPackage } from "@/src/services/package.service";
import type { PublicPackage } from "@hooper/db";

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

/** Resolves ?package= for an auth page.
 *   none         — no package in the URL (plain sign in / sign up)
 *   unavailable  — a slug was given but doesn't resolve (or is malformed)
 *   ok           — the package to show beside the form */
export async function loadPackage(
  raw: string | string[] | undefined,
): Promise<
  | { kind: "none" }
  | { kind: "unavailable" }
  | { kind: "ok"; slug: string; pkg: PublicPackage }
> {
  if (raw === undefined || raw === "") return { kind: "none" };
  const slug = parsePackageParam(raw);
  if (!slug) return { kind: "unavailable" };
  const res = await getPublicPackage(slug);
  if (!res.ok || !res.data) return { kind: "unavailable" };
  return { kind: "ok", slug, pkg: res.data };
}

export function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
