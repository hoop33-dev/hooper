#!/bin/sh
# Run ESLint from apps/web so the import resolver finds tsconfig path aliases.
set -e
cd "$(dirname "$0")/../apps/web"
exec npx eslint --fix --no-warn-ignored "$@"
