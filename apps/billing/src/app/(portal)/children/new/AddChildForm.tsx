"use client";

import { createChildAction } from "@/src/app/childActions";
import {
  ChildFields,
  EMPTY_CHILD,
} from "@/src/components/children/ChildFields";
import { Btn, BtnLink } from "@/src/components/ui/Btn";
import { Card, Label } from "@/src/components/ui/primitives";
import type { ChildFormFields, FieldErrors } from "@/src/lib/validation";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export function AddChildForm() {
  const router = useRouter();
  const [values, setValues] = useState<ChildFormFields>(EMPTY_CHILD);
  const [errors, setErrors] = useState<FieldErrors<keyof ChildFormFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const res = await createChildAction(values);
      if (!res.ok) {
        setErrors(res.errors);
        setFormError(res.formError ?? null);
        return;
      }
      router.push(`/children/${res.data.id}?created=1`);
    });
  }

  return (
    <Card className="max-w-[640px]">
      <Label className="mb-3.5">Their account</Label>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ChildFields
          values={values}
          errors={errors}
          onChange={setValues}
          disabled={pending}
        />
        {formError && (
          <div role="alert" className="text-danger text-[13px]">
            {formError}
          </div>
        )}
        <div className="flex gap-2">
          <Btn type="submit" variant="primary" size="md" loading={pending}>
            Create account
          </Btn>
          <BtnLink href="/children" variant="quiet" size="md">
            Cancel
          </BtnLink>
        </div>
      </form>
    </Card>
  );
}
