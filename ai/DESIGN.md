### The Creative North Star: "The Kinetic Editor"

Hoop 33 is where serious athletes come to level up. The design system must reflect that: it needs to feel like a premium training environment — not a generic fitness app, not a school portal. This is a **digital court** where every element feels poised for action.

We call this system **Courtside Kinetic**. It captures the high-velocity energy of professional basketball while maintaining the refined elegance of a luxury sports editorial. The system rejects rigid, boxy UI conventions in favour of intentional asymmetry, massive typographic scales, and layered depth that creates a sense of forward motion.

The primary design tension we're threading: **Hoop 33 serves youth athletes (some as young as 12), their coaches, and organisations** — so the energy must be exciting and gamified without feeling juvenile. Think _Nike Training Club meets World of Warcraft_ — athletic, progressive, aspirational.

By combining the precision of the `LEXEND` typeface with a hyper-rounded component language (`ROUND_FULL`), we create a visual rhythm that is both aggressive and approachable. Compact spacing (`SPACING_COMPACT`) keeps every element intentional and close to the action, avoiding unnecessary visual clutter.

---

## 2. Colors

The palette is rooted in high-contrast athleticism, optimised for a premium dark mode experience. These are Hoop 33's brand colours — they should feel distinctive and ownable.

### Primary Palette

| Token                     | Hex       | Role                                                                                               |
| ------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| **Primary Orange**        | `#F26522` | Core energy. High-impact CTAs, XP bar fills, key brand moments.                                    |
| **Navy**                  | `#00205C` | Foundational depth. Secondary containers, tonal anchoring, coach/org-facing surfaces.              |
| **Blue**                  | `#0047BA` | Vibrant secondary accent. Interaction states, informational highlights, active tabs.               |
| **Light Orange / Salmon** | `#F68D68` | Tertiary/soft accent. Breaks the intensity of orange; warmth in XP rewards and achievement states. |
| **Neutral Dark Gray**     | `#231F20` | Deep neutral base. Backgrounds, surfaces, non-chromatic elements.                                  |

### Surface Hierarchy

Treat the UI as a series of stacked physical layers. Depth is established through background color shifts — never borders.

| Token                       | Value     | Usage                           |
| --------------------------- | --------- | ------------------------------- |
| `surface`                   | `#161213` | App base background             |
| `surface-container-low`     | `#1e1b1c` | Section backgrounds, page zones |
| `surface-container`         | `#252122` | Card backgrounds                |
| `surface-container-high`    | `#2e2b2c` | Input fields, elevated cards    |
| `surface-container-highest` | `#383435` | Floating chips, active states   |

### Structural Color Rules

**The "No-Line" Rule:** Never use 1px solid borders to separate content. Separation is achieved entirely through background color shifts between surface tiers. A `surface-container-low` section against a `surface` background provides all the visual separation needed without hardening the UI.

**The "Glass & Gradient" Rule:** Floating elements (nav bars, modals, overlays) use Glassmorphism — semi-transparent surface colors with `backdrop-filter: blur(20px)`. This lets the orange and blue content breathe through as users scroll, reinforcing the "kinetic" feel.

**Signature Textures:** Hero backgrounds and primary buttons use a subtle linear gradient (e.g., `primary` → `primary_container`) at 135°. This adds depth and prevents the flat "template" look.

**XP & Gamification States:** Use the orange-to-salmon gradient to represent progress, completion, and reward. Navy and Blue are reserved for structural and informational contexts — keep them out of the XP/reward system so the orange family owns that emotional territory.

---

## 3. Typography

Typography is the backbone of our editorial identity. We use **LEXEND** exclusively — a typeface designed for readability with a unique, athletic geometric quality that suits both young players reading drill instructions and coaches scanning curriculum.

### Scale

| Style                       | Usage                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Display-LG` / `Display-MD` | "Billboard" moments: player XP totals, program titles, major section headers. Let these bleed or overlap adjacent elements to create kinetic energy. |
| `Headline` / `Title`        | Sub-sections, card titles. Bold and authoritative.                                                                                                   |
| `Body-LG` / `Body-MD`       | Drill descriptions, learning unit content, instructions. Maintain 1.5x line height for editorial breathing room.                                     |
| `Body-SM`                   | Supporting descriptions, metadata, secondary context.                                                                                                |
| `Label`                     | Timestamps, "Live" tags, XP chip labels, status badges. Use sparingly.                                                                               |

### Editorial Principles

**Dramatic size contrast is intentional.** A `Display-LG` headline next to a `Body-MD` description creates professional, curated hierarchy — not something auto-generated. Use this especially on training program cards and curriculum headers.

**Accessibility first for youth users.** Minimum body font size is 14px. The platform serves players who may be 12–15 years old reading instructions mid-training — legibility under physical stress is a real consideration.

**Never use all-caps on body text.** Labels and metadata chips can use `text-transform: uppercase` with `letter-spacing: 0.08em`, but paragraphs and instructions must remain sentence case for readability.

---

## 4. Elevation & Depth

We use **Tonal Layering** in place of traditional drop shadows.

### The Layering Principle

Stack surface tokens to establish elevation:

- **Base:** `surface` (`#161213`)
- **Section:** `surface-container-low` (`#1e1b1c`)
- **Card:** `surface-container` (`#252122`)
- **Active / Floating:** `surface-container-highest` (`#383435`)

### Ambient Shadows

When an element must float (FAB, modal, bottom sheet), use a high-spread, low-opacity ambient shadow tinted with the surface colour — never pure black:

```
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
```

For XP-reward moments or achievement unlocks, a subtle orange-tinted ambient glow is appropriate:

```
box-shadow: 0 8px 32px rgba(242, 101, 34, 0.2);
```

### The "Ghost Border" Fallback

