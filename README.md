# Hooper

A mobile app connecting basketball players, their guardians, and coaches.
Players manage a profile, guardians create and manage child accounts (with
controls like locking profile editing), and coaches connect to athletes.

Built with React Native (Expo) and Supabase (Postgres, Auth, Storage, and
Deno edge functions). There is no separate Node.js backend — server-side logic
runs in Supabase edge functions.

---

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone, or Xcode for iOS Simulator (macOS only)
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

Create a `.env.local` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from the Supabase dashboard under **Settings → API**.

> Ask the project owner to be added to the Supabase project if you don't have access.

### 3. Start the dev server

```bash
npx expo start
```

- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on your phone

---

## Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Mobile      | React Native (Expo, expo-router)     |
| Styling     | NativeWind (Tailwind) + theme tokens |
| State       | Zustand                              |
| Server-side | Supabase Edge Functions (Deno)       |
| Database    | PostgreSQL via Supabase (RLS)        |
| Auth        | Supabase Auth                        |
| Storage     | Supabase Storage                     |
| CI/CD       | GitHub Actions + EAS                 |

---

## Project Structure

```
hooper/
│
├── app/                          # expo-router — file-based navigation only
│   ├── _layout.tsx               # Root: fonts, auth hydration, route guard, ErrorBoundary
│   ├── index.tsx                 # Unauthenticated splash / intro
│   ├── (auth)/                   # Public routes (no session): login, signup, verify, reset
│   └── (app)/                    # Authenticated routes, gated by role
│       ├── player.tsx | coach.tsx | parent.tsx   # Role dashboards
│       ├── chat.tsx | settings.tsx | profile-settings.tsx
│       ├── security*.tsx         # Password-change flow
│       └── parent/               # Guardian-only: add-child, manage-child, view-as-child
│
├── src/
│   ├── components/               # UI only — no data fetching (enforced by depcruise)
│   │   ├── ui/                   # Primitives — Button, Card, Input, Typography…
│   │   ├── common/               # ErrorBoundary
│   │   ├── dashboard/            # DashboardLayout, DashboardHeader, BottomNav, Avatar…
│   │   ├── auth/ | profile/ | splash/
│   ├── hooks/                    # useChildren, useDashboardUser, useGuardianControls…
│   ├── lib/                      # supabase.ts (client) + pure helpers (age, password…)
│   ├── services/                 # ALL Supabase access (auth, parent, profile, region)
│   ├── stores/                   # Zustand — auth.store.ts
│   ├── types/                    # database.types.ts (generated; never edit by hand)
│   └── constants/                # theme.ts, roles.tsx, regions.ts
│
├── supabase/
│   ├── migrations/               # Append-only SQL (guarded by scripts/check-db-migrations.mjs)
│   ├── functions/                # Deno edge functions (service-role logic)
│   └── templates/                # Transactional email HTML
│
├── assets/fonts/                 # Inter.ttf
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── tsconfig.json
└── package.json
```

See `ai/structure.md` for the full conventions and layering rules.

---

## PR Previews

Every pull request against `main` automatically publishes an OTA update via EAS and posts a QR code link in the PR comments.

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

| Variable                        | Where to get it           |
| ------------------------------- | ------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |

Never commit `.env.local`. It is gitignored. Never add secrets to `app.json` or anywhere tracked by git.
