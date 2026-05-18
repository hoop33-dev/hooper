// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

// supabase/functions are Deno code (URL imports) — not lintable by the Expo config.
module.exports = defineConfig([
  expo,
  { ignores: ["dist/**", "supabase/functions/**"] },
]);
