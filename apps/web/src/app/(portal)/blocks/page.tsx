import { BlockLibraryListShell } from "@/src/components/portal/blocks/BlockLibraryListShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import {
  createSessionTemplateAction,
  deleteSessionTemplateAction,
  updateSessionTemplateNameAction,
} from "./actions";

export default async function BlockLibraryPage() {
  const [templatesResult, profileResult] = await Promise.all([
    listSessionTemplates(),
    getCoachProfile(),
  ]);

  const templates = templatesResult.ok ? templatesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  async function wrappedCreate(name: string) {
    "use server";
    return createSessionTemplateAction({ name, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Block Library"
        subtitle="Save blocks and sessions once, reuse them across every program"
      />
      <BlockLibraryListShell
        templates={templates}
        createAction={wrappedCreate}
        renameAction={updateSessionTemplateNameAction}
        deleteAction={deleteSessionTemplateAction}
      />
    </div>
  );
}
