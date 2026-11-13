import {
  parseMarkerToken,
  type MarkerEdge,
} from "@/src/lib/print/fillableFields";
import { extractTextItems } from "unpdf";

/** One marker token located in the rendered PDF. Coordinates are PDF points in
 * the page's user space, origin bottom-left (what `pdf-lib` `addToPage` wants). */
export type TokenHit = {
  pageIndex: number;
  fieldName: string;
  edge: MarkerEdge;
  xPt: number;
  yPt: number;
  /** Advance width of the marker run — used to find a cell's right edge. */
  widthPt: number;
};

/** Scans every page's text layer for `HFF__…` marker tokens and returns where
 * each one landed. Isolated in its own module so the pdf.js dependency is
 * trivially mockable in `stampFormFields` tests. */
export async function extractTokenHits(
  pdfBytes: Uint8Array,
): Promise<TokenHit[]> {
  // unpdf mutates/transfers the buffer it's handed; give it a private copy so
  // the caller can still load the same bytes into pdf-lib afterwards.
  const { items } = await extractTextItems(new Uint8Array(pdfBytes));

  const hits: TokenHit[] = [];
  items.forEach((pageItems, pageIndex) => {
    for (const item of pageItems) {
      const parsed = parseMarkerToken(item.str);
      if (!parsed) continue;
      hits.push({
        pageIndex,
        fieldName: parsed.fieldName,
        edge: parsed.edge,
        xPt: item.x,
        yPt: item.y,
        widthPt: item.width,
      });
    }
  });
  return hits;
}
