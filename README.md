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

## Environment Variables

| Variable                        | Where to get it           |
| ------------------------------- | ------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |

Never commit `.env.local`. It is gitignored. Never add secrets to `app.json` or anywhere tracked by git.
