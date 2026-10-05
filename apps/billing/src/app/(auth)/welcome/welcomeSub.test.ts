import { describe, expect, it } from "vitest";
import { welcomeSub } from "./WelcomeClient";

describe("welcomeSub", () => {
  it("names the child and their login for a child purchase", () => {
    expect(
      welcomeSub("active", {
        packageName: "Shooting Mechanics",
        child: { firstName: "Liam", username: "liamw" },
      }),
    ).toBe(
      "Liam's Shooting Mechanics is live. Liam signs in to the Hooper app with the username @liamw — share the code below with them.",
    );
  });
  it("keeps the self-purchase copy", () => {
    expect(welcomeSub("active", { packageName: "Pack", child: null })).toMatch(
      /^Pack is live\./,
    );
  });
  it("handles slow confirmation", () => {
    expect(welcomeSub("slow", null)).toMatch(/processing/);
  });
});
