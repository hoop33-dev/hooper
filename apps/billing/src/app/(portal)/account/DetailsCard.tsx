"use client";

import { Btn } from "@/src/components/ui/Btn";
import { Field } from "@/src/components/ui/Field";
import { Avatar, Card, Label } from "@/src/components/ui/primitives";
import { fullName, initials } from "@/src/lib/format";
import type { MyProfile } from "@/src/services/profile.service";
import { useActionState } from "react";
import { updateDetailsAction, type DetailsState } from "./actions";

export function DetailsCard({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState<DetailsState, FormData>(
    updateDetailsAction,
    { status: "idle" },
  );

  return (
    <Card>
      <Label className="mb-3.5">Your details</Label>
      <div className="mb-4 flex items-center gap-3.5">
        <Avatar
          initials={initials(profile.firstName, profile.lastName)}
          size={52}
          tone="navy"
        />
        <div className="min-w-0">
          <div className="text-bp-text1 truncate text-[15px] font-bold">
            {fullName(profile.firstName, profile.lastName) || profile.username}
          </div>
          {profile.username && (
            <div className="text-bp-text2 text-[12.5px]">
              @{profile.username}
            </div>
          )}
        </div>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="First name"
            name="firstName"
            autoComplete="given-name"
            defaultValue={profile.firstName ?? ""}
            error={state.errors?.firstName}
          />
          <Field
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            defaultValue={profile.lastName ?? ""}
            error={state.errors?.lastName}
          />
        </div>
        <Field
          label="Email"
          value={profile.email ?? ""}
          readOnly
          disabled
          hint="Contact support to change your email"
        />
        <Field
          label="Username"
          value={profile.username ?? ""}
          readOnly
          disabled
          hint="Your sign-in for the app and billing"
        />
        <div className="flex items-center gap-3">
          <Btn type="submit" variant="primary" size="sm" loading={pending}>
            Save changes
          </Btn>
          <span role="status" className="text-[12.5px]">
            {state.status === "saved" && (
              <span className="text-green">Saved</span>
            )}
            {state.message && (
              <span className="text-danger">{state.message}</span>
            )}
          </span>
        </div>
      </form>
    </Card>
  );
}
