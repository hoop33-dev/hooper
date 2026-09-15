import { sortByUnitTypePriority } from "@/src/constants/unitTypes";

function row(unit_type: string, position: number) {
  return { unit_type, position };
}

describe("sortByUnitTypePriority", () => {
  it("puts Reps before Weight regardless of input order", () => {
    const result = sortByUnitTypePriority([row("Weight", 0), row("Reps", 1)]);
    expect(result.map((r) => r.unit_type)).toEqual(["Reps", "Weight"]);
  });

  it("matches unit types case-insensitively", () => {
    const result = sortByUnitTypePriority([row("weight", 0), row("reps", 1)]);
    expect(result.map((r) => r.unit_type)).toEqual(["reps", "weight"]);
  });

  it("pushes unknown unit types to the back, keeping their relative order", () => {
    const result = sortByUnitTypePriority([
      row("Custom A", 0),
      row("Reps", 1),
      row("Custom B", 2),
    ]);
    expect(result.map((r) => r.unit_type)).toEqual(["Reps", "Custom A", "Custom B"]);
  });

  it("does not mutate the input array", () => {
    const input = [row("Weight", 0), row("Reps", 1)];
    sortByUnitTypePriority(input);
    expect(input.map((r) => r.unit_type)).toEqual(["Weight", "Reps"]);
  });
});
