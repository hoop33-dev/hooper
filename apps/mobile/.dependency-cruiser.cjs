/**
 * Dependency architecture rules (Layer 4 of the quality system).
 *
 * Layer map for this Expo / React Native app:
 *   - Data layer:  src/services/**, src/lib/**  (Supabase access, pure logic)
 *   - UI layer:    src/components/**            (presentational components)
 *   - Routes:      app/**                       (expo-router screens; wire the two)
 *
 * Screens (app/**) are allowed to import services — that is the intended
 * data-fetching seam. Presentational components must not.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies make code impossible to reason about and break tree-shaking.",
      from: {},
      to: { circular: true },
    },
    {
      name: "data-stays-pure",
      severity: "error",
      comment:
        "The data layer (services/lib) must not depend on UI or routes. Keep it presentation-agnostic and reusable.",
      from: { path: "^src/(services|lib)/" },
      to: { path: "^(src/components|app)/" },
    },
    {
      name: "components-not-data-layer",
      severity: "error",
      comment:
        "Presentational components must not reach into the data layer (services, or the Supabase client in src/lib). Screens (app/**) fetch data via services and pass it down as props.",
      from: { path: "^src/components/" },
      to: {
        path: "^src/services/|^src/lib/supabase",
        // Type-only imports are allowed (no runtime coupling).
        dependencyTypesNot: ["type-only"],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    exclude: {
      // Tests and generated/vendored code are exempt from architecture rules.
      path: "(^|/)__tests__/|\\.test\\.tsx?$|node_modules|\\.expo/",
    },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
