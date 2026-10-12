import { PackageDetailShell } from "@/src/components/portal/packages/PackageDetailShell";
import { getPackageBySlug, listCoaches } from "@/src/services/package.service";
import { listPrograms } from "@/src/services/program.service";
import { notFound } from "next/navigation";
import {
  addPackageCoachAction,
  addPackageProgramAction,
  deletePackageAction,
  removePackageCoachAction,
  removePackageProgramAction,
  updatePackageAction,
} from "../actions";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [packageResult, programsResult, coachesResult] = await Promise.all([
    getPackageBySlug(slug),
    listPrograms(),
    listCoaches(),
  ]);

  // RLS hides soft-deleted packages, so a deleted slug lands here too.
  if (!packageResult.ok) notFound();

  return (
    <PackageDetailShell
      pkg={packageResult.data}
      allPrograms={programsResult.ok ? programsResult.data : []}
      allCoaches={coachesResult.ok ? coachesResult.data : []}
      updateAction={updatePackageAction}
      deleteAction={deletePackageAction}
      addProgramAction={addPackageProgramAction}
      removeProgramAction={removePackageProgramAction}
      addCoachAction={addPackageCoachAction}
      removeCoachAction={removePackageCoachAction}
    />
  );
}
