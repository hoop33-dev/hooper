import { describe, expect, it } from "vitest";
import { mergeAthletePrograms } from "./athletePrograms";

const p = (id: string) => ({ id, name: `Program ${id}` });
const pkg = { id: "k1", name: "Starter" };

describe("mergeAthletePrograms", () => {
  it("lists direct programs first, then package, then team programs", () => {
    expect(
      mergeAthletePrograms(
        [p("a")],
        [{ ...p("b"), package: pkg }],
        [{ id: "t1", name: "Varsity", programs: [p("c")] }],
      ),
    ).toEqual([
      { ...p("a"), key: "direct-a", via: { kind: "direct" } },
      {
        ...p("b"),
        key: "package-k1-b",
        via: { kind: "package", package: pkg },
      },
      { ...p("c"), key: "team-t1-c", via: { kind: "team", team: "Varsity" } },
    ]);
  });

  it("lists a program once per source it comes through", () => {
    const rows = mergeAthletePrograms(
      [p("a")],
      [{ ...p("a"), package: pkg }],
      [
        { id: "t1", name: "Varsity", programs: [p("a")] },
        { id: "t2", name: "Development", programs: [p("a")] },
      ],
    );
    expect(rows.map((r) => r.key)).toEqual([
      "direct-a",
      "package-k1-a",
      "team-t1-a",
      "team-t2-a",
    ]);
  });

  it("handles no programs at all", () => {
    expect(mergeAthletePrograms([], [], [])).toEqual([]);
  });
});
