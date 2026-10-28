"use client";

import { formatShortDate } from "@/src/lib/format";
import type {
  AthleteAccount,
  AthleteProfileFields,
} from "@/src/services/athlete.service";
import type { AthleteDetail, RegionRow } from "@hooper/db";
import { useState, type ReactNode } from "react";
import { detailCardClass } from "../ui/DetailListCard";
import { LockIcon, MailIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { useToast } from "../ui/Toast";
import { useAthleteDetailContext } from "./AthleteDetailShell";

type ActionResult = { ok: boolean; error?: string };

const labelClass =
  "text-portal-text3 text-[11px] font-semibold tracking-widest uppercase";

function fieldsFrom(athlete: AthleteDetail): AthleteProfileFields {
  return {
    firstName: athlete.first_name ?? "",
    lastName: athlete.last_name ?? "",
    username: athlete.username ?? "",
    mobile: athlete.mobile,
    dateOfBirth: athlete.date_of_birth,
    regionId: athlete.region_id,
    bio: athlete.bio,
  };
}

function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="border-portal-border flex min-h-[52px] items-center justify-between gap-3 border-b px-5 py-3">
      <h2 className="text-portal-text1 text-sm font-bold">{title}</h2>
      {right}
    </div>
  );
}

function ReadField({
  label,
  value,
  hint,
  wide,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className={labelClass}>{label}</div>
      <div className="text-portal-text1 mt-1 text-sm leading-relaxed whitespace-pre-line">
        {value || <span className="text-portal-text3">—</span>}
      </div>
      {hint && <div className="text-portal-text3 mt-1 text-[11px]">{hint}</div>}
    </div>
  );
}

type ProfileFieldSetter = <K extends keyof AthleteProfileFields>(
  key: K,
  value: AthleteProfileFields[K],
) => void;

function ProfileEditFields({
  draft,
  set,
  email,
  regions,
}: {
  draft: AthleteProfileFields;
  set: ProfileFieldSetter;
  email: string | null;
  regions: RegionRow[];
}) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2">
      <PortalInput
        id="athlete-first-name"
        label="First name"
        value={draft.firstName}
        onChange={(e) => set("firstName", e.target.value)}
        maxLength={50}
      />
      <PortalInput
        id="athlete-last-name"
        label="Last name"
        value={draft.lastName}
        onChange={(e) => set("lastName", e.target.value)}
        maxLength={50}
      />
      <PortalInput
        id="athlete-username"
        label="Username"
        value={draft.username}
        onChange={(e) =>
          set(
            "username",
            e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          )
        }
        maxLength={30}
      />
      <div className="flex flex-col gap-1">
        <span className="text-portal-text2 text-xs font-semibold">Email</span>
        <div className="border-portal-border bg-portal-bg text-portal-text2 flex h-11 items-center gap-2 rounded-lg border px-3.5 text-sm">
          <LockIcon size={12} />
          <span className="truncate">{email ?? "No email"}</span>
        </div>
      </div>
      <PortalInput
        id="athlete-mobile"
        label="Mobile"
        type="tel"
        value={draft.mobile ?? ""}
        onChange={(e) => set("mobile", e.target.value)}
        maxLength={30}
      />
      <PortalInput
        id="athlete-dob"
        label="Date of birth"
        type="date"
        value={draft.dateOfBirth ?? ""}
        onChange={(e) => set("dateOfBirth", e.target.value || null)}
      />
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label
          htmlFor="athlete-region"
          className="text-portal-text2 text-xs font-semibold">
          Location
        </label>
        <select
          id="athlete-region"
          value={draft.regionId ?? ""}
          onChange={(e) => set("regionId", e.target.value || null)}
          className="border-portal-border bg-portal-card text-portal-text1 focus:border-portal-orange focus:ring-portal-orange h-11 w-full rounded-lg border px-3 text-sm focus:ring-1 focus:outline-none">
          <option value="">Not set</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <PortalTextarea
          id="athlete-bio"
          label="Bio"
          rows={3}
          value={draft.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          maxLength={500}
          className="resize-none"
        />
      </div>
    </div>
  );
}

