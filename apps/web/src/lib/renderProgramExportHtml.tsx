import {
  ProgramExportDocument,
  type ProgramExportDocumentProps,
} from "@/src/components/print/ProgramExportDocument";
import { DOC_PAGE_SCRIPT } from "@/src/lib/print/docPageScript";
import { renderToStaticMarkup } from "react-dom/server";

/** A complete, self-contained HTML document for the program export — the
 * same `<ProgramExportDocument>` the /print page renders, wrapped with a
 * `<head>` and the inlined `<doc-page>` script so it can be fed straight to
 * headless Chromium (`page.setContent`) with no origin to resolve. The logo
 * is already a data URI inside the component; exercise thumbnails stay as
 * absolute URLs and are fetched by the browser. */
export function renderProgramExportHtml(
  props: ProgramExportDocumentProps,
): string {
  const body = renderToStaticMarkup(<ProgramExportDocument {...props} />);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${body}<script>${DOC_PAGE_SCRIPT}</script></body></html>`;
}
