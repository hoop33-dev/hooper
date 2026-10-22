import { PackageDetailShell } from "@/src/components/portal/packages/PackageDetailShell";
import {
  PackageHeaderSkeleton,
  PackageOverviewSkeleton,
} from "@/src/components/portal/packages/PackageDetailSkeleton";
import {
  getPackageBySlug,
  listCoaches,
  listPackageBuyers,
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
    <Suspense
      fallback={
        <div className="flex h-full flex-col overflow-hidden">
          <PackageHeaderSkeleton />
          <PackageOverviewSkeleton />
        </div>
      }>
      <PackageDetailContent {...props} />
    </Suspense>
  );
}

async function PackageDetailContent({ params, children }: Props) {
  const { slug } = await params;
  const packageResult = await getPackageBySlug(slug);
  // RLS hides soft-deleted packages, so a deleted slug lands here too.
  if (!packageResult.ok) notFound();
  const pkg = packageResult.data;

  const [programsResult, coachesResult, teamsResult, buyersResult] =
    await Promise.all([
      listPrograms(),
      listCoaches(),
      listTeams(),
      listPackageBuyers(pkg.id),
    ]);
  const buyers = buyersResult.ok ? buyersResult.data : [];

  return (
    <PackageDetailShell
      pkg={pkg}
      allPrograms={programsResult.ok ? programsResult.data : []}
      allCoaches={coachesResult.ok ? coachesResult.data : []}
      allTeams={teamsResult.ok ? teamsResult.data : []}
      buyers={{
        active: new Set(
          buyers.filter((b) => b.is_active).map((b) => b.profile_id),
        ).size,
        total: buyers.length,
      }}
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
