# Hooper — Claude Code Guide

This document is the single source of truth for AI-assisted development on this repo.
**Read it before writing any code.** It overrides any guesses based on training data.

---

## Project overview

Hooper is a React Native / Expo app for basketball athletes, coaches, and parents.
Tech stack: Expo SDK 55 · Expo Router · React Native 0.83 · NativeWind 5 (Tailwind 4) · Supabase · Zustand · TypeScript (strict).

Design system: see [`ai/DESIGN.md`](./ai/DESIGN.md).
Folder conventions: see [`ai/structure.md`](./ai/structure.md).

---

## Non-negotiable rules

### 1. Styling — NativeWind className only

Use **`className`** for all styling. Never add `style={{ ... }}` for values that can be expressed as a Tailwind class.

**Allowed inline `style` exceptions:**
- `fontFamily` is handled via the `font-inter` Tailwind class. Never write `style={{ fontFamily: "Inter" }}`.
- Truly dynamic values computed at runtime (e.g. `{ color: accentColor }`, animated transform values, shadow objects that change based on state).
- `textAlignVertical` (React Native-only property not supported by NativeWind).

**Do:**
```tsx
<Text className="font-inter font-bold text-[15px] tracking-[1.2px] uppercase text-text-primary">
```

**Don't:**
```tsx
<Text style={{ fontFamily: "Inter", fontWeight: "700", fontSize: 15, textTransform: "uppercase" }}>
```

The `styled()` wrapper from NativeWind is never needed — all components accept `className` directly via `react-native-css`.

### 2. Typography — use components from `src/components/ui/Typography.tsx`

Never write raw `<Text>` for headings or body copy. Use the exported components:

| Component | Size  | Usage                    |
|-----------|-------|--------------------------|
| `H1`      | 64px  | Billboard hero moments   |
| `H2`      | 36px  | Section headings         |
| `H3`      | 28px  | Card titles              |
| `H4`      | 22px  | Sub-headings             |
| `Body`    | 16px  | Body copy                |
| `BodySm`  | 13px  | Secondary descriptions   |
| `Label`   | 11px  | Uppercase caps labels    |
| `Stat`    | 48px  | XP numbers, big stats    |

All accept `className` and `style` for overrides.

### 3. Design tokens — never hardcode

Import tokens from `src/constants/theme.ts` or use their Tailwind class equivalents.

**Do:** `className="bg-brand-orange"` or `className="text-text-secondary"`
**Don't:** `style={{ backgroundColor: "#F15825" }}`

The only exception is when you need a token that has no class equivalent (e.g. a partial-opacity variant not in the palette). Check `global.css` for all defined tokens first.

### 4. Folder rules (strict)

| What                | Where                            |
|---------------------|----------------------------------|
| Supabase queries    | `src/services/*.service.ts` only |
| Global state        | `src/stores/*.store.ts` only     |
| Data fetching hooks | `src/hooks/use*.ts`              |
| Reusable UI         | `src/components/ui/`            |
| Domain components   | `src/components/<domain>/`       |
| Routing/screens     | `app/`                           |
| Shared utilities    | `src/lib/`                       |

**Never** write a Supabase query inside a component or screen — always go through a service.
**Never** call a service directly from a screen — always go through a hook.

### 5. Service response shape

All service functions return a discriminated union:
```ts
{ ok: true } | { ok: false; error: string }
// or with data:
{ ok: true; data: T } | { ok: false; error: string }
// or with optional field error:
{ ok: true } | { ok: false; error: string; field?: "fieldName" }
```

Never invent a different shape. Never throw — always return `{ ok: false, error: string }`.

### 6. Auth store — use it, don't bypass it

The `useAuthStore` in `src/stores/auth.store.ts` holds `profile`, `primaryRole`, `session`, and `status`. Screens must read from the store — never call `supabase.auth.getUser()` directly in a screen.

### 7. Utilities go in `src/lib/`

If you need a helper function used by more than one service or component (e.g. date formatting), put it in `src/lib/`. Never duplicate a utility across files.

---

## Adding a new screen

1. Create the file under `app/` following Expo Router conventions.
2. Use `SafeAreaView` directly (no `styled()` wrapper needed).
3. Fetch data via a hook in `src/hooks/`, not inline `useEffect` + service call.
4. All text through Typography components or NativeWind className.

## Adding a new UI component

1. Create it in `src/components/ui/`.
2. Export it from `src/components/ui/index.ts`.
3. All styling via NativeWind className. Dynamic values (colors, computed sizes) may use inline `style`.
4. No Supabase calls, no store access — components are pure UI.

## Adding a new service function

1. Add it to the relevant `src/services/*.service.ts`.
2. Return the discriminated union pattern above.
3. Import `supabase` from `src/lib/supabase.ts`.
4. Add tests in `src/__tests__/services/`.
