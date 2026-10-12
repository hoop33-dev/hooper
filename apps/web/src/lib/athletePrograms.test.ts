import { describe, expect, it } from "vitest";
import { mergeAthletePrograms } from "./athletePrograms";

const p = (id: string) => ({ id, name: `Program ${id}` });

describe("mergeAthletePrograms", () => {
  it("lists direct programs first, then team programs", () => {
    expect(
      mergeAthletePrograms([p("a")], [{ name: "Varsity", programs: [p("b")] }]),
    ).toEqual([
      { ...p("a"), viaTeam: null },
      { ...p("b"), viaTeam: "Varsity" },
    ]);
  });

  it("shows a program that's both direct and via a team once, as direct", () => {
    expect(
      mergeAthletePrograms([p("a")], [{ name: "Varsity", programs: [p("a")] }]),
    ).toEqual([{ ...p("a"), viaTeam: null }]);
  });

  it("credits the first team when a program comes via several", () => {
    expect(
      mergeAthletePrograms(
        [],
        [
          { name: "Varsity", programs: [p("a")] },
          { name: "Development", programs: [p("a"), p("b")] },
        ],
      ),
    ).toEqual([
      { ...p("a"), viaTeam: "Varsity" },
      { ...p("b"), viaTeam: "Development" },
    ]);
  });

  it("handles no programs at all", () => {
    expect(mergeAthletePrograms([], [])).toEqual([]);
  });
});
