import { describe, expect, it } from "vitest";
import { validateSignUp } from "./validation";

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
