import { createClient } from "@/src/lib/supabase/server";

/** Shape every Hooper edge function replies with. */
type FnPayload = {
  ok: boolean;
  error?: string;
  code?: string;
  field?: string;
};

export type InvokeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; field?: string };

const GENERIC = "Something went wrong. Please try again.";

/** Calls a Supabase edge function with the signed-in user's JWT. Both 2xx
 * `{ ok:false }` replies and non-2xx errors (FunctionsHttpError, whose JSON
 * body still carries our message) come back as `{ ok:false, error, code,
 * field }`. */
export async function invokeFunction<T extends object>(
  name: string,
  body: Record<string, unknown>,
): Promise<InvokeResult<T>> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<FnPayload & T>(name, {
    body,
  });

  let payload: (FnPayload & T) | null = data;
  if (error) {
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      payload = null;
    }
  }
  if (!payload) return { ok: false, error: GENERIC };
  if (!payload.ok) {
    return {
      ok: false,
      error: payload.error ?? GENERIC,
      code: payload.code,
      field: payload.field,
    };
  }
  return { ok: true, data: payload };
}
