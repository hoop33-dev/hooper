# Folder Structure & Conventions

> This document reflects the **actual** layout of the repo. Keep it in sync when
> you add or move directories — both humans and AI agents rely on it being accurate.

## Monorepo Layout

Hooper is an npm-workspaces monorepo. A single root `package-lock.json` and
`node_modules` serve every workspace; never add a per-app lockfile.

```
apps/
  mobile/     Expo / React Native app (@hooper/mobile)
  web/        Next.js app (@hooper/web)
packages/
  db/         @hooper/db     — Supabase domain + generated schema types (shared)
  api/        @hooper/api    — Supabase service layer (mobile; singleton client)
  shared/     @hooper/shared — pure cross-platform helpers (age, password rules)
supabase/     Backend: Postgres migrations, Deno edge functions, email templates
scripts/      Repo tooling (migration guard, per-app eslint runners)
ai/           Living docs (this file, DESIGN.md)
```

**Root-level config is authoritative — apps do not duplicate it:**

- `.prettierrc.js`, `.prettierignore` — formatting for the whole repo.
- `.husky/`, `.lintstagedrc.js` — one pre-commit hook; lint-staged dispatches
  ESLint per app via `scripts/eslint-mobile.sh` / `scripts/eslint-web.sh`.
- `.github/workflows/` — all CI/CD (see "CI/CD" below).
- `.gitignore` — covers both Expo and Next build artifacts.

Each app keeps only its own build/tooling config (`tsconfig.json`,
`eslint.config.*`, `next.config.ts` / `app.json`, test config, etc.).

### Supabase — single source of truth

The backend lives once, at `supabase/`. Both apps talk to the same project.
Schema types live once in `@hooper/db` (`packages/db/src/schema.ts`, regenerated
with `supabase gen types`); each app re-exports them from its own
`src/types/database.types.ts`. The Supabase **client** is necessarily
per-platform — web uses `@supabase/ssr` (per-request, cookie-based) under
`apps/web/src/lib/supabase/`, while mobile uses a single long-lived
`@supabase/supabase-js` client (AsyncStorage, PKCE) in
`apps/mobile/src/lib/supabase.ts`.

### CI/CD

- `ci.yml` — typecheck / lint / test for both apps, plus a web production
  build and the append-only DB-migration guard. Gates every PR.
- Web (Vercel) deploys via Vercel's native Git integration (preview on PRs,
  production on the production branch) — configured in the Vercel dashboard
  with Root Directory `apps/web`, not via a workflow in this repo.
- `pr-previews.yml` — Expo EAS Update preview on mobile PRs.
- `deploy-edge-functions.yml`, `deploy-email-templates.yml`, `migrate-feature-db.yml`
  — Supabase backend deploys.

## Naming Rules

- **Files:** camelCase — `parent.service.ts`, `useChildren.ts`
- **Components:** PascalCase — `DashboardHeader.tsx`, `SelectInput.tsx`
- **Hooks:** camelCase prefixed with `use` — `useGuardianControls.ts`
- **Services:** camelCase suffixed with `.service.ts` — `auth.service.ts`
- **Stores:** camelCase suffixed with `.store.ts` — `auth.store.ts`
- **Database:** snake_case at Supabase level (auto-generated types bridge the gap)

---

## Folder Rules

### `app/` — Navigation only (expo-router, file-based)

- `_layout.tsx` — root layout: font loading, auth hydration, route guard, top-level `ErrorBoundary`.
- `index.tsx` — unauthenticated splash / intro carousel.
- `(auth)/` — public routes (no session required): `login`, `signup-details`, `role-selector`, `verify-email`, `forgot-password`, `reset-password`.
- `(app)/` — authenticated routes, gated by role in the root layout:
  - `player.tsx`, `coach.tsx`, `parent.tsx` — role dashboards.
  - `chat.tsx`, `settings.tsx`, `profile-settings.tsx` — shared screens.
  - `security*.tsx` — password-change flow (security code → verify → new password).
  - `parent/` — guardian-only screens: `add-child`, `manage-child`, `view-as-child`.
- Screens must reach Supabase **only** through a service in `src/services/**`.
  Importing `src/lib/supabase` from `app/**` is blocked by ESLint.

### `src/components/` — UI only (no data fetching)

- `ui/` — primitives: `Button`, `Card`, `Input`, `Typography`, `SelectInput`, etc. Re-exported from `ui/index.ts`.
- `common/` — cross-cutting: `ErrorBoundary`.
- `dashboard/` — dashboard shell: `DashboardLayout`, `DashboardHeader`, `BottomNav`, `Avatar`, `GuardianLock`, `icons`.
- `auth/` — `RoleIcons`, `AgeGateModal`, `DisclosureLabel`.
- `profile/` — `DiscardChangesModal`, `PhotoSourceSheet`.
- `splash/` — `illustrations`.
- Components receive data as props. Architecture is enforced by dependency-cruiser
  (`components-not-data-layer`): components must not import services or the Supabase client.

### `src/hooks/` — Data fetching and local state

- Hooks call services, never Supabase directly.
- Current: `useChildren`, `useDashboardUser`, `useGuardianControls`, `useManageChildForm`, `useRegionOptions`.

### `src/services/` — All Supabase access

- Every database query and edge-function call lives here and nowhere else.
- Current: `auth.service.ts`, `parent.service.ts`, `profile.service.ts`, `region.service.ts`.
- If you are writing a Supabase query outside `services/`, stop and move it here.

### `src/stores/` — Global state (Zustand)

- `auth.store.ts` — session, profile, primary role, and verification status.

### `src/lib/` — Client setup and pure utilities

- `supabase.ts` — single Supabase client instance (AsyncStorage session, PKCE).
- `age.ts`, `passwordRules.ts`, `passwordStrength.ts` — pure helpers.

### `src/constants/`

- `theme.ts` — design tokens (colors, spacing, radii, shadows). Mirrors `global.css`.
- `roles.tsx` — role config (player / parent / coach) and `RoleId` type.
- `regions.ts` — NZ region helpers.

### `src/types/`

- `database.types.ts` — generated by the Supabase CLI; never edit manually.
  Regenerate with: `supabase gen types typescript`.

### `supabase/` — Backend (Postgres + Deno edge functions)

- `migrations/` — append-only SQL. Never edit an applied migration; add a new one.
  Enforced by `scripts/check-db-migrations.mjs` (pre-commit + CI).
- `functions/` — Deno edge functions (service-role logic the client can't do safely):
  `signin-with-username`, `create-child-account`, `update-child-profile`,
  `send-security-code`, `send-account-exists-email`. These are Deno, not RN —
  they are excluded from the app's tsconfig and ESLint config.
- `templates/` — transactional email HTML.

---

## Quality gates (run by CI and `npm run quality`)

- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — ESLint with a suppressions baseline (`eslint-suppressions.json`).
- `npm run lint:deps` — dependency-cruiser layering + no-circular rules.
- `npm run check:db` — append-only migration guard.
- `npm test` — Jest unit tests (`src/__tests__/**`).
