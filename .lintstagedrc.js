module.exports = {
  "*.{js,jsx,ts,tsx,md,json,yml,yaml}": "prettier --write",
  // ESLint must run from each app so the import resolver finds tsconfig path aliases.
  "apps/mobile/**/*.{js,jsx,ts,tsx}": "bash scripts/eslint-mobile.sh",
  "apps/web/**/*.{js,jsx,ts,tsx}": "bash scripts/eslint-web.sh",
  "*.sql": "node scripts/check-db-migrations.mjs",
};
