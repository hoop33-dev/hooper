import type { FormCreateFormData } from "@/src/components/portal/forms/FormCreateModal";
import { FormsListShell } from "@/src/components/portal/forms/FormsListShell";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listForms } from "@/src/services/form.service";
import {
  createFormAction,
  deleteFormAction,
  updateFormAction,
} from "./actions";

export default async function FormsPage() {
  const [formsResult, profileResult] = await Promise.all([
    listForms(),
    getCoachProfileId(),
  ]);

  const forms = formsResult.ok ? formsResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  async function wrappedCreate(data: FormCreateFormData) {
    "use server";
    return createFormAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <FormsListShell
        forms={forms}
        createAction={wrappedCreate}
        updateAction={updateFormAction}
        deleteAction={deleteFormAction}
      />
    </div>
  );
}
