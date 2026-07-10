import type { SessionTemplateSummary } from "@hooper/db";
import { SpinnerIcon } from "../ui/icons";
import { useInlineConfirm } from "../ui/useInlineConfirm";

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

function DeleteTemplateButton({ onDelete }: { onDelete: () => void }) {
  const { armed, confirming, arm, confirm } = useInlineConfirm(onDelete);

  if (confirming) {
    return (
      <span className="border-portal-border flex h-[26px] w-[68px] items-center justify-center rounded-lg border">
        <SpinnerIcon size={13} />
      </span>
    );
  }

  if (armed) {
    return (
      <button
        type="button"
        onClick={confirm}
        className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
        Confirm?
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={arm}
      className="border-portal-border text-portal-text2 hover:bg-portal-bg rounded-lg border px-3 py-1 text-xs font-semibold">
      Delete
    </button>
  );
}

interface BlockLibraryTableProps {
  templates: SessionTemplateSummary[];
  onRename: (template: SessionTemplateSummary) => void;
  onDelete: (template: SessionTemplateSummary) => void;
}

export function BlockLibraryTable({
  templates,
  onRename,
  onDelete,
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
          <tr key={template.id} className="border-portal-border border-b">
            <td className="py-3.5 pr-4">
              <a href={`/blocks/${template.id}`} className="block">
                <TemplateNameCell template={template} />
              </a>
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
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onRename(template)}
                  className="border-portal-border text-portal-text2 hover:bg-portal-bg rounded-lg border px-3 py-1 text-xs font-semibold">
                  Rename
                </button>
                <DeleteTemplateButton onDelete={() => onDelete(template)} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
