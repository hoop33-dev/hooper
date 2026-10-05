"use server";

import {
  validateChild,
  type ChildFormFields,
  type FieldErrors,
} from "@/src/lib/validation";
import {
  createChild,
  getMyChild,
  setChildPassword,
  updateChild,
  type CreatedChild,
} from "@/src/services/children.service";
import { validatePassword } from "@hooper/shared";
import { revalidatePath } from "next/cache";

/** Child-account server actions shared by checkout ("Add a new child") and
 * the Household pages. */

export type ChildActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      errors: FieldErrors<keyof ChildFormFields>;
      formError?: string;
    };

function normalise(f: ChildFormFields): ChildFormFields {
  return {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    dateOfBirth: f.dateOfBirth,
    username: f.username.trim().toLowerCase(),
    password: f.password,
  };
}

export async function createChildAction(
  input: ChildFormFields,
): Promise<ChildActionResult<CreatedChild>> {
  const fields = normalise(input);
  const errors = validateChild(fields);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const res = await createChild(fields);
  if (!res.ok) {
    const { field, message } = res.error;
    return field
      ? { ok: false, errors: { [field]: message } }
      : { ok: false, errors: {}, formError: message };
  }
  revalidatePath("/children");
  return { ok: true, data: res.data };
}

export async function updateChildAction(
  childId: string,
  input: Omit<ChildFormFields, "password">,
): Promise<ChildActionResult<null>> {
  const fields = normalise({ ...input, password: "" });
  const errors = validateChild(fields, { requirePassword: false });
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const child = await getMyChild(childId);
  if (!child.ok || !child.data) {
    return { ok: false, errors: {}, formError: "Child not found." };
  }
  const res = await updateChild(child.data, fields);
  if (!res.ok) {
    const { field, message } = res.error;
    return field
      ? { ok: false, errors: { [field]: message } }
      : { ok: false, errors: {}, formError: message };
  }
  revalidatePath("/children", "layout");
  return { ok: true, data: null };
}

export async function setChildPasswordAction(
  childId: string,
  password: string,
  confirm: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const invalid = validatePassword(password);
  if (invalid) return { ok: false, error: invalid };
  if (password !== confirm)
    return { ok: false, error: "Passwords don't match." };
  const res = await setChildPassword(childId, password);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
