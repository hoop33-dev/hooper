import { describe, expect, it } from "vitest";
import {
  childChoiceDefault,
  forWhoFirstName,
  forWhoLabel,
  isForChild,
} from "./checkoutFor";
import { child } from "./testFixtures";

const me = { firstName: "Sarah", lastName: "Whitfield", username: "sarahw" };
const kids = [
  child(),
  child({ profile_id: "kid2", first_name: "Maya", username: "mayaw" }),
];

describe("checkout for-who", () => {
  it("defaults to the first child, or the new-child form when there are none", () => {
    expect(childChoiceDefault(kids)).toEqual({ who: "child", childId: "kid1" });
    expect(childChoiceDefault([])).toEqual({ who: "new_child" });
  });
  it("labels the package card", () => {
    expect(forWhoLabel({ who: "me" }, me, kids)).toBe("Sarah Whitfield");
    expect(forWhoLabel({ who: "child", childId: "kid2" }, me, kids)).toBe(
      "Maya Whitfield",
    );
    expect(forWhoLabel({ who: "new_child" }, me, kids)).toBe(
      "New child account",
    );
  });
  it("names the child for messages", () => {
    expect(forWhoFirstName({ who: "child", childId: "kid1" }, kids)).toBe(
      "Liam",
    );
    expect(forWhoFirstName({ who: "me" }, kids)).toBeNull();
  });
  it("knows when it's for a child", () => {
    expect(isForChild({ who: "me" })).toBe(false);
    expect(isForChild({ who: "new_child" })).toBe(true);
  });
});
