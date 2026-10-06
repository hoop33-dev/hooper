"use client";

import { SmartphoneIcon } from "@/src/components/icons";
import { Field } from "@/src/components/ui/Field";
import { cn } from "@/src/lib/cn";
import { dobToIso, isoToDob, maskDob } from "@/src/lib/dob";
import type { ChildFormFields, FieldErrors } from "@/src/lib/validation";
import { PASSWORD_MESSAGE } from "@hooper/shared";
import { useState } from "react";

export const EMPTY_CHILD: ChildFormFields = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  username: "",
  password: "",
};

/** A child's account details (design `ChildFields`). Controlled, so the
 * checkout can validate and submit it together with payment. `dark` for the
 * checkout, light for the household pages. `withPassword` is off when
 * editing an existing child (the password resets separately). */
export function ChildFields({
  values,
  errors,
  onChange,
  dark,
  withPassword = true,
  disabled,
}: {
  values: ChildFormFields;
  errors: FieldErrors<keyof ChildFormFields>;
  onChange: (values: ChildFormFields) => void;
  dark?: boolean;
  withPassword?: boolean;
  disabled?: boolean;
}) {
  const set =
    (key: keyof ChildFormFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [key]: e.target.value });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field
          dark={dark}
          label="Child's first name"
          name="childFirstName"
          autoComplete="off"
          value={values.firstName}
          onChange={set("firstName")}
          error={errors.firstName}
          disabled={disabled}
        />
        <Field
          dark={dark}
          label="Last name"
          name="childLastName"
          autoComplete="off"
          value={values.lastName}
          onChange={set("lastName")}
          error={errors.lastName}
          disabled={disabled}
        />
      </div>
      <DobField
        dark={dark}
        iso={values.dateOfBirth}
        onChange={(iso) => onChange({ ...values, dateOfBirth: iso })}
        error={errors.dateOfBirth}
        disabled={disabled}
      />
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          withPassword && "md:grid-cols-2",
        )}>
        <Field
          dark={dark}
          label="Their username"
          name="childUsername"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="For their app login"
          value={values.username}
          onChange={set("username")}
          error={errors.username}
          disabled={disabled}
        />
        {withPassword && (
          <Field
            dark={dark}
            label="Their password"
            name="childPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={set("password")}
            error={errors.password}
            hint={errors.password ? undefined : PASSWORD_MESSAGE}
            disabled={disabled}
          />
        )}
      </div>
      {withPassword && <LoginNote dark={dark} />}
    </div>
  );
}

function LoginNote({ dark }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2 text-xs leading-normal",
        dark ? "text-white/40" : "text-bp-text3",
      )}>
      <SmartphoneIcon size={14} className="mt-px shrink-0" />
      They sign in to the Hooper app with these details. You stay in charge of
      billing.
    </div>
  );
}

/** DD / MM / YYYY text entry. Keeps the typed text locally (a half-typed
 * date has no ISO form) and reports the ISO value upward on every change. */
function DobField({
  dark,
  iso,
  onChange,
  error,
  disabled,
}: {
  dark?: boolean;
  iso: string;
  onChange: (iso: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(() => isoToDob(iso));
  return (
    <Field
      dark={dark}
      label="Date of birth"
      name="childDateOfBirth"
      inputMode="numeric"
      autoComplete="bday"
      placeholder="DD / MM / YYYY"
      maxLength={14}
      value={text}
      onChange={(e) => {
        const masked = maskDob(e.target.value);
        setText(masked);
        onChange(dobToIso(masked));
      }}
      error={error}
      disabled={disabled}
    />
  );
}
