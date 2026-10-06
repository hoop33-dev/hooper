import { describe, expect, it } from "vitest";
import {
  validateChild,
  validateDateOfBirth,
  validateSignUp,
} from "./validation";

const valid = {
  firstName: "Sarah",
  lastName: "Whitfield",
  username: "sarahw",
  email: "sarah@example.com",
  password: "Str0ng!pass",
};

describe("validateSignUp", () => {
  it("passes a complete form", () => {
    expect(validateSignUp(valid)).toEqual({});
  });
  it("flags each bad field", () => {
    const errors = validateSignUp({
      firstName: " ",
      lastName: "",
      username: "has space",
      email: "nope",
      password: "short",
    });
    expect(Object.keys(errors).sort()).toEqual([
      "email",
      "firstName",
      "lastName",
      "password",
      "username",
    ]);
  });
});

describe("validateDateOfBirth", () => {
  const today = new Date("2026-10-05T00:00:00Z");
  it("accepts a past calendar date", () => {
    expect(validateDateOfBirth("2011-03-14", today)).toBeNull();
  });
  it("rejects missing, malformed, impossible, future and absurd dates", () => {
    expect(validateDateOfBirth("", today)).toBe("Required");
    expect(validateDateOfBirth("14/03/2011", today)).toBe("Enter a valid date");
    expect(validateDateOfBirth("2011-02-30", today)).toBe("Enter a valid date");
    expect(validateDateOfBirth("2027-01-01", today)).toBe(
      "Must be in the past",
    );
    expect(validateDateOfBirth("1900-01-01", today)).toBe("Enter a valid date");
  });
});

describe("validateChild", () => {
  const ok = {
    firstName: "Liam",
    lastName: "Whitfield",
    dateOfBirth: "2011-03-14",
    username: "liamw",
    password: "Str0ng!pass",
  };
  it("passes a complete child", () => {
    expect(validateChild(ok)).toEqual({});
  });
  it("flags every bad field", () => {
    const errors = validateChild({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      username: "a b",
      password: "x",
    });
    expect(Object.keys(errors).sort()).toEqual([
      "dateOfBirth",
      "firstName",
      "lastName",
      "password",
      "username",
    ]);
  });
  it("skips the password when editing", () => {
    expect(
      validateChild({ ...ok, password: "" }, { requirePassword: false }),
    ).toEqual({});
  });
});
