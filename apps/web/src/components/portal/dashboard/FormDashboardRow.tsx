import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { FormDashboardRow as FormDashboardRowData } from "@hooper/db";

export function FormDashboardRow({ form }: { form: FormDashboardRowData }) {
  const initial = form.name.trim().charAt(0).toUpperCase() || "F";
  return (
    <AppLink
      href={`/forms/${form.id}`}
      className="hover:bg-portal-bg flex items-center gap-3 px-5 py-3.5 transition-colors">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {form.name}
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">
          {form.questionCount}{" "}
          {form.questionCount === 1 ? "question" : "questions"}
        </div>
      </div>
      <div className="text-portal-text2 text-xs">
        {form.programCount} {form.programCount === 1 ? "program" : "programs"}
      </div>
    </AppLink>
  );
}
