"use client";

import { cn } from "@/src/lib/cn";
import {
  DEFAULT_PRICING_DRAFT,
  draftToPricing,
  normalizeSlugInput,
  PACKAGE_LINK_PREFIX,
  slugifyPackageName,
  validatePackageSlug,
  type PackagePricing,
  type PackagePricingDraft,
} from "@/src/lib/packages";
import { useEffect, useState } from "react";
import { LockIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import {
  packageFieldClass,
  packageLabelClass,
  PackageModal,
} from "./PackageAtoms";
import { PackagePriceFields } from "./PackagePriceFields";

export type PackageCreateFormData = PackagePricing & {
  name: string;
  slug: string;
};

type CreateResult = { ok: boolean; error?: string };

const SLUG_CHECK_DEBOUNCE_MS = 300;

/** Debounced server check that the slug isn't taken (including by a deleted
 * package). `undefined` while a check for the current slug is pending. */
function useSlugAvailability(
  slug: string,
  checkSlug: (slug: string) => Promise<string | null>,
): string | null | undefined {
  const [checked, setChecked] = useState<{
    slug: string;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (validatePackageSlug(slug)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const error = await checkSlug(slug);
      if (!cancelled) setChecked({ slug, error });
    }, SLUG_CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, checkSlug]);

  return checked?.slug === slug ? checked.error : undefined;
}

function SlugField({
  slug,
  error,
  showError,
  onChange,
}: {
  slug: string;
  error: string | null;
  showError: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor="package-slug" className={packageLabelClass}>
        Package ID
      </label>
      <div
        className={packageFieldClass({
          prefixed: true,
          error: showError && !!error,
        })}>
        <span className="text-portal-text3 text-[13px] whitespace-nowrap">
          {PACKAGE_LINK_PREFIX}
        </span>
        <input
          id="package-slug"
          value={slug}
          onChange={(e) => onChange(normalizeSlugInput(e.target.value))}
          placeholder="your-package"
          className="text-portal-text1 h-full min-w-0 flex-1 bg-transparent pr-3 text-[13px] font-semibold outline-none"
        />
      </div>
      {showError && error ? (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      ) : (
        <p className="text-portal-text3 mt-2 flex items-center gap-1.5 text-xs">
          <LockIcon />
          Permanent. The ID can&apos;t be changed after you create the package.
        </p>
      )}
    </div>
  );
}

export function PackageCreateModal({
  onClose,
  onCreate,
  checkSlug,
}: {
  onClose: () => void;
  onCreate: (data: PackageCreateFormData) => Promise<CreateResult>;
  checkSlug: (slug: string) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pricing, setPricing] = useState<PackagePricingDraft>(
    DEFAULT_PRICING_DRAFT,
  );
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availability = useSlugAvailability(slug, checkSlug);
  const slugError = validatePackageSlug(slug) ?? availability ?? null;
  const parsedPricing = draftToPricing(pricing);
  const nameMissing = !name.trim();

  function handleName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugifyPackageName(value));
  }

  async function handleCreate() {
    setTried(true);
    if (saving || nameMissing || slugError || !parsedPricing.ok) return;
    setSaving(true);
    setError(null);
    const result = await onCreate({
      name: name.trim(),
      slug,
      ...parsedPricing.pricing,
    });
    if (result.ok) {
      onClose();
      return;
    }
    setSaving(false);
    setError(result.error ?? "Failed to create package.");
  }

  return (
    <PackageModal title="Create package" onClose={onClose}>
      <div className="flex flex-col gap-[18px] overflow-y-auto px-6 py-6">
        <div>
          <label htmlFor="package-name" className={packageLabelClass}>
            Package name
          </label>
          <input
            id="package-name"
            autoFocus
            value={name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="e.g. Off-Season Performance Pack"
            className={cn(
              packageFieldClass({ error: tried && nameMissing }),
              "placeholder:text-portal-text3 outline-none",
            )}
          />
        </div>
        <SlugField
          slug={slug}
          error={slugError}
          // "Already in use" isn't something the coach can see coming, so it
          // shows straight away; format errors wait for a touch or submit.
          showError={tried || slugTouched || availability != null}
          onChange={(v) => {
            setSlugTouched(true);
            setSlug(v);
          }}
        />
        <PackagePriceFields
          value={pricing}
          onChange={(patch) => setPricing((p) => ({ ...p, ...patch }))}
        />
        {tried && !parsedPricing.ok && (
          <p className="-mt-2 text-xs text-red-500">{parsedPricing.error}</p>
        )}
        <p className="text-portal-text3 text-xs">
          Programs and coaches can be added after creating the package.
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
        <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </PortalButton>
        <PortalButton
          variant="primary"
          onClick={handleCreate}
          disabled={saving}>
          {saving ? "Creating…" : "Create package"}
        </PortalButton>
      </div>
    </PackageModal>
  );
}
