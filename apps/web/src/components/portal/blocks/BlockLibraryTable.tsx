import type { SessionTemplateSummary } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function TemplateNameCell({ template }: { template: SessionTemplateSummary }) {
  const initial = template.name.trim().charAt(0).toUpperCase() || "B";
  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div className="text-portal-text1 text-[13px] font-bold">
        {template.name}
      </div>
    </div>
  );
}

interface BlockLibraryTableProps {
  templates: SessionTemplateSummary[];
  onEdit: (template: SessionTemplateSummary) => void;
}

export function BlockLibraryTable({
  templates,
  onEdit,
}: BlockLibraryTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {["Template", "Blocks", "Updated"].map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
              {h}
            </th>
          ))}
          <th className="w-20" />
        </tr>
      </thead>
      <tbody>
        {templates.map((template) => (
          <tr
            key={template.id}
            className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <AppLink
                href={`/blocks/${template.id}`}
                className="block after:absolute after:inset-0 after:z-0">
                <TemplateNameCell template={template} />
              </AppLink>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {template.blocks.length === 1
                ? "1 block"
                : `${template.blocks.length} blocks`}
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {formatUpdatedAt(template.updated_at)}
            </td>
            <td className="py-3.5 text-right">
              <button
                type="button"
                onClick={() => onEdit(template)}
                className="border-portal-border text-portal-text2 hover:bg-portal-card relative z-10 rounded-lg border px-3 py-1 text-xs font-semibold">
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
