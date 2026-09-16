import type { ProgramCreateFormData } from "@/src/components/portal/programs/ProgramCreateModal";
import { ProgramsListShell } from "@/src/components/portal/programs/ProgramsListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listForms } from "@/src/services/form.service";
import { listPrograms } from "@/src/services/program.service";
import {
  attachFormToProgramAction,
  createProgramAction,
  deleteProgramAction,
  publishProgramAction,
  updateProgramAction,
} from "./actions";

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [programsResult, formsResult, profileResult, resolvedSearchParams] =
    await Promise.all([
      listPrograms(),
      listForms(),
      getCoachProfileId(),
      searchParams,
    ]);

  const programs = programsResult.ok ? programsResult.data : [];
  const forms = formsResult.ok ? formsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";
  const initialCreateOpen = resolvedSearchParams.create === "1";

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
        forms={forms}
        initialCreateOpen={initialCreateOpen}
        createAction={wrappedCreate}
        updateAction={updateProgramAction}
        deleteAction={deleteProgramAction}
        publishAction={publishProgramAction}
        attachFormAction={attachFormToProgramAction}
      />
    </div>
  );
}
