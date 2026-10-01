import { DetailPageSkeleton } from "@/src/components/portal/ui/DetailPageSkeleton";

/** Mirrors `FormEditorShell`: questions (2/3) beside attached programs.
 * Without this file the forms list's skeleton would show. */
export default function FormDetailLoading() {
  return (
    <DetailPageSkeleton
      gridClassName="lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      columns={[[6], [2]]}
    />
  );
}
