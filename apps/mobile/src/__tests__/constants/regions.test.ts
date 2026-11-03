import { NZ_REGIONS } from "@/src/constants/regions";

describe("NZ_REGIONS", () => {
  it("is a non-empty array", () => {
    expect(NZ_REGIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty label and value", () => {
    for (const region of NZ_REGIONS) {
      expect(typeof region.label).toBe("string");
      expect(region.label.length).toBeGreaterThan(0);
      expect(typeof region.value).toBe("string");
      expect(region.value.length).toBeGreaterThan(0);
    }
  });

  it("values are lowercase slugs with no spaces", () => {
    for (const region of NZ_REGIONS) {
      expect(region.value).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("contains expected NZ regions", () => {
    const values = NZ_REGIONS.map((r) => r.value);
    expect(values).toContain("auckland");
    expect(values).toContain("wellington");
    expect(values).toContain("canterbury");
  });

  it("has unique values", () => {
    const values = NZ_REGIONS.map((r) => r.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
