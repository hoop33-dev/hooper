#!/bin/sh
# Run ESLint from apps/mobile so the import resolver finds tsconfig path aliases.
set -e
cd "$(dirname "$0")/../apps/mobile"
exec npx eslint --fix --no-warn-ignored "$@"
