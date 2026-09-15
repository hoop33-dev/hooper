import { BlockLibraryListShell } from "@/src/components/portal/blocks/BlockLibraryListShell";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import {
  createSessionTemplateAction,
  deleteSessionTemplateAction,
  updateSessionTemplateNameAction,
} from "./actions";

export default async function BlockLibraryPage() {
  const [templatesResult, profileResult] = await Promise.all([
    listSessionTemplates(),
    getCoachProfileId(),
  ]);

  const templates = templatesResult.ok ? templatesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  async function wrappedCreate(name: string) {
    "use server";
    return createSessionTemplateAction({ name, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <BlockLibraryListShell
        templates={templates}
        createAction={wrappedCreate}
        renameAction={updateSessionTemplateNameAction}
        deleteAction={deleteSessionTemplateAction}
      />
    </div>
  );
}
