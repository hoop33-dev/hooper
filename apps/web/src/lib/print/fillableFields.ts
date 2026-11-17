/** Fillable-form-field plumbing for the program-export PDF.
 *
 * Chromium's `page.pdf()` can't emit interactive AcroForm fields, so the
 * export renders the HTML as normal and then *stamps* text fields onto the
 * finished PDF (see `lib/pdf/stampFormFields.ts`). To place each field without
 * re-deriving Chromium's flowing pagination, `ProgramExportDocument` renders an
 * invisible, layout-neutral marker token at every field position; the stamper
 * reads those tokens' real coordinates back out of the rendered PDF text layer.
 *
 * Field names and marker tokens are ASCII `[A-Za-z0-9_]` only: no "." (pdf-lib
 * treats it as a field-hierarchy separator) and no "-" (pdf.js can split a text
 * run on it, and it costs marker width).
 */

/** US Letter, in PDF points (1/72"). Chromium emits `MediaBox [0 0 612 792]`. */
export const LETTER_W_PT = 612;
export const LETTER_H_PT = 792;

/** Page margin in points. Keep in sync with `<doc-page margin="0.6in">` and the
 * `@media print { .rh/.rf { margin: 0 0.6in } }` rule in `DOC_CSS`. */
export const PAGE_MARGIN_PT = 0.6 * 72; // 43.2

/** Width of a stamped Date field — matches `.sessdate .rule { width: 96px }`. */
export const DATE_FIELD_W_PT = 96 * (72 / 96); // 72

/** Height of a stamped field's box, and the vertical nudge from the marker's
 * text baseline (in the PDF's y-up space) down to the box's bottom edge. These
 * are eyeball-tuned against a real render — adjust here, nowhere else. */
export const DATE_FIELD_H_PT = 13;
export const DATE_FIELD_DY_PT = -8;
export const LOG_FIELD_H_PT = 15;
export const LOG_FIELD_DY_PT = -13;

/** Right-inset of the last table column from the page content edge, when the
 * "R" marker is missing and we have to guess the field's right edge. */
export const LOG_CELL_PAD_PT = 6;

const TOKEN_PREFIX = "HFF__";
const TOKEN_RE = /HFF__([A-Za-z0-9_]+?)__([LRX])(?![A-Za-z0-9_])/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Stable, globally-unique name for a session's Date field. `weekNumber` is
 * 1-based; `sessionPosition` is 0-based and only unique within a week, so both
 * are needed. */
export function dateFieldName(
  weekNumber: number,
  sessionPosition: number,
): string {
  return `date_w${pad2(weekNumber)}_s${pad2(sessionPosition)}`;
}

/** Stable, globally-unique name for one set row's Logged field. */
export function logFieldName(
  weekNumber: number,
  sessionPosition: number,
  blockPosition: number,
  exercisePosition: number,
  setIndex: number,
): string {
  return (
    `log_w${pad2(weekNumber)}_s${pad2(sessionPosition)}` +
    `_b${pad2(blockPosition)}_e${pad2(exercisePosition)}_set${pad2(setIndex)}`
  );
}

export type MarkerEdge = "L" | "R" | "X";

/** The text a marker `<span>` carries. `"X"` (the default) is a lone anchor;
 * `"L"`/`"R"` bracket a cell whose left/right edges we both need. */
export function markerToken(fieldName: string, edge: MarkerEdge = "X"): string {
  return `${TOKEN_PREFIX}${fieldName}__${edge}`;
}

export type ParsedMarker = { fieldName: string; edge: MarkerEdge };

export function parseMarkerToken(text: string): ParsedMarker | null {
  const m = TOKEN_RE.exec(text);
  if (!m) return null;
  return { fieldName: m[1]!, edge: m[2] as MarkerEdge };
}
