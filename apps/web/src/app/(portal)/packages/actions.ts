"use server";

import { validatePackageSlug } from "@/src/lib/packages";
import {
  addPackageCoach,
  addPackageProgram,
  createPackage,
  deletePackage,
  isPackageSlugAvailable,
  removePackageCoach,
  removePackageProgram,
  SLUG_IN_USE,
  updatePackage,
  type CreatePackageInput,
  type UpdatePackageInput,
} from "@/src/services/package.service";
import type { PackageRow } from "@hooper/db";
import { revalidatePath } from "next/cache";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

/** Detail pages are keyed by slug, but mutations only know the package id —
 * revalidate every package detail page rather than look the slug up. */
function revalidatePackages() {
  revalidatePath("/packages");
  revalidatePath("/packages/[slug]", "page");
}

/** null when the slug is free; otherwise the message to show under the
 * field. Format errors are checked here too so the server never trusts the
 * client's validation. */
export async function checkPackageSlugAction(
  slug: string,
): Promise<string | null> {
  const formatError = validatePackageSlug(slug);
  if (formatError) return formatError;
  const result = await isPackageSlugAvailable(slug);
  if (!result.ok) return null;
  return result.data ? null : SLUG_IN_USE;
}

export async function createPackageAction(
  data: CreatePackageInput,
): Promise<ActionResult<PackageRow>> {
  const slugError = validatePackageSlug(data.slug);
  if (slugError) return { ok: false, error: slugError };
  if (!data.name.trim()) return { ok: false, error: "Name is required" };

  const result = await createPackage({ ...data, name: data.name.trim() });
  if (result.ok) revalidatePackages();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function updatePackageAction(
  id: string,
  data: UpdatePackageInput,
): Promise<ActionResult<PackageRow>> {
  const result = await updatePackage(id, data);
  if (result.ok) revalidatePackages();
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error };
}

export async function deletePackageAction(id: string): Promise<ActionResult> {
  const result = await deletePackage(id);
  if (result.ok) revalidatePackages();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addPackageProgramAction(
  packageId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await addPackageProgram(packageId, programId);
  if (result.ok) revalidatePackages();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function removePackageProgramAction(
  packageId: string,
  programId: string,
): Promise<ActionResult> {
  const result = await removePackageProgram(packageId, programId);
  if (result.ok) revalidatePackages();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function addPackageCoachAction(
  packageId: string,
  profileId: string,
): Promise<ActionResult> {
  const result = await addPackageCoach(packageId, profileId);
  if (result.ok) revalidatePackages();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function removePackageCoachAction(
  packageId: string,
  profileId: string,
): Promise<ActionResult> {
  const result = await removePackageCoach(packageId, profileId);
  if (result.ok) revalidatePackages();
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
