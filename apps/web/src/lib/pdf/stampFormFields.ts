import {
  DATE_FIELD_DY_PT,
  DATE_FIELD_H_PT,
  DATE_FIELD_W_PT,
  LETTER_W_PT,
  LOG_CELL_PAD_PT,
  LOG_FIELD_DY_PT,
  LOG_FIELD_H_PT,
  PAGE_MARGIN_PT,
} from "@/src/lib/print/fillableFields";
import { PDFBool, PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";
import { extractTokenHits, type TokenHit } from "./extractTokenPositions";

type StampRect = {
  name: string;
  kind: "date" | "log";
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Turns the marker hits for one field into the rectangle to stamp. */
function rectForField(name: string, group: TokenHit[]): StampRect | null {
  const kind: StampRect["kind"] = name.startsWith("date_") ? "date" : "log";
  const pageIndex = group[0]!.pageIndex;
  if (group.some((h) => h.pageIndex !== pageIndex)) {
    console.warn(`stampFormFields: "${name}" markers span pages — skipping`);
    return null;
  }

  if (kind === "date") {
    const m = group[0]!;
    return {
      name,
      kind,
      pageIndex,
      x: m.xPt,
      y: m.yPt + DATE_FIELD_DY_PT,
      width: DATE_FIELD_W_PT,
      height: DATE_FIELD_H_PT,
    };
  }

  const left = group.find((h) => h.edge === "L");
  const right = group.find((h) => h.edge === "R");
  if (!left) {
    console.warn(`stampFormFields: "${name}" missing L marker — skipping`);
    return null;
  }
  const rightEdge = right
    ? right.xPt + right.widthPt
    : LETTER_W_PT - PAGE_MARGIN_PT - LOG_CELL_PAD_PT;
  return {
    name,
    kind,
    pageIndex,
    x: left.xPt,
    y: left.yPt + LOG_FIELD_DY_PT,
    width: Math.max(24, rightEdge - left.xPt),
    height: LOG_FIELD_H_PT,
  };
}

/** Groups marker hits by field name, resolves each to a stamp rectangle, and
 * sorts them into reading order (top-to-bottom, then left-to-right) so the
 * stamped fields get a sensible Tab order. */
function buildStampRects(hits: TokenHit[]): StampRect[] {
  const byName = new Map<string, TokenHit[]>();
  for (const hit of hits) {
    const list = byName.get(hit.fieldName);
    if (list) list.push(hit);
    else byName.set(hit.fieldName, [hit]);
  }

  const rects: StampRect[] = [];
  for (const [name, group] of byName) {
    const rect = rectForField(name, group);
    if (rect) rects.push(rect);
  }
  rects.sort((a, b) => a.pageIndex - b.pageIndex || b.y - a.y || a.x - b.x);
  return rects;
}

/** Adds interactive AcroForm text fields to a Chromium-rendered program-export
 * PDF, one per `HFF__…` marker token left in the HTML by `ProgramExportDocument`
 * (a per-session Date field, and one per set row in the Logged column).
 *
 * Best-effort: any failure (parse error, no markers found) logs and returns the
 * original bytes — a missing form field must never break the export itself. */
export async function stampFormFields(
  pdfBytes: Uint8Array,
): Promise<Uint8Array> {
  let hits: TokenHit[];
  try {
    hits = await extractTokenHits(pdfBytes);
  } catch (err) {
    console.warn("stampFormFields: token extraction failed", err);
    return pdfBytes;
  }
  if (hits.length === 0) return pdfBytes;

  const rects = buildStampRects(hits);
  if (rects.length === 0) return pdfBytes;

  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const rect of rects) {
    const page = pages[rect.pageIndex];
    if (!page) continue;
    const field = form.createTextField(rect.name);
    field.addToPage(page, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      font,
      borderWidth: 0,
      textColor: rgb(0, 0, 0),
      // Date fields sit on the black session-header band — give them a white
      // fill so they read as a write-on box. Logged fields keep the grey cell
      // showing through.
      ...(rect.kind === "date" ? { backgroundColor: rgb(1, 1, 1) } : {}),
    });
    field.setFontSize(9);
  }

  for (const page of pages) {
    page.node.set(PDFName.of("Tabs"), PDFName.of("R"));
  }
  // Belt and braces for viewers (Preview.app) that don't trust pdf-lib's
  // generated appearance streams.
  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFBool.True);

  return doc.save({ useObjectStreams: true });
}
