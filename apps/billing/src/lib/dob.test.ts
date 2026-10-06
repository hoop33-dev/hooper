import { describe, expect, it } from "vitest";
import { dobToIso, isoToDob, maskDob } from "./dob";
import { validateDateOfBirth } from "./validation";

describe("maskDob", () => {
  it("inserts separators as digits arrive", () => {
    expect(maskDob("1")).toBe("1");
    expect(maskDob("140")).toBe("14 / 0");
    expect(maskDob("1403")).toBe("14 / 03");
    expect(maskDob("14032011")).toBe("14 / 03 / 2011");
  });
  it("ignores non-digits and extra digits (paste)", () => {
    expect(maskDob("14/03/2011 ")).toBe("14 / 03 / 2011");
    expect(maskDob("140320119")).toBe("14 / 03 / 2011");
  });
});

describe("dobToIso", () => {
  it("converts a full NZ date to ISO", () => {
    expect(dobToIso("14 / 03 / 2011")).toBe("2011-03-14");
  });
  it("leaves partial input malformed so validation flags it", () => {
    expect(validateDateOfBirth(dobToIso("14 / 03"))).toBe("Enter a valid date");
    expect(dobToIso("")).toBe("");
  });
  it("catches impossible days via validation", () => {
    expect(validateDateOfBirth(dobToIso("31 / 02 / 2011"))).toBe(
      "Enter a valid date",
    );
  });
});

describe("isoToDob", () => {
  it("round-trips a saved date", () => {
    expect(isoToDob("2011-03-14")).toBe("14 / 03 / 2011");
    expect(isoToDob(null)).toBe("");
  });
});
