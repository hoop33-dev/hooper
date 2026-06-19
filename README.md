# Hooper

A mobile coaching app for coaches to assign structured training programs and athletes to log workouts and track progress.

Built with React Native (Expo), Supabase, and Node.js.

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

| Layer    | Technology              |
| -------- | ----------------------- |
| Mobile   | React Native (Expo)     |
| Backend  | Node.js                 |
| Database | PostgreSQL via Supabase |
| Auth     | Supabase Auth           |
| Storage  | Supabase Storage        |
| CI/CD    | GitHub Actions + EAS    |

---

## Project Structure

```
hooper/
│
├── app/                          # Expo Router — file-based navigation
│   ├── (auth)/                   # Public routes (no session required)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (athlete)/                # Athlete-only routes
│   │   ├── _layout.tsx           # Athlete tab bar
│   │   ├── dashboard.tsx
│   │   ├── workout/
│   │   │   ├── today.tsx         # Today's session
│   │   │   └── [trainingDayId].tsx
│   │   └── progress/
│   │       └── index.tsx
│   └── _layout.tsx               # Root layout — handles auth redirect
│
├── src/
│   │
│   ├── components/               # Shared UI components (role-agnostic)
│   │   ├── ui/                   # Primitives — Button, Card, Input, Badge
│   │   │   ├── Button.tsx
│   │   │   └── Typography.tsx
│   │   ├── workout/              # Domain components
│   │   │   └── WorkoutSummary.tsx
│   │   ├── programs/
│   │   │   └── PhaseBlock.tsx
│   │   └── common/
│   │       ├── LoadingScreen.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useAthleteProgress.ts
│   │
│   ├── lib/                      # Utilities and service wrappers
│   │   ├── supabase.ts           # Supabase client (single instance)
│   │   ├── storage.ts            # Supabase Storage helpers
│   │   └── sentry.ts             # Sentry init + helpers
│   │
│   ├── services/                 # Data access layer — all Supabase queries live here
│   │   ├── auth.service.ts
│   │   └── setLog.service.ts
│   │
│   ├── stores/                   # Global state (Zustand recommended)
│   │   ├── auth.store.ts
│   │   └── workoutSession.store.ts   # Active workout in-progress state
│   │
│   ├── types/                    # TypeScript types — mirrors your data model
│   │   ├── database.types.ts     # Auto-generated from Supabase (never edit manually)
│   │   ├── app.types.ts          # App-specific types + enums
│   │   └── index.ts              # Re-exports
│   │
│   └── constants/
│       ├── theme.ts              # Design system tokens (colors, spacing, typography)
│       └── config.ts             # App-wide constants
│
├── supabase/                     # Supabase local dev config
│   ├── migrations/               # SQL migration files
│   └── functions/                # Edge Functions (if needed)
│
├── assets/                       # Static assets
│   ├── fonts/                    # DM Sans files
│   └── images/
│
├── .cursorrules                  # Cursor context — paste design system + conventions here
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── tsconfig.json
└── package.json
```

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
