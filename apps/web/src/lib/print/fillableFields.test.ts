import { describe, expect, it } from "vitest";
import {
  dateFieldName,
  logFieldName,
  markerToken,
  parseMarkerToken,
} from "./fillableFields";

describe("fillableFields — names", () => {
  it("zero-pads and scopes the date field to week + session", () => {
    expect(dateFieldName(1, 0)).toBe("date_w01_s00");
    expect(dateFieldName(12, 3)).toBe("date_w12_s03");
  });

  it("builds a unique log field name from the full position path", () => {
    expect(logFieldName(1, 0, 0, 0, 0)).toBe("log_w01_s00_b00_e00_set00");
    expect(logFieldName(2, 1, 3, 2, 11)).toBe("log_w02_s01_b03_e02_set11");
  });

  it("keeps names to [A-Za-z0-9_] (no '.' or '-')", () => {
    for (const n of [dateFieldName(3, 4), logFieldName(3, 4, 5, 6, 7)]) {
      expect(n).toMatch(/^[A-Za-z0-9_]+$/);
    }
  });
});

describe("fillableFields — marker tokens", () => {
  it("round-trips through parseMarkerToken", () => {
    const name = logFieldName(1, 2, 0, 1, 4);
    expect(parseMarkerToken(markerToken(name))).toEqual({
      fieldName: name,
      edge: "X",
    });
    expect(parseMarkerToken(markerToken(name, "L"))).toEqual({
      fieldName: name,
      edge: "L",
    });
    expect(parseMarkerToken(markerToken(name, "R"))).toEqual({
      fieldName: name,
      edge: "R",
    });
  });

  it("finds a token even when pdf.js pads it with surrounding text", () => {
    const tok = markerToken(dateFieldName(1, 0), "X");
    expect(parseMarkerToken(`  ${tok} `)?.fieldName).toBe("date_w01_s00");
  });

  it("rejects non-tokens", () => {
    expect(parseMarkerToken("Back Squat")).toBeNull();
    expect(parseMarkerToken("HFF__nope")).toBeNull();
    expect(parseMarkerToken("HFF__x__Z")).toBeNull();
    expect(parseMarkerToken("")).toBeNull();
  });
});
