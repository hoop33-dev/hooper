import { FlatCompat } from "@eslint/eslintrc";
import sonarjs from "eslint-plugin-sonarjs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Shared no-restricted-syntax rules: no .then()/.catch() chains (use
 * async/await + try/catch only), no dynamic import(), no Function constructor.
 */
const restrictedSyntax = [
  "error",
  {
    selector: "CallExpression[callee.property.name='then']",
    message: "Use async/await with try/catch instead of .then() chains.",
  },
  {
    selector: "CallExpression[callee.property.name='catch']",
    message: "Use async/await with try/catch instead of .catch() chains.",
  },
  {
    selector: "ImportExpression",
    message: "Dynamic import() is not allowed. Use static imports.",
  },
  {
    selector: "NewExpression[callee.name='Function']",
    message:
      "The Function constructor is banned as an eval-style security risk.",
  },
];

const eslintConfig = [
  {
    // Global ignores — build output, dependencies, and the Next.js-generated
    // next-env.d.ts (whose triple-slash references we don't control) are never
    // linted.
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Service-layer enforcement: pages and components must never import the
    // Supabase client directly — all data access goes through src/services/**.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/src/lib/supabase/server",
              message:
                "Do not import the Supabase server client in pages/components. Use a service in src/services/** instead.",
            },
            {
              name: "@/src/lib/supabase/client",
              message:
                "Do not import the Supabase browser client in pages/components. Use a service in src/services/** instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Complexity / semantic rules on all non-test source.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.*", "src/**/*.spec.*"],
    plugins: { sonarjs },
    rules: {
      complexity: ["error", 15],
      "sonarjs/cognitive-complexity": ["error", 15],
      "max-lines-per-function": [
        "error",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 4],
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-redundant-jump": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-nested-switch": "error",
      "no-restricted-syntax": restrictedSyntax,
      "@typescript-eslint/no-require-imports": "error",
      // Allow underscore-prefixed names for intentionally-unused stub params.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Tests are exempt from complexity / semantic rules.
    files: ["**/*.test.*", "**/*.spec.*"],
    rules: {
      complexity: "off",
      "sonarjs/cognitive-complexity": "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "max-nested-callbacks": "off",
    },
  },
];

export default eslintConfig;
