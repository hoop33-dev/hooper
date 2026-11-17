import { PackageDetailFallback } from "@/src/components/portal/packages/PackageDetailFallback";
import { PackageDetailShell } from "@/src/components/portal/packages/PackageDetailShell";
import {
  getPackageBuyerCounts,
  getPackageBySlug,
  listCoaches,
} from "@/src/services/package.service";
import { listPrograms } from "@/src/services/program.service";
import { listTeams } from "@/src/services/team.service";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  addPackageCoachAction,
  addPackageProgramAction,
  addPackageTeamAction,
  deletePackageAction,
  removePackageCoachAction,
  removePackageProgramAction,
  removePackageTeamAction,
  updatePackageAction,
} from "../actions";

type Props = { params: Promise<{ slug: string }>; children: ReactNode };

/** The header and tabs every package tab shares. Each tab is its own route
 * (`page.tsx`, `contents/`, `buyers/`) rendered as `children`. */
export default function PackageDetailLayout(props: Props) {
  // Streams behind its own boundary so opening a package shows the detail
  // skeleton rather than the packages list's loading.tsx.
  return (
    <Suspense fallback={<PackageDetailFallback />}>
      <PackageDetailContent {...props} />
    </Suspense>
  );
}

async function PackageDetailContent({ params, children }: Props) {
  const { slug } = await params;
  // Everything is keyed by slug, so nothing waits on the package's id.
  const [packageResult, programsResult, coachesResult, teamsResult, counts] =
    await Promise.all([
      getPackageBySlug(slug),
      listPrograms(),
      listCoaches(),
      listTeams(),
      getPackageBuyerCounts(slug),
    ]);
  // RLS hides soft-deleted packages, so a deleted slug lands here too.
  if (!packageResult.ok) notFound();
  const pkg = packageResult.data;

  return (
    <PackageDetailShell
      pkg={pkg}
      allPrograms={programsResult.ok ? programsResult.data : []}
      allCoaches={coachesResult.ok ? coachesResult.data : []}
      allTeams={teamsResult.ok ? teamsResult.data : []}
      buyers={counts.ok ? counts.data : null}
      updateAction={updatePackageAction}
      deleteAction={deletePackageAction}
      addProgramAction={addPackageProgramAction}
      removeProgramAction={removePackageProgramAction}
      addCoachAction={addPackageCoachAction}
      removeCoachAction={removePackageCoachAction}
      addTeamAction={addPackageTeamAction}
      removeTeamAction={removePackageTeamAction}>
      {children}
    </PackageDetailShell>
  );
}
