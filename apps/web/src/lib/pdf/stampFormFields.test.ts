import { PDFDocument } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TokenHit } from "./extractTokenPositions";

const extractTokenHits = vi.hoisted(() => vi.fn<() => Promise<TokenHit[]>>());
vi.mock("./extractTokenPositions", () => ({ extractTokenHits }));

// Imported after the mock is registered.
const { stampFormFields } = await import("./stampFormFields");

/** A blank 2-page Letter PDF to stamp onto. */
async function blankPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.addPage([612, 792]);
  return doc.save();
}

function hit(
  partial: Partial<TokenHit> & Pick<TokenHit, "fieldName" | "edge">,
): TokenHit {
  return { pageIndex: 0, xPt: 100, yPt: 500, widthPt: 60, ...partial };
}

async function fieldsOf(bytes: Uint8Array) {
  const form = (await PDFDocument.load(bytes)).getForm();
  return form.getFields().map((f) => f.getName());
}

describe("stampFormFields", () => {
  beforeEach(() => {
    extractTokenHits.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns the input untouched when no markers are found", async () => {
    extractTokenHits.mockResolvedValue([]);
    const input = await blankPdf();
    const out = await stampFormFields(input);
    expect(out).toBe(input);
  });

  it("creates one text field per distinct marker name", async () => {
    extractTokenHits.mockResolvedValue([
      hit({ fieldName: "date_w01_s00", edge: "X", xPt: 480, yPt: 700 }),
      hit({
        fieldName: "log_w01_s00_b00_e00_set00",
        edge: "L",
        xPt: 440,
        yPt: 600,
      }),
      hit({
        fieldName: "log_w01_s00_b00_e00_set00",
        edge: "R",
        xPt: 500,
        yPt: 600,
      }),
    ]);
    expect(await fieldsOf(await stampFormFields(await blankPdf()))).toEqual(
      expect.arrayContaining(["date_w01_s00", "log_w01_s00_b00_e00_set00"]),
    );
    expect(
      (await fieldsOf(await stampFormFields(await blankPdf()))).length,
    ).toBe(2);
  });

  it("spans a log field from its L marker to (R marker x + width)", async () => {
    extractTokenHits.mockResolvedValue([
      hit({
        fieldName: "log_w01_s00_b00_e00_set00",
        edge: "L",
        xPt: 440,
        yPt: 600,
        widthPt: 66,
      }),
      hit({
        fieldName: "log_w01_s00_b00_e00_set00",
        edge: "R",
        xPt: 500,
        yPt: 600,
        widthPt: 66,
      }),
    ]);
    const doc = await PDFDocument.load(await stampFormFields(await blankPdf()));
    const widget = doc
      .getForm()
      .getTextField("log_w01_s00_b00_e00_set00")
      .acroField.getWidgets()[0]!;
    const r = widget.getRectangle();
    expect(r.x).toBeCloseTo(440);
    // right edge = 500 + 66
    expect(r.x + r.width).toBeCloseTo(566);
  });

  it("skips a log field whose markers landed on different pages", async () => {
    extractTokenHits.mockResolvedValue([
      hit({ fieldName: "log_x", edge: "L", pageIndex: 0 }),
      hit({ fieldName: "log_x", edge: "R", pageIndex: 1 }),
      hit({ fieldName: "date_w01_s00", edge: "X", pageIndex: 0 }),
    ]);
    expect(await fieldsOf(await stampFormFields(await blankPdf()))).toEqual([
      "date_w01_s00",
    ]);
  });

  it("skips a log field missing its L marker", async () => {
    extractTokenHits.mockResolvedValue([
      hit({ fieldName: "log_x", edge: "R", xPt: 500 }),
    ]);
    expect(await fieldsOf(await stampFormFields(await blankPdf()))).toEqual([]);
  });
});
