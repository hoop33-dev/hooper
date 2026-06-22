import { getPasswordStrength } from "@/src/lib/passwordStrength";

describe("getPasswordStrength", () => {
  it("reports 'empty' with no filled segments for an empty password", () => {
    const s = getPasswordStrength("");
    expect(s.level).toBe("empty");
    expect(s.label).toBe("");
    expect(s.filledSegments).toBe(0);
  });

  it("reports 'too_short' for anything under 8 characters", () => {
    const s = getPasswordStrength("Ab1!");
    expect(s.level).toBe("too_short");
    expect(s.label).toBe("Too short");
    expect(s.filledSegments).toBe(1);
  });

  it("reports 'weak' when 8+ chars meet at most one criterion", () => {
    // 8 lowercase letters: length ok, but zero of upper/digit/special.
    const s = getPasswordStrength("abcdefgh");
    expect(s.level).toBe("weak");
    expect(s.filledSegments).toBe(1);
  });

  it("reports 'fair' when exactly two criteria are met", () => {
    // uppercase + digit, no special char.
    const s = getPasswordStrength("Abcdefg1");
    expect(s.level).toBe("fair");
    expect(s.label).toBe("Fair");
    expect(s.filledSegments).toBe(2);
  });

  it("reports 'strong' when all three criteria are met", () => {
    const s = getPasswordStrength("Abcdef1!");
    expect(s.level).toBe("strong");
    expect(s.label).toBe("Strong");
    expect(s.filledSegments).toBe(4);
  });
});
