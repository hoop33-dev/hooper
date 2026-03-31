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
├── app/              # Screens (file-based routing via Expo Router)
├── lib/
│   └── supabase.ts   # Supabase client — import from here
├── app.json          # Expo config
├── eas.json          # EAS build/update config
└── .cursorrules      # AI coding assistant context
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
