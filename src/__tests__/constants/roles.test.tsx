import { ROLES, roleConfig, type RoleId } from "@/src/constants/roles";

describe("ROLES", () => {
  it("defines exactly the three supported roles", () => {
    expect(ROLES.map((r) => r.id)).toEqual(["player", "parent", "coach"]);
  });

  it("gives every role the display fields the UI relies on", () => {
    for (const role of ROLES) {
      expect(role.label).toBeTruthy();
      expect(role.shortLabel).toBeTruthy();
      expect(role.title).toBeTruthy();
      expect(role.cta).toBeTruthy();
      expect(role.icon).toBeTruthy();
    }
  });
});

describe("roleConfig", () => {
  it.each(["player", "parent", "coach"] as RoleId[])(
    "returns the matching config for %s",
    (id) => {
      expect(roleConfig(id).id).toBe(id);
    },
  );

  it("falls back to the first role (player) for null/undefined/unknown", () => {
    expect(roleConfig(null).id).toBe("player");
    expect(roleConfig(undefined).id).toBe("player");
    expect(roleConfig("nope" as RoleId).id).toBe("player");
  });
});
