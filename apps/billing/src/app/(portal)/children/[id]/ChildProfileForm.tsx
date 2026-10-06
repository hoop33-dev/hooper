"use client";

import { updateChildAction } from "@/src/app/childActions";
import { ChildFields } from "@/src/components/children/ChildFields";
import { Btn } from "@/src/components/ui/Btn";
import { Card, Label } from "@/src/components/ui/primitives";
import type { ChildFormFields, FieldErrors } from "@/src/lib/validation";
import type { MyChild } from "@hooper/db";
import { useState, useTransition, type FormEvent } from "react";

export function ChildProfileForm({ child }: { child: MyChild }) {
  const [values, setValues] = useState<ChildFormFields>({
    firstName: child.first_name ?? "",
    lastName: child.last_name ?? "",
    dateOfBirth: child.date_of_birth ?? "",
    username: child.username,
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof ChildFormFields>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const { password: _pw, ...fields } = values;
      const res = await updateChildAction(child.profile_id, fields);
      if (!res.ok) {
        setErrors(res.errors);
        if (res.formError) setMessage({ ok: false, text: res.formError });
        return;
      }
      setErrors({});
      setMessage({ ok: true, text: "Saved" });
    });
  }

  return (
    <Card>
      <Label className="mb-3.5">Profile</Label>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ChildFields
          values={values}
          errors={errors}
          onChange={setValues}
          withPassword={false}
          disabled={pending}
        />
        <div className="flex items-center gap-3">
          <Btn type="submit" variant="primary" size="sm" loading={pending}>
            Save changes
          </Btn>
          <span
            role="status"
            className={`text-[12.5px] ${message?.ok ? "text-green" : "text-danger"}`}>
            {message?.text}
          </span>
        </div>
        <div className="text-bp-text3 text-xs">
          Changing their username changes how they sign in to the app.
        </div>
      </form>
    </Card>
  );
}