function ProfileReadFields({
  athlete,
  account,
  regionName,
}: {
  athlete: AthleteDetail;
  account: AthleteAccount | null;
  regionName: string | undefined;
}) {
  return (
    <div className="grid gap-[18px] p-5 sm:grid-cols-2">
      <ReadField
        label="Full name"
        value={[athlete.first_name, athlete.last_name]
          .filter(Boolean)
          .join(" ")}
      />
      <ReadField
        label="Username"
        value={athlete.username && `@${athlete.username}`}
      />
      <ReadField
        label="Email"
        value={account?.email}
        hint={
          !account
            ? undefined
            : account.hasRealEmail
              ? "Only the athlete can change their email."
              : "Child account, signs in with their username."
        }
      />
      <ReadField label="Mobile" value={athlete.mobile} />
      <ReadField
        label="Date of birth"
        value={athlete.date_of_birth && formatShortDate(athlete.date_of_birth)}
      />
      <ReadField label="Location" value={regionName} />
      <ReadField label="Bio" value={athlete.bio} wide />
    </div>
  );
}

/** Edit-mode state for the profile card: the draft, and a save that keeps
 * the form open on error. */
function useProfileDraft(
  athlete: AthleteDetail,
  saveProfile: (fields: AthleteProfileFields) => Promise<ActionResult>,
) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => fieldsFrom(athlete));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set: ProfileFieldSetter = (key, value) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return {
    editing,
    draft,
    set,
    saving,
    error,
    start: () => {
      setDraft(fieldsFrom(athlete));
      setError(null);
      setEditing(true);
    },
    discard: () => {
      setError(null);
      setEditing(false);
    },
    save: async () => {
      setSaving(true);
      setError(null);
      const result = await saveProfile({
        ...draft,
        mobile: draft.mobile?.trim() || null,
        bio: draft.bio?.trim() || null,
        dateOfBirth: draft.dateOfBirth || null,
        regionId: draft.regionId || null,
      });
      setSaving(false);
      if (!result.ok) {
        setError(result.error ?? "Couldn't save changes.");
        return;
      }
      // The shell already shows the saved values (optimistic).
      setEditing(false);
      toast.showSuccess("Details saved");
    },
  };
}

/** Profile card: read view with an Edit toggle, saving through the
 * coach_update_athlete_profile RPC. Email is shown but never editable —
 * only the athlete can change where their account's email goes. */
function AthleteProfileForm({ regions }: { regions: RegionRow[] }) {
  const { athlete, account, saveProfile } = useAthleteDetailContext();
  const form = useProfileDraft(athlete, saveProfile);

  return (
    <div className={detailCardClass}>
      <CardHead
        title="Profile"
        right={
          form.editing ? (
            <div className="flex gap-2">
              <PortalButton
                size="sm"
                onClick={form.discard}
                disabled={form.saving}>
                Discard
              </PortalButton>
              <PortalButton
                size="sm"
                variant="primary"
                onClick={form.save}
                disabled={form.saving}>
                {form.saving ? "Saving…" : "Save"}
              </PortalButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={form.start}
              className="text-portal-orange cursor-pointer text-[13px] font-semibold">
              Edit
            </button>
          )
        }
      />
      {form.error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-600">
          {form.error}
        </div>
      )}
      {form.editing ? (
        <ProfileEditFields
          draft={form.draft}
          set={form.set}
          email={account?.email ?? null}
          regions={regions}
        />
      ) : (
        <ProfileReadFields
          athlete={athlete}
          account={account}
          regionName={regions.find((r) => r.id === athlete.region_id)?.name}
        />
      )}
    </div>
  );
}

function AthleteAccountCard() {
  const { athlete, account, passwordReset } = useAthleteDetailContext();
  const facts: [string, string][] = [
    ["Joined", account ? formatShortDate(account.joinedAt) : "—"],
    [
      "Last login",
      athlete.last_sign_in_at
        ? formatShortDate(athlete.last_sign_in_at)
        : "Never",
    ],
  ];
  if (account?.parentName) facts.push(["Parent", account.parentName]);

  return (
    <div className={detailCardClass}>
      <CardHead title="Account" />
      <div className="flex flex-col gap-4 p-5">
        {facts.map(([label, value]) => (
          <ReadField key={label} label={label} value={value} />
        ))}
        <div>
          <PortalButton
            size="sm"
            onClick={passwordReset.send}
            disabled={passwordReset.sending || !!passwordReset.blockedReason}>
            <MailIcon size={13} />
            {passwordReset.sending ? "Sending…" : "Send password reset"}
          </PortalButton>
          <p className="text-portal-text3 mt-2 text-[11px] leading-relaxed">
            {passwordReset.blockedReason ??
              `Emails a reset link to ${account?.email}. You never see or set their password.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The Details tab: the editable profile, and account facts with the
 * password reset. */
export function AthleteDetailsTab({ regions }: { regions: RegionRow[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-7">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AthleteProfileForm regions={regions} />
        <AthleteAccountCard />
      </div>
    </div>
  );
}
