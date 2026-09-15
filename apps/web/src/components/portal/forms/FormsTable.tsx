"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { FormSummary } from "@hooper/db";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function FormNameCell({ form }: { form: FormSummary }) {
  const initial = form.name.trim().charAt(0).toUpperCase() || "F";
  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div>
        <div className="text-portal-text1 text-[13px] font-bold">
          {form.name}
        </div>
        {form.description && (
          <div className="text-portal-text3 mt-0.5 max-w-xs truncate text-xs">
            {form.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface FormsTableProps {
  forms: FormSummary[];
  onEdit: (form: FormSummary) => void;
}

export function FormsTable({ forms, onEdit }: FormsTableProps) {
  const columns = ["Form", "Questions", "Programs", "Updated"];
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {columns.map((h) => (
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
        {forms.map((form) => (
          <tr
            key={form.id}
            className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <AppLink
                href={`/forms/${form.id}`}
                aria-label={`Open form ${form.name}`}
                className="after:absolute after:inset-0 after:z-0">
                <FormNameCell form={form} />
              </AppLink>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {form.questionCount}
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {form.programCount}
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {formatUpdatedAt(form.updated_at)}
            </td>
            <td className="py-3.5 text-right">
              <button
                type="button"
                onClick={() => onEdit(form)}
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
