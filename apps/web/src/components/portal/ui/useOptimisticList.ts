"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

/**
 * A local mirror of a server-provided list that applies add/update/remove
 * changes to the UI straight away, then fires `router.refresh()` so the next
 * server render reconciles anything the client can't compute (derived counts,
 * `updated_at`, ordering). Rolls the optimistic change back if the action
 * fails.
 *
 * This is the same optimistic-then-refresh shape as `useProgramAttachments`
 * and the form-question reorder in `useFormEditorState`, generalised for the
 * portal list pages whose create/edit/delete flows otherwise close their
 * modal a full server round-trip before the row actually changes — leaving a
 * ~1s window where it looks like nothing happened (see the
 * router-refresh-modal-gap note).
 */
export function useOptimisticList<T extends { id: string }>(serverItems: T[]) {
  const router = useRouter();
  const [items, setItems] = useState(serverItems);

  // A refresh's new server array replaces the local one wholesale. The
  // optimistic `setItems` calls below never change `serverItems`'s identity,
  // so this only fires once the reconciling refresh (or an unrelated one)
  // lands with fresh props.
  useEffect(() => {
    setItems(serverItems);
  }, [serverItems]);

  /**
   * @param apply   optimistic transform, applied before the action resolves
   * @param action  the server mutation
   * @param settle  optional follow-up once the action succeeds — e.g. swap a
   *                synthesized row for the real one the action returned
   */
  async function mutate<R>(
    apply: (prev: T[]) => T[],
    action: () => Promise<ActionResult<R>>,
    settle?: (prev: T[], data: R) => T[],
  ): Promise<ActionResult<R>> {
    const rollback = items;
    setItems(apply);
    const result = await action();
    if (!result.ok) {
      setItems(rollback);
      return result;
    }
    if (settle && result.data !== undefined) {
      const data = result.data;
      setItems((prev) => settle(prev, data));
    }
    router.refresh();
    return result;
  }

  return { items, mutate };
}
