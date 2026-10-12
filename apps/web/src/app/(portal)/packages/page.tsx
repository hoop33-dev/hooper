import type { PackageCreateFormData } from "@/src/components/portal/packages/PackageCreateModal";
import { PackagesListShell } from "@/src/components/portal/packages/PackagesListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listPackages } from "@/src/services/package.service";
import { checkPackageSlugAction, createPackageAction } from "./actions";

export default async function PackagesPage() {
  const [packagesResult, profileResult] = await Promise.all([
    listPackages(),
    getCoachProfileId(),
  ]);

  const packages = packagesResult.ok ? packagesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  async function wrappedCreate(data: PackageCreateFormData) {
    "use server";
    return createPackageAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Packages"
        subtitle="Bundle programs and coaches into something athletes can buy"
      />
      {!packagesResult.ok && (
        <div className="border-b border-red-200 bg-red-50 px-7 py-2 text-xs text-red-600">
          Couldn&apos;t load packages: {packagesResult.error}
        </div>
      )}
      <PackagesListShell
        packages={packages}
        createAction={wrappedCreate}
        checkSlugAction={checkPackageSlugAction}
      />
    </div>
  );
}
