"use client";

import { setChildPasswordAction } from "@/src/app/childActions";
import { Btn } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { Card, Label } from "@/src/components/ui/primitives";
import { PASSWORD_MESSAGE } from "@hooper/shared";
import { useState, useTransition, type FormEvent } from "react";

/** Children have no inbox to reset by email — the guardian sets a new one. */
export function ChildPasswordCard({
  childId,
  firstName,
}: {
  childId: string;
  firstName: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await setChildPasswordAction(childId, password, confirm);
      if (!res.ok) return setError(res.error);
      setDone(true);
      setOpen(false);
      setPassword("");
      setConfirm("");
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <Label className="mb-1">Password</Label>
          <div className="text-bp-text1 text-[13.5px] font-semibold">
            Reset {firstName}&apos;s password
          </div>
          <div className="text-bp-text2 mt-0.5 text-[12.5px]">
            {done ? (
              <span className="text-green">
                Password updated — they can sign in with it now.
              </span>
            ) : (
              "Set a new password for their app login."
            )}
          </div>
        </div>
        {!open && (
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}>
            Reset
          </Btn>
        )}
      </div>
      {open && (
        <form
          noValidate
          onSubmit={submit}
          className="border-bp-border mt-4 flex flex-col gap-3 border-t pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={PASSWORD_MESSAGE}
            />
            <Field
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && (
            <div role="alert" className="text-danger text-[12.5px]">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Btn type="submit" variant="primary" size="sm" loading={pending}>
              Save password
            </Btn>
            <Btn
              variant="quiet"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}>
              Cancel
            </Btn>
          </div>
        </form>
      )}
    </Card>
  );
}
