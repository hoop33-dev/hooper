import { describe, expect, it } from "vitest";
import {
  applyFirstRoundToAll,
  applyStyleToAll,
  applyUnitTypesToAll,
  applyVariantToAll,
  buildDefaultSlots,
  copySlotValueToAllBelow,
  mostCommon,
  resizeSetConfigs,
  updateSetUnitTypes,
  type SetConfigState,
} from "./setConfig";

function makeConfig(overrides: Partial<SetConfigState> = {}): SetConfigState {
  return {
    slots: buildDefaultSlots(["Reps"]),
    variantId: "ex-base",
    styleId: "",
    ...overrides,
  };
}

describe("resizeSetConfigs", () => {
  it("grows by deep-copying the last set's full config, not just its values", () => {
    const set1 = makeConfig({
      slots: [
        {
          unit_type: "Shots",
          value_unit: null,
          value: 10,
          value_entered_by: "coach",
        },
      ],
      variantId: "ex-5spot",
      styleId: "style-warmup",
    });
    const grown = resizeSetConfigs([set1], 2);
    expect(grown).toHaveLength(2);
    expect(grown[1]).toEqual(set1);
    // Deep-copied, not the same reference — editing one shouldn't leak.
    expect(grown[1]).not.toBe(set1);
    expect(grown[1]!.slots).not.toBe(set1.slots);
  });

  it("1 -> many always copies set 1 (not defaults) into every new set", () => {
    const set1 = makeConfig({
      slots: [
        {
          unit_type: "Time",
          value_unit: "sec",
          value: 45,
          value_entered_by: "coach",
        },
      ],
    });
    const grown = resizeSetConfigs([set1], 4);
    expect(grown.every((c) => c.slots[0]!.unit_type === "Time")).toBe(true);
    expect(grown.every((c) => c.slots[0]!.value === 45)).toBe(true);
  });

  it("3 -> 4 copies set 3 (the last one), not set 1", () => {
    const set1 = makeConfig({ variantId: "ex-a" });
    const set2 = makeConfig({ variantId: "ex-b" });
    const set3 = makeConfig({ variantId: "ex-c" });
    const grown = resizeSetConfigs([set1, set2, set3], 4);
    expect(grown[3]!.variantId).toBe("ex-c");
  });

  it("truncates when shrinking", () => {
    const configs = [makeConfig(), makeConfig(), makeConfig()];
    expect(resizeSetConfigs(configs, 1)).toHaveLength(1);
  });
});

describe("updateSetUnitTypes", () => {
  it("preserves a surviving unit type's existing value", () => {
    const configs = [
      makeConfig({
        slots: [
          {
            unit_type: "Shots",
            value_unit: null,
            value: 10,
            value_entered_by: "coach",
          },
          {
            unit_type: "Makes",
            value_unit: null,
            value: 7,
            value_entered_by: "coach",
          },
        ],
      }),
    ];
    const updated = updateSetUnitTypes(configs, 0, ["Shots"]);
    expect(updated[0]!.slots).toEqual([
      {
        unit_type: "Shots",
        value_unit: null,
        value: 10,
        value_entered_by: "coach",
      },
    ]);
  });

  it("gives a newly-added unit type a fresh default value", () => {
    const configs = [makeConfig({ slots: buildDefaultSlots(["Shots"]) })];
    // sortUnitTypes reorders to the canonical priority (Weight before
    // Shots), regardless of the order they were picked in.
    const updated = updateSetUnitTypes(configs, 0, ["Shots", "Weight"]);
    expect(updated[0]!.slots.map((s) => s.unit_type)).toEqual([
      "Weight",
      "Shots",
    ]);
    expect(updated[0]!.slots[0]!.value).toBe(0); // Weight defaults to 0
  });

  it("only touches the targeted set", () => {
    const configs = [makeConfig(), makeConfig()];
    const updated = updateSetUnitTypes(configs, 0, ["Weight"]);
    expect(updated[1]!.slots[0]!.unit_type).toBe("Reps"); // untouched
  });
});

