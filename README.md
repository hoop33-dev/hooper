# Hooper

A platform connecting basketball players, their guardians, and coaches.
Players manage a profile, guardians create and manage child accounts (with
controls like locking profile editing), and coaches connect to athletes.

This is an **npm-workspaces monorepo** with two apps and a shared backend:

- **`apps/mobile`** — React Native (Expo) app.
- **`apps/web`** — Next.js (App Router) app.
- **`supabase/`** — the single shared backend (Postgres, Auth, Storage, and
  Deno edge functions). There is no separate Node.js backend.

Shared code lives in `packages/*` (`@hooper/db` schema types, `@hooper/api`
service layer, `@hooper/shared` helpers). See `ai/structure.md` for the full
layout and layering rules.

---

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone, or Xcode for iOS Simulator (macOS only) — for mobile
- A [Supabase](https://supabase.com) account

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/<org>/hooper.git
cd hooper
npm install
```

### 2. Set up environment variables

Each app reads its own `.env.local`, both pointing at the same Supabase project.
Get the values from the Supabase dashboard under **Settings → API**.

`apps/mobile/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> Ask the project owner to be added to the Supabase project if you don't have access.

### 3. Start a dev server

```bash
# Mobile
npm run dev --workspace apps/mobile      # or: cd apps/mobile && npx expo start

# Web
npm run dev --workspace apps/web         # Next.js on http://localhost:3000
```

For mobile: press `i` (iOS Simulator), `a` (Android Emulator), or scan the QR
code with Expo Go.

---

## Tech Stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Mobile      | React Native (Expo, expo-router)             |
| Web         | Next.js (App Router, React 19)               |
| Styling     | NativeWind / Tailwind + theme tokens         |
| State       | Zustand (mobile)                             |
| Server-side | Supabase Edge Functions (Deno)               |
| Database    | PostgreSQL via Supabase (RLS)                |
| Auth        | Supabase Auth                                |
| Storage     | Supabase Storage                             |
| CI/CD       | GitHub Actions · EAS (mobile) · Vercel (web) |

---

## Project Structure

```
hooper/
├── apps/
│   ├── mobile/        # Expo / React Native app (@hooper/mobile)
│   └── web/           # Next.js app (@hooper/web)
├── packages/
│   ├── db/            # @hooper/db — Supabase domain + schema types (shared)
│   ├── api/           # @hooper/api — Supabase service layer (mobile)
│   └── shared/        # @hooper/shared — pure helpers
├── supabase/          # Migrations, edge functions, email templates (shared backend)
├── scripts/           # Migration guard, per-app eslint runners
└── ai/                # Living docs (structure.md, DESIGN.md)
```

See `ai/structure.md` for the full conventions and layering rules.

---

## Quality Gates

Run from the repo root with `--workspace`, or `cd` into the app:

```bash
npm run typecheck --workspace apps/web      # tsc --noEmit
npm run lint      --workspace apps/web      # ESLint
npm run test      --workspace apps/web      # Vitest
npm run build     --workspace apps/web      # next build

npm run quality   --workspace apps/mobile   # lint + dependency-cruiser
npm run test      --workspace apps/mobile   # Jest
```

CI (`.github/workflows/ci.yml`) runs all of these on every PR, plus the
append-only DB-migration guard.

---

## Web Deployment (Vercel)

The web app deploys through **Vercel's native Git integration** — no GitHub
Actions workflow or repo secrets required. Connect the repository once in the
Vercel dashboard and Vercel handles deployments automatically:

- **Pull requests** get a **preview** deployment; Vercel posts the URL on the PR.
- **Merges to the production branch** deploy to **production**.

One-time setup in the Vercel project:

- **Root Directory** → `apps/web`.
- **Framework Preset** → Next.js (auto-detected).
- **Environment Variables** → `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview).

`apps/web/vercel.json` pins the framework and region; everything else is
inferred. The build/install commands run from the repo root so the workspace
resolves correctly.

---

## Mobile PR Previews

Every pull request that touches mobile/shared code automatically publishes an OTA update via EAS and posts a QR code link in the PR comments.

To test your branch on your phone:

1. Open the PR on GitHub
2. Wait ~2 minutes for the Actions workflow to complete
3. Click the EAS dashboard link in the PR comment
4. Scan the QR code in Expo Go

> **Note:** OTA updates only cover JS changes. If your branch adds a new native package, a full EAS build is needed — the QR code preview will crash. Flag this in your PR.

---

## Tester Builds (the `dev` channel)

Testers run a **`dev`** build — a standalone release app with **no Expo
launcher screen** — that auto-updates from the `dev` branch. They install it
**once** and then receive over-the-air (OTA) updates on the next app launch.

### How it works

- The `dev` build profile (`eas.json`) is a release build, `distribution: internal`,
  on the `development` channel. No `developmentClient`, so it launches straight
  into the app.
- Every push to `dev` that passes CI triggers `auto-development-update.yml`, which
  publishes an OTA update to the `development` branch/channel.
- On their next launch, testers' apps check for, download, and apply the update
  (default `expo-updates` behaviour — applied on the following launch).

### Cutting a tester build

```bash
# one build that testers install; send them the resulting install link / QR
eas build --profile dev --platform all
```

- **iOS:** internal distribution is ad-hoc — each tester's device UDID must be
  registered with the Apple account first (`eas device:create`), then rebuild.
- **Android:** produces an installable `.apk`.

Testers only need to reinstall when the **native layer** changes (see below).

### Native modules — the important part

`runtimeVersion.policy` is set to **`fingerprint`** (`app.json`). The runtime
version is a hash of the native project, so:

- **JS/asset-only change** → fingerprint unchanged → OTA is delivered to existing
  tester installs automatically. No reinstall.
- **Native change** (new native dependency, config-plugin change, SDK bump) →
  fingerprint changes → the OTA is **not** delivered to old installs (they keep
  running the last compatible version, no crash). You must cut a **new `dev`
  build** and send testers the new install link.

> Rule of thumb: if a PR adds/removes a package with native code or changes
> `app.json` plugins/native config, testers need a fresh `eas build --profile dev`.

### One-time setup checklist

1. `EXPO_TOKEN` repo secret exists (used by all EAS workflows). Create a robot
   token in the Expo dashboard if not.
2. Register tester iOS devices: `eas device:create` (skip if Android-only).
3. Cut the first build: `eas build --profile dev --platform all`.
4. Send testers the install link. Done — pushes to `dev` now reach them OTA.

---

## Environment Variables

| Variable                        | App    | Where to get it           |
| ------------------------------- | ------ | ------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | mobile | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL`      | web    | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web    | Supabase → Settings → API |

Never commit `.env.local`. It is gitignored. Never add secrets to `app.json` or anywhere tracked by git.
