# Hooper Portal

Web-based, coach-only program-building portal for the **Hooper** youth
basketball & gym training platform. Connects to the same Supabase project as the
Hooper mobile app — shared PostgreSQL database, auth, storage, and RLS policies.

This repository is **scaffolding**: routes, services, UI primitives, and
database migrations are stubbed with typed signatures and placeholder content,
ready to be implemented.

## Tech stack

- **Next.js** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** — the only styling mechanism (design tokens in
  `tailwind.config.ts`, loaded via `@config` in `src/app/globals.css`)
- **Supabase** (`@supabase/supabase-js` v2 + `@supabase/ssr`) — anon key only,
  access enforced by RLS
- ESLint (+ `eslint-plugin-sonarjs`), Prettier, Husky + lint-staged
- **Vitest** + Testing Library — unit/component tests

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

### Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Scripts

| Script                 | Purpose              |
| ---------------------- | -------------------- |
| `npm run dev`          | Start the dev server |
| `npm run build`        | Production build     |
| `npm run lint`         | ESLint               |
| `npm run lint:fix`     | ESLint with `--fix`  |
| `npm run format`       | Prettier write       |
| `npm run format:check` | Prettier check       |
| `npm run typecheck`    | `tsc --noEmit`       |
| `npm run quality`      | Lint + typecheck     |
| `npm run test`         | Vitest (run once)    |
| `npm run test:watch`   | Vitest (watch mode)  |

## Continuous integration

`.github/workflows/ci.yml` runs `lint`, `typecheck`, and `test` as a parallel
matrix on every push to `main` and on every pull request.

## Deployment (Vercel)

The app deploys to [Vercel](https://vercel.com), which auto-detects Next.js.
`vercel.json` pins the framework and sets the serverless region to `syd1`
(Sydney — closest to NZ).

1. Import the repository in the Vercel dashboard (or run `vercel`/`vercel --prod`
   with the [CLI](https://vercel.com/docs/cli)).
2. Add the environment variables below under **Project → Settings → Environment
   Variables** for the Production (and Preview) environments — without them the
   Supabase client has no endpoint to talk to:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Pushes to `main` deploy to production; pull requests get preview
   deployments automatically.

## Architecture

### Layering rule (enforced by ESLint)

Pages and components **must never** import the Supabase client directly. All
data access goes through the service layer in `src/services/**`. A
`no-restricted-imports` rule on `src/app/**` and `src/components/**` blocks
direct imports of `@/src/lib/supabase/server` and `@/src/lib/supabase/client`.

### Service return shape

Services never throw. They return:

```ts
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

### Structure

```
src/
  app/
    (auth)/login            # Email + password sign in (no signup)
    (portal)/               # Authenticated, coach-only routes
      layout.tsx            # Auth + coach role guard
      page.tsx              # Dashboard
      programs/             # List, new, editor, sessions, blocks, assign
      exercises/            # Library, new, detail/editor
      categories/           # Category tree manager (admin)
      roster/               # Player list + player detail
    not-authorized/         # Shown to authenticated non-coaches
  components/ui/            # Button, Input, Card, Badge, Spinner
  services/                 # One file per domain (Supabase queries)
  lib/supabase/             # server.ts, client.ts, middleware.ts
  types/database.types.ts   # Supabase-generated stub (do not hand-edit)
supabase/migrations/        # New tables + RLS (apply via Supabase CLI)
middleware.ts               # Session refresh + route guard
```

## Database migrations

Numbered SQL migrations live in `supabase/migrations/`. They are **not** applied
automatically — apply them to the shared Supabase project with the CLI, then
regenerate types:

```bash
supabase db push
supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

RLS policies use the existing `get_auth_profile_id()` SECURITY DEFINER helper
instead of subquerying `profiles`, to avoid policy recursion.

## Design system — Courtside Kinetic

Dark mode only. Navy-heavy surfaces; Orange reserved for primary CTAs and active
states. No borders — elevation comes from surface-tier shifts. Fully-rounded
interactive elements. Lexend everywhere. Tokens are defined in
`tailwind.config.ts` (`bg-surface`, `bg-surface-container`,
`text-primary-orange`, …).
