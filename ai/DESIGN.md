# Hooper — Design System

> This documents the **implemented** design system. Keep it in sync with
> `global.css`, `src/constants/theme.ts`, and `src/components/ui/`.

Hooper is a premium dark-mode training app for youth athletes, their parents,
and coaches. The UI should feel athletic and energetic without being juvenile.

## 1. Single sources of truth

| Concern                             | Lives in                           | Notes                                                                             |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| Colour / shadow / font **tokens**   | `global.css` (`@theme`)            | Authoritative. NativeWind reads this.                                             |
| JS mirror of tokens                 | `src/constants/theme.ts`           | For `StyleSheet`/animations/gradients that need raw values. Mirrors `global.css`. |
| Typography (the type scale + fonts) | `src/components/ui/Typography.tsx` | Every font rule lives here. Change a font once.                                   |
| Reusable components                 | `src/components/ui/`               | Buttons, inputs, rows, chips, etc.                                                |

**Rule of thumb:** layout / spacing / colour → Tailwind `className`; text →
a Typography component; reusable widgets → a `ui/` component. Dynamic
(runtime) colours — e.g. a role accent — may be passed via the `style` prop.

## 2. Typography

Two typefaces, both loaded in `app/_layout.tsx`:

- **Headings → Barlow Condensed** (a condensed display face). Ships as static
  weights, registered per weight (`BarlowCondensed-SemiBold/Bold/ExtraBold/Black`).
- **Body / UI → Outfit** (a variable geometric sans).

Never set `fontFamily`, `fontSize`, `fontWeight`, or `letterSpacing` inline in a
screen — render one of these instead (ESLint enforces this in `app/**`):

| Component                           | Use                                    |
| ----------------------------------- | -------------------------------------- |
| `H1`                                | Hero display (64)                      |
| `H2` `H3` `H4`                      | Section / card headings (36 / 28 / 22) |
| `Hero`                              | Page / auth title (28 black)           |
| `ScreenTitle`                       | Dashboard tab title (22 black)         |
| `Title`                             | Entity name (20)                       |
| `Lead` / `RowTitle`                 | Strong line / list-row title (15)      |
| `Body` / `BodySm`                   | Paragraph copy (16 / 13)               |
| `Caption` / `Meta`                  | Metadata (12 medium / semibold)        |
| `Label` / `Overline` / `MicroLabel` | Uppercase labels (11 / 11 / 10)        |
| `TabLabel`                          | Control / tab label (13)               |
| `Stat`                              | Big numeric (48 orange)                |

Colour overrides go through `className` (e.g. `<Caption className="text-text-secondary" />`)
or, for runtime colours, `style`. To change a font, edit the `HEADING` / `BODY`
constants in `Typography.tsx`; to retune a size, edit the `SCALE` object.

## 3. Colour

Defined in `global.css` (`@theme`), mirrored in `theme.ts`.

### Brand

| Token                | Hex       |
| -------------------- | --------- |
| `brand-orange`       | `#F15825` |
| `brand-light-orange` | `#F68D68` |
| `brand-navy`         | `#00205C` |
| `brand-blue`         | `#0047BA` |
| `brand-black`        | `#231F20` |

Roles carry their own accent (`src/constants/roles.tsx`): player = orange,
parent = light orange, coach = blue. Accent tints are mixed at runtime from the
hex (e.g. `${accent}14`); the `IconTile` / `Pill` components encapsulate this.

### Surfaces & borders

| Token           | Value                     |
| --------------- | ------------------------- |
| `surface`       | `#1A1718` (app base)      |
| `surface-2`     | `#2D2829` (cards, inputs) |
| `surface-3`     | `#3D3738` (elevated)      |
| `border-subtle` | `rgba(255,255,255,0.08)`  |
| `border-strong` | `rgba(255,255,255,0.16)`  |

### Text & semantic

`text-primary` (white), `text-secondary` (65%), `text-tertiary` (35%),
`text-disabled` (25%), `text-inverse` (`#231F20`). Semantic: `danger`
`#E53E3E`, `success` `#38A169`, `warning` `#F15825`.

## 4. Components (`src/components/ui/`)

- **Buttons** — `Button` (brand variants), `AccentButton` (role-accent CTA),
  `TextButton` (inline link).
- **Inputs** — `Input`, `PasswordInput`, `PhoneInput`, `SelectInput`,
  `DateInput`, `Field` (labelled accent field), `OtpInput`, `Checkbox`.
- **Containers** — `Card`, `ScreenHeader`, `StickySaveBar`, `AccountFormLayout`.
- **Rows & chips** — `MenuRow`, `ToggleRow`, `IconTile`, `Pill`, `Badge` / `Tag`
  / `NumberBadge`, `SegmentedControl`, `SectionLabel`.
- **Controls** — `Switch`, `BackButton`, `RadioTile`, `Carousel`,
  `PasswordStrengthBar`, `ErrorMessage`, `ErrorBanner`, `Logo`.

Prefer composing these over hand-rolling. If a screen needs the same styled
block twice, extract a component rather than copy the markup.

## 5. Conventions

- **Rounded & soft.** Interactive elements are pill / rounded.
- **Tonal depth.** Separate content with surface tiers and subtle borders.
- **Tinted, ambient shadows** (orange/navy glows) over hard grey shadows.
- **Accent by role.** Player surfaces lean orange; coach/parent shift accent.
- **Accessibility.** Body copy stays sentence case; labels may be uppercase.