If accessibility requires a visible boundary, use the `outline-variant` token at **15% opacity** — a "suggestion" of a border that guides the eye without hardening the layout.

---

## 5. Components

All components follow the `ROUND_FULL` (pill) philosophy — mirroring the curves of a basketball and providing a modern, ergonomic feel. Hoop 33's UI should feel physical and tactile, not clinical.

### Buttons

- **Primary CTA:** `primary_container` background (orange), `on_primary_container` text. Always `ROUND_FULL`. Used for completing drills, starting programs, key progression actions.
- **Secondary CTA:** `secondary_container` (Blue). High-energy alternative for secondary actions.
- **Ghost / Outline:** Ghost border fallback at 15% opacity. Used for low-priority or destructive actions.
- **XP / Reward Button:** Use the orange → salmon gradient at 135°. Reserved for completion moments — "Finish Drill", "Mark Complete", "Claim XP".

### Input Fields

`surface-container-high` backgrounds. No borders. Use `ROUND_MD` (1.5rem) for a structured-but-soft aesthetic. Placeholder text uses `on-surface` at 40% opacity.

### Chips & Tags

- **Status chips** (e.g., "In Progress", "Completed", "Locked"): `secondary` (Light Blue) palette. Active/completed states glow with a subtle inner shadow.
- **XP chips** (e.g., "+150 XP"): Orange family. Small, pill-shaped, appear inline with activity and learning unit titles.
- **Role chips** (Coach, Player, Org): Navy-toned, subdued. These are identity markers, not action prompts.

### Cards

Cards are the primary unit of information in Hoop 33 — training programs, curriculum modules, and activity drills all live in cards.

- **Never use divider lines.** Separate list items with 12–16px vertical space or alternating surface tiers.
- **Training Program Cards:** Use a large `Display-MD` title that partially overlaps a background texture or gradient. Subtitle in `Body-SM`. XP chip in the corner.
- **Drill / Activity Cards:** More compact. Icon or number on the left, title + brief descriptor, completion state chip on the right.
- **Learning Unit Cards:** Can incorporate a video thumbnail or illustration area at the top. Progress indicator below.

### The Kinetic Carousel

Used for surfacing training programs, featured curriculum, and recent activity on the Dashboard. Cards use a "peek-a-boo" layout — the next card is partially visible and slightly scaled down, encouraging horizontal scroll and suggesting more content ahead.

### XP Progress Bar

A signature component. Full-width, pill-shaped, orange fill on `surface-container` background. Fill uses the orange → salmon gradient. Should feel alive — animate the fill on load and on XP gain events.

### Navigation

Bottom tab bar (React Native standard). Use `backdrop-filter: blur(20px)` on the nav bar surface so the content behind it is visible during scroll. Active tab uses Primary Orange. Inactive tabs use `on-surface` at 50% opacity.

---

## 6. Gamification & XP UI Patterns

Hoop 33 is fundamentally a progression system — everything a player does earns XP and feeds their profile. The UI must make that feel rewarding and legible at a glance.

### XP Reward Moments

When a player completes an activity or learning unit, trigger a brief animation — an XP chip animates up from the completion button, the progress bar fills, and a subtle orange ambient glow pulses on the card. Keep it snappy (under 600ms). This is the dopamine hit that makes participation feel meaningful.

### Progress States

Every activity unit and learning unit has a clear visual state:

- **Locked:** `surface-container-low`, muted text, lock icon. Not yet accessible.
- **Available:** Full card treatment, standard colours.
- **In Progress:** Blue accent on left border (via `box-shadow` inset, not actual border), progress chip.
- **Completed:** Salmon/orange tint, checkmark, XP chip displayed.

### Player Profile

The player profile page is a showcase — it should feel like an RPG character sheet. Large display typography for the player's name, XP level, and total XP. Progress bar front and centre. Below: recent activity, completed programs, unlocked curriculum. Navy surface anchors this page to give it gravitas.

---

## 7. User Type Considerations

The same design system serves three distinct user types. Keep these distinctions in mind:

**Players (youth athletes):** The gamified, high-energy experience is primarily for them. XP, progress bars, achievement chips, kinetic carousels — all of this is player-facing. Keep the experience exciting and momentum-driven.

**Coaches / Trainers:** Their interfaces (program builder, curriculum editor, event management) should tone down the gamification and prioritise clarity and control. More Navy, less Orange. Denser information layouts are appropriate here — coaches are power users.

**Organisations:** Org-facing admin surfaces lean further into the Navy/Blue palette. These are professional contexts — clubs, schools, facilities — so the aesthetic should carry institutional weight.

---

## 8. Do's and Don'ts

### Do

- **DO** use white space as a structural element while maintaining compact overall density.
- **DO** bleed large typography behind images or gradients to create a 3D, layered editorial effect.
- **DO** use `backdrop-blur` on nav bars to let orange and blue content peak through during scroll.
- **DO** maintain strict `ROUND_FULL` on all interactive elements.
- **DO** animate XP gain and completion moments — they are core to the product experience.
- **DO** differentiate coach/org surfaces from player surfaces through palette weighting (Navy-heavy vs Orange-heavy).

### Don't

- **DON'T** use 1px solid borders for separation. It breaks the Kinetic flow.
- **DON'T** use standard grey shadows. Use ambient, tinted shadows.
- **DON'T** overcrowd the UI — compact spacing keeps things intentional, but visual clarity must not be sacrificed.
- **DON'T** use sharp corners anywhere. Every touchpoint should feel pill-shaped and ergonomic.
- **DON'T** apply gamification UI (XP chips, glows, reward animations) to coach or org admin surfaces. Keep that energy in the player experience.
- **DON'T** use all-caps on body text or instructions — this is a youth-accessible product.
