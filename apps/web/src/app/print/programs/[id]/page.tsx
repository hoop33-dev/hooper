import { AutoPrint } from "@/src/components/print/AutoPrint";
import { ProgramExportDocument } from "@/src/components/print/ProgramExportDocument";
import { DOC_PAGE_SCRIPT } from "@/src/lib/print/docPageScript";
import { parseWeeksParam, resolveExportWeeks } from "@/src/lib/programExport";
import { getCoachProfile } from "@/src/services/auth.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { getProgramById } from "@/src/services/program.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Program export" };

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function ProgramPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp, coachProfile] = await Promise.all([
    params,
    searchParams,
    getCoachProfile(),
  ]);

  // The print route lives outside the (portal) layout's coach gate, so it
  // enforces its own.
  if (!coachProfile.ok) notFound();

  const [program, styles] = await Promise.all([
    getProgramById(id),
    listStyles(),
  ]);
  if (!program.ok) notFound();

  const weeks = resolveExportWeeks(
    parseWeeksParam(firstParam(sp.weeks)),
    program.data.weeks,
  );

  return (
    <>
      <ProgramExportDocument
        program={program.data}
        styles={styles.ok ? styles.data : []}
        coach={firstParam(sp.coach)}
        athlete={firstParam(sp.athlete)}
        notes={firstParam(sp.notes)}
        weeks={weeks}
      />
      <script dangerouslySetInnerHTML={{ __html: DOC_PAGE_SCRIPT }} />
      <AutoPrint enabled={firstParam(sp.noprint) !== "1"} />
    </>
  );
}
