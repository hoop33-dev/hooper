import type { ProgramCreateFormData } from "@/src/components/portal/programs/ProgramCreateModal";
import { ProgramsListShell } from "@/src/components/portal/programs/ProgramsListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listPrograms } from "@/src/services/program.service";
import {
  createProgramAction,
  deleteProgramAction,
  publishProgramAction,
  updateProgramAction,
} from "./actions";

export default async function ProgramsPage() {
  const [programsResult, profileResult] = await Promise.all([
    listPrograms(),
    getCoachProfile(),
  ]);

  const programs = programsResult.ok ? programsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  async function wrappedCreate(data: ProgramCreateFormData) {
    "use server";
    return createProgramAction({ ...data, weeks: 0, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Programs"
        subtitle="Create and manage training programs for your athletes"
      />
      <ProgramsListShell
        programs={programs}
        createAction={wrappedCreate}
        updateAction={updateProgramAction}
        deleteAction={deleteProgramAction}
        publishAction={publishProgramAction}
      />
    </div>
  );
}
