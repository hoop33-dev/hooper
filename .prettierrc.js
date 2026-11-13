/** @type {import("prettier").Config} */
module.exports = {
  tabWidth: 2,
  useTabs: false,
  bracketSameLine: true,
  // prettier-plugin-tailwindcss must stay last so it sorts classes after the
  // other plugins (e.g. organize-imports) have run.
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-packagejson",
    "prettier-plugin-tailwindcss",
  ],
};
