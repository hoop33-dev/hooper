"use client";

import { PACKAGE_LINK_PREFIX } from "@/src/lib/packages";
import { useState } from "react";
import { LockIcon, XIcon } from "../ui/icons";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

type ActionResult = { ok: boolean; error?: string };

function DrawerHeader({
  packageName,
  onClose,
}: {
  packageName: string;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-5">
      <div>
        <div className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
          Package details
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">{packageName}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="border-portal-border text-portal-text2 flex h-8 w-8 items-center justify-center rounded-full border">
        <XIcon />
      </button>
    </div>
  );
}

function PackageIdField({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-portal-text2 text-xs font-semibold">
        Package ID
      </span>
      <div className="border-portal-border bg-portal-bg flex h-11 items-center truncate rounded-lg border px-3.5 text-sm">
        <span className="text-portal-text3">{PACKAGE_LINK_PREFIX}</span>
        <span className="text-portal-text1 font-semibold">{slug}</span>
      </div>
      <p className="text-portal-text3 flex items-center gap-1.5 text-xs">
        <LockIcon />
        Permanent, so shared links always work.
      </p>
    </div>
  );
}

function DangerZone({
  slug,
  onDelete,
}: {
  slug: string;
  onDelete: () => Promise<ActionResult>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await onDelete();
    // On success the page navigates away — stay in the deleting state until
    // it does rather than flashing the bar back to idle.
    if (!result.ok) {
      setDeleting(false);
      setError(result.error ?? "Failed to delete package.");
    }
  }

  return (
    <div className="border-portal-border mt-1 border-t pt-4">
      <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
        Danger zone
      </div>
      <p className="text-portal-text3 mb-2.5 text-xs leading-relaxed">
        The link will stop working and no one can buy the package. The ID{" "}
        <b className="text-portal-text2 font-semibold">{slug}</b> can&apos;t be
        reused.
      </p>
      <InlineConfirmBar
        idleLabel="Delete this package"
        confirmLabel="Delete this package?"
        onConfirm={handleDelete}
        loading={deleting}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** Side drawer for the package's name, its (read-only) ID, and deletion —
 * same shape as TeamEditDrawer / FormEditDrawer. Pricing, programs and
 * coaches stay editable inline on the page. */
export function PackageEditDrawer({
  name,
  slug,
  onSave,
  onDelete,
  onClose,
}: {
  name: string;
  slug: string;
  onSave: (name: string) => Promise<ActionResult>;
  onDelete: () => Promise<ActionResult>;
  onClose: () => void;
}) {
  const onBackdropClick = useModalDismiss(onClose);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();
  const dirty = trimmed !== name;

  async function handleSave() {
    if (!dirty || !trimmed || saving) return;
    setSaving(true);
    setError(null);
    const result = await onSave(trimmed);
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Failed to save package.");
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="bg-portal-card flex h-full w-full max-w-md flex-col shadow-2xl">
        <DrawerHeader packageName={name} onClose={onClose} />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <PortalInput
            label="Package name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
          <PackageIdField slug={slug} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <DangerZone slug={slug} onDelete={onDelete} />
        </div>
        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Discard
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || !trimmed || saving}>
            {saving ? "Saving…" : "Save changes"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
