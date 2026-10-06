import { describe, expect, it } from "vitest";
import { sortUnitTypes } from "./unitTypes";

describe("sortUnitTypes", () => {
  it("sorts known types into priority order regardless of input order", () => {
    expect(sortUnitTypes(["RPE", "Weight", "Reps"])).toEqual([
      "Reps",
      "Weight",
      "RPE",
    ]);
  });

  it("sorts unknown/custom types after all known types", () => {
    expect(sortUnitTypes(["Custom Unit", "Weight", "Reps"])).toEqual([
      "Reps",
      "Weight",
      "Custom Unit",
    ]);
  });

  it("preserves the relative order of multiple unknown types (stable sort)", () => {
    expect(sortUnitTypes(["Zeta", "Weight", "Alpha"])).toEqual([
      "Weight",
      "Zeta",
      "Alpha",
    ]);
  });

  it("is a no-op reorder for an all-unknown list", () => {
    expect(sortUnitTypes(["Zeta", "Alpha", "Beta"])).toEqual([
      "Zeta",
      "Alpha",
      "Beta",
    ]);
  });
});
