import {
  validatePassword,
  PASSWORD_RULE,
  PASSWORD_MESSAGE,
} from "@/src/lib/passwordRules";

describe("PASSWORD_RULE", () => {
  test.each([
    ["Password1", true],
    ["Abcdefg1", true],
    ["UPPER123", true],
    ["LongerPassword9", true],
    ["password1", false], // no uppercase
    ["PASSWORD1", true], // all-uppercase is fine — rule only requires at least one uppercase
    ["Password", false], // no digit
    ["Pass1", false], // too short (5 chars)
    ["", false],
    ["12345678", false], // no uppercase letter
    ["PASS1234", true], // uppercase + digit + 8 chars — no lowercase required
  ])('tests "%s" → %s', (password, expected) => {
    expect(PASSWORD_RULE.test(password)).toBe(expected);
  });
});

describe("validatePassword", () => {
  it('returns "Required" for an empty string', () => {
    expect(validatePassword("")).toBe("Required");
  });

  it("returns PASSWORD_MESSAGE when the password is too short", () => {
    expect(validatePassword("Pass1")).toBe(PASSWORD_MESSAGE);
  });

  it("returns PASSWORD_MESSAGE when missing an uppercase letter", () => {
    expect(validatePassword("password123")).toBe(PASSWORD_MESSAGE);
  });

  it("returns PASSWORD_MESSAGE when missing a digit", () => {
    expect(validatePassword("Password")).toBe(PASSWORD_MESSAGE);
  });

  it("returns null for a valid password", () => {
    expect(validatePassword("Password1")).toBeNull();
  });

  it("returns null for a valid password with special characters", () => {
    expect(validatePassword("S3cure@pass!")).toBeNull();
  });

  it("returns null for exactly 8 characters meeting all rules", () => {
    expect(validatePassword("Abcdef1!")).toBeNull();
  });
});