describe("copySlotValueToAllBelow", () => {
  it("copies a set's slot value down to every set below it at the same slot index", () => {
    const configs = [
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 12,
            value_entered_by: "coach",
          },
        ],
      }),
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 1,
            value_entered_by: "coach",
          },
        ],
      }),
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 1,
            value_entered_by: "coach",
          },
        ],
      }),
    ];
    const updated = copySlotValueToAllBelow(configs, 0, 0);
    expect(updated.map((c) => c.slots[0]!.value)).toEqual([12, 12, 12]);
  });

  it("leaves sets above the source set untouched", () => {
    const configs = [
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 1,
            value_entered_by: "coach",
          },
        ],
      }),
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 2,
            value_entered_by: "coach",
          },
        ],
      }),
    ];
    const updated = copySlotValueToAllBelow(configs, 1, 0);
    expect(updated[0]!.slots[0]!.value).toBe(1);
  });

  it("skips a set that has no slot at that index", () => {
    const configs = [
      makeConfig({
        slots: [
          {
            unit_type: "Reps",
            value_unit: null,
            value: 9,
            value_entered_by: "coach",
          },
        ],
      }),
      makeConfig({ slots: [] }),
    ];
    expect(() => copySlotValueToAllBelow(configs, 0, 0)).not.toThrow();
    expect(copySlotValueToAllBelow(configs, 0, 0)[1]!.slots).toEqual([]);
  });
});

describe("apply-to-all helpers", () => {
  it("applyUnitTypesToAll overwrites every set's unit types", () => {
    const configs = [makeConfig(), makeConfig()];
    const updated = applyUnitTypesToAll(configs, ["Shots", "Makes"]);
    for (const c of updated) {
      expect(c.slots.map((s) => s.unit_type)).toEqual(["Shots", "Makes"]);
    }
  });

  it("applyVariantToAll overwrites every set's variant", () => {
    const configs = [
      makeConfig({ variantId: "a" }),
      makeConfig({ variantId: "b" }),
    ];
    const updated = applyVariantToAll(configs, "ex-new");
    expect(updated.every((c) => c.variantId === "ex-new")).toBe(true);
  });

  it("applyStyleToAll overwrites every set's style", () => {
    const configs = [makeConfig({ styleId: "a" }), makeConfig({ styleId: "" })];
    const updated = applyStyleToAll(configs, "style-warmup");
    expect(updated.every((c) => c.styleId === "style-warmup")).toBe(true);
  });
});

describe("applyFirstRoundToAll", () => {
  it("copies round 1's units, variant, and style onto every other round", () => {
    const round1 = makeConfig({
      slots: [
        { unit_type: "Shots", value_unit: null, value: 10, value_entered_by: "coach" },
      ],
      variantId: "ex-5spot",
      styleId: "style-warmup",
    });
    const round2 = makeConfig({ variantId: "ex-base", styleId: "" });
    const updated = applyFirstRoundToAll([round1, round2]);
    expect(updated[1]).toEqual({
      slots: [
        { unit_type: "Shots", value_unit: null, value: 0, value_entered_by: "coach" },
      ],
      variantId: "ex-5spot",
      styleId: "style-warmup",
    });
  });

  it("leaves round 1 itself untouched", () => {
    const round1 = makeConfig({ variantId: "ex-5spot" });
    const round2 = makeConfig();
    const updated = applyFirstRoundToAll([round1, round2]);
    expect(updated[0]).toBe(round1);
  });

  it("preserves a later round's own value for a unit type it shares with round 1", () => {
    const round1 = makeConfig({
      slots: [
        { unit_type: "Reps", value_unit: null, value: 12, value_entered_by: "coach" },
      ],
    });
    const round2 = makeConfig({
      slots: [
        { unit_type: "Reps", value_unit: null, value: 8, value_entered_by: "coach" },
      ],
    });
    const updated = applyFirstRoundToAll([round1, round2]);
    // Same unit type as round 1, but round 2 keeps its own value (8, not 12)
    // — only the setup (units/variant/style) syncs, not the numbers.
    expect(updated[1]!.slots[0]!.value).toBe(8);
  });

  it("is a no-op on an empty list", () => {
    expect(applyFirstRoundToAll([])).toEqual([]);
  });
});

describe("mostCommon", () => {
  it("returns the value used by the most entries", () => {
    expect(mostCommon(["a", "a", "b"])).toBe("a");
  });

  it("breaks ties by whichever appears first", () => {
    expect(mostCommon(["b", "a", "a", "b"])).toBe("b");
  });

  it("returns the single value for a uniform list", () => {
    expect(mostCommon(["a", "a", "a"])).toBe("a");
  });

  it("returns an empty string for an empty list", () => {
    expect(mostCommon([])).toBe("");
  });
});
