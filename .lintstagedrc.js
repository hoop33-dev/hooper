module.exports = {
  "*.{js,jsx,ts,tsx,md,json,yml,yaml}": "prettier --write",
  // ESLint must run from apps/mobile so the import resolver finds tsconfig path aliases.
  "apps/mobile/**/*.{js,jsx,ts,tsx}": "bash scripts/eslint-mobile.sh",
  "*.sql": "node scripts/check-db-migrations.mjs",
};
