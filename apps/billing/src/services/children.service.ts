import type { Result } from "@/src/lib/result";
import { err, ok } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import { invokeFunction } from "@/src/services/_invoke";
import type { MyChild } from "@hooper/db";
import { cache } from "react";

/** Children are their own auth users (fake email, username login) linked to
 * the guardian via parent_player_links. Creating and editing them needs the
 * service role, so it goes through edge functions shared with the mobile
 * app; reading goes through the my_children() RPC. */

export type ChildFields = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  username: string;
};

export type ChildFieldError = {
  field?: "username" | "password";
  message: string;
};

export type CreatedChild = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  dateOfBirth: string | null;
};

/** The caller's actively linked children. Cached per request. */
export const getMyChildren = cache(async (): Promise<Result<MyChild[]>> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_children");
  if (error) return err(error.message);
  return ok(data ?? []);
});

/** One of the caller's children, or null if the id isn't theirs. */
export async function getMyChild(id: string): Promise<Result<MyChild | null>> {
  const res = await getMyChildren();
  if (!res.ok) return res;
  return ok(res.data.find((c) => c.profile_id === id) ?? null);
}

function fieldOf(field: string | undefined): ChildFieldError["field"] {
  return field === "username" || field === "password" ? field : undefined;
}

export async function createChild(
  fields: ChildFields & { password: string },
): Promise<
  { ok: true; data: CreatedChild } | { ok: false; error: ChildFieldError }
> {
  const res = await invokeFunction<{ child: CreatedChild }>(
    "create-child-account",
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      username: fields.username,
      password: fields.password,
      dateOfBirth: fields.dateOfBirth,
    },
  );
  if (!res.ok) {
    const field = fieldOf(res.field);
    return {
      ok: false,
      error: {
        field,
        message:
          field === "username" ? "That username is already taken." : res.error,
      },
    };
  }
  return { ok: true, data: res.data.child };
}

export async function updateChild(
  child: MyChild,
  fields: ChildFields,
): Promise<{ ok: true } | { ok: false; error: ChildFieldError }> {
  const res = await invokeFunction<object>("update-child-profile", {
    childProfileId: child.profile_id,
    firstName: fields.firstName,
    lastName: fields.lastName,
    username: fields.username,
    dateOfBirth: fields.dateOfBirth,
    // update-child-profile overwrites region_id with whatever it's sent,
    // so always pass the current one back.
    regionId: child.region_id,
  });
  if (!res.ok) {
    const field = fieldOf(res.field);
    return {
      ok: false,
      error: {
        field,
        message:
          field === "username" ? "That username is already taken." : res.error,
      },
    };
  }
  return { ok: true };
}

export async function setChildPassword(
  childProfileId: string,
  password: string,
): Promise<Result<void>> {
  const res = await invokeFunction<object>("set-child-password", {
    childProfileId,
    password,
  });
  return res.ok ? ok(undefined) : err(res.error);
}
