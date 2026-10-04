#!/bin/sh
# Run ESLint from apps/billing so the import resolver finds tsconfig path aliases.
set -e
cd "$(dirname "$0")/../apps/billing"
exec npx eslint --fix --no-warn-ignored "$@"
