"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

/**
 * The detail-page counterpart of `useOptimisticList`: a local mirror of one
 * server-provided entity that applies each edit straight away, runs its
 * action, and rolls back + surfaces the error if the action fails. A
 * `router.refresh()` follows either way, and the refreshed props replace the
 * local copy wholesale so the server always has the last word.
 */
export function useOptimisticDetail<T>(server: T) {
  const router = useRouter();
  const [local, setLocal] = useState(server);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocal(server);
  }, [server]);

  async function mutate(
    patch: (prev: T) => T,
    action: () => Promise<ActionResult<unknown>>,
  ): Promise<ActionResult> {
    // A render snapshot: rolling back also undoes any sibling edit that
    // overlapped this one (e.g. several picker adds in flight). The refresh
    // below restores whatever the server did record.
    const rollback = local;
    setLocal(patch);
    setError(null);
    const result = await action();
    if (!result.ok) {
      setLocal(rollback);
      setError(result.error ?? "Something went wrong.");
    }
    router.refresh();
    return { ok: result.ok, error: result.error };
  }

  return { local, error, mutate };
}
