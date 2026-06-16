// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
const sonarjs = require("eslint-plugin-sonarjs");

// Source code we hold to the full quality bar (everything except tests/config).
const APP_GLOBS = ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}"];
const TEST_GLOBS = [
  "**/__tests__/**",
  "**/*.test.{js,jsx,ts,tsx}",
  "**/*.spec.{js,jsx,ts,tsx}",
];

module.exports = defineConfig([
  expo,

  // supabase/functions are Deno code (URL imports) — not lintable by Expo's config.
  { ignores: ["dist/**", ".expo/**", "coverage/**", "supabase/functions/**"] },

  // ── Layer 2: complexity + semantic guardrails (non-test source only) ──
  {
    files: APP_GLOBS,
    ignores: TEST_GLOBS,
    plugins: { sonarjs },
    rules: {
      // Complexity thresholds.
      complexity: ["error", 15],
      "sonarjs/cognitive-complexity": ["error", 15],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 4],

      // SonarJS auto-simplify rules.
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-redundant-jump": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-nested-switch": "error",

      // Semantic guardrails encoded as syntax restrictions.
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='then']",
          message:
            "Use async/await + try/catch instead of .then() chains (codebase standard).",
        },
        {
          selector: "CallExpression[callee.property.name='catch']",
          message:
            "Use async/await + try/catch instead of .catch() chains (codebase standard).",
        },
        {
          selector: "ImportExpression",
          message:
            "Dynamic import() is invisible to the Metro bundler and breaks static analysis. Use a static import.",
        },
        {
          selector: "NewExpression[callee.name='Function']",
          message: "The Function constructor is an eval-style security risk.",
        },
        {
          selector: "CallExpression[callee.name='Function']",
          message: "The Function constructor is an eval-style security risk.",
        },
      ],
    },
  },

  // ── Route purity: screens must reach Supabase through services, not directly ──
  {
    files: ["app/**/*.{js,jsx,ts,tsx}"],
    ignores: TEST_GLOBS,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/src/lib/supabase", "**/lib/supabase"],
              message:
                "Screens must not touch the Supabase client directly — go through a service in src/services/**.",
            },
          ],
        },
      ],
    },
  },

  // ── Tests are exempt from complexity/semantic rules ──
  {
    files: TEST_GLOBS,
    rules: {
      complexity: "off",
      "sonarjs/cognitive-complexity": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "max-nested-callbacks": "off",
      "sonarjs/no-identical-functions": "off",
      "no-restricted-syntax": "off",
      "no-restricted-imports": "off",
    },
  },
]);
