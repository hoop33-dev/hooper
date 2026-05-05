import {
  colors,
  radii,
  spacing,
  shadows,
  fonts,
  easing,
} from "@/src/constants/theme";

describe("theme", () => {
  describe("colors", () => {
    it("exports brand colors as hex strings", () => {
      expect(colors.brandOrange).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.brandNavy).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.brandBlue).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("exports semantic colors", () => {
      expect(colors.danger).toBeDefined();
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
    });

    it("exports text colors", () => {
      expect(colors.textPrimary).toBeDefined();
      expect(colors.textSecondary).toBeDefined();
      expect(colors.textTertiary).toBeDefined();
    });

    it("exports surface colors", () => {
      expect(colors.surface).toBeDefined();
      expect(colors.surface2).toBeDefined();
      expect(colors.surface3).toBeDefined();
    });
  });

  describe("radii", () => {
    it("exports numeric radius values in ascending order", () => {
      expect(typeof radii.sm).toBe("number");
      expect(typeof radii.md).toBe("number");
      expect(typeof radii.lg).toBe("number");
      expect(typeof radii.full).toBe("number");
      expect(radii.sm).toBeLessThan(radii.md);
      expect(radii.md).toBeLessThan(radii.lg);
      expect(radii.lg).toBeLessThan(radii.full);
    });
  });

  describe("spacing", () => {
    it("exports numeric spacing values", () => {
      for (const value of Object.values(spacing)) {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThan(0);
      }
    });

    it("values grow with step size", () => {
      expect(spacing.s1).toBeLessThan(spacing.s2);
      expect(spacing.s2).toBeLessThan(spacing.s4);
      expect(spacing.s4).toBeLessThan(spacing.s8);
    });
  });

  describe("shadows", () => {
    it("every shadow has the required RN shadow properties", () => {
      for (const shadow of Object.values(shadows)) {
        expect(shadow).toHaveProperty("shadowColor");
        expect(shadow).toHaveProperty("shadowOffset");
        expect(shadow).toHaveProperty("shadowOpacity");
        expect(shadow).toHaveProperty("shadowRadius");
        expect(shadow).toHaveProperty("elevation");
      }
    });
  });

  describe("fonts", () => {
    it("exports the Inter font family name", () => {
      expect(fonts.inter).toBe("Inter");
    });
  });

  describe("easing", () => {
    it("exports numeric durations in fast < base < slow order", () => {
      expect(easing.fast).toBeLessThan(easing.base);
      expect(easing.base).toBeLessThan(easing.slow);
    });
  });
});
