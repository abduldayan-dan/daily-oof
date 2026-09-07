# DESIGN.md — Nurture by Arbisoft

## Overview

Nurture is the product design and research lab at Arbisoft. Warm, human, and approachable — the brand balances playful illustration with editorial precision. The visual language is friendly but opinionated: brutalist structure (hard edges, visible strokes, offset shadows) softened by a rich pastel palette and conversational typography.

---

## Colors

### Solids
- **brand-orange** (`#E3492B`): primary accent, CTAs, highlight text, icon fills
- **brand-green** (`#1B998B`): secondary accent, links, success states
- **brand-navy** (`#0D3764`): headings, body text, icon strokes, dark backgrounds
- **eggshell** (`#F5F0E3`): warm off-white surface, card backgrounds, page sections
- **light-gray** (`#F4F4F4`): neutral surface, icon background (empty/default state), main app background

### Pastels
- **baby-purple** (`#DBCDF0`): section backgrounds, tag fills, decorative
- **baby-cyan** (`#97ECF1`): section backgrounds, highlight blocks
- **light-salmon** (`#F8A978`): icon offset shadow, accent backgrounds, hover shadows
- **powder-blue** (`#BADFDB`): section backgrounds, card tints
- **baby-blue-eyes** (`#B2D0FD`): decorative, tag fills
- **baby-pink** (`#F5CAC3`): section backgrounds, decorative
- **hot-pink** (`#FF5E98`): accent, badges, high-energy highlights
- **yellow** (`#FCCC5D`): accent, badges, callout backgrounds

### Pairing rules
- Default mode: solid color on pastel background (navy on powder-blue, green on baby-pink, etc.)
- Inverted mode: pastel on solid background (baby-cyan on navy, salmon on brand-green, etc.)
- DON'T pair two pastels together — contrast is insufficient for text
- DON'T pair brand-orange and hot-pink in the same component
- Light-gray (`#F4F4F4`) is for neutral/empty states and the main app background — not a section background color

---

## Typography

- **Headings**: DM Serif Display, 400 (regular italic available for emphasis), 32–64px, tracking normal
- **Body / Paragraph**: Roboto Mono, 400, 14–16px, leading relaxed
- **Labels / Captions**: Roboto Mono, 400, 12–14px, uppercase tracking-wide
- **Nav links**: Roboto Mono, 400, 14px, lowercase

### Tone rules
- Navigation and UI labels are **lowercase** — this is intentional, not an oversight
- Headings may mix roman and italic within a phrase for emphasis
- DON'T use Roboto Mono bold for body text — weight contrast comes from DM Serif, not from bold mono

### Muted / secondary text
- Use `rgba(13,55,100,0.60)` for secondary/muted text on light backgrounds — minimum for accessibility
- Use `rgba(13,55,100,0.50)` for very subtle UI chrome (icons, decorative indicators) — not for readable text
- DON'T go below `0.50` opacity for any text or interactive icon

---

## Spacing

Base unit: 8px

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px
- `4xl`: 96px

Section padding (top/bottom): `4xl` (96px) on desktop, `3xl` (64px) on mobile.

---

## Components

### Buttons
- Border: 2px solid `brand-navy`
- Border radius: 0px (hard corners, no rounding)
- Padding: `md` vertical (`lg` horizontal)
- Background: solid color (brand-orange or brand-navy typical)
- Text: Roboto Mono, 14px, lowercase
- Hover: offset box-shadow — 4px 4px 0px `brand-navy` (brutalist shift effect)
- DON'T use border-radius on buttons under any circumstance

### Cards
- Border: 2px solid `brand-navy`
- Border radius: 0px
- Background: white or eggshell
- Hover: background shifts to light-gray (`#F4F4F4`), offset shadow appears (4px 4px 0px `brand-navy`) — shadow on hover only, not resting state
- Nested/expanded rows: use `#E8E8E8` to distinguish from the parent white surface
- Label text (e.g. "problem discovery"): Roboto Mono, 12px, lowercase, right-aligned
- Client name: DM Serif Display or Roboto Mono bold, left-aligned

### Icons
- Frame: square, 2px stroke, `brand-navy`
- Fill: white (default/empty state on `#F4F4F4` bg) or white on color background
- Shadow variant: offset duplicate frame in `light-salmon` (`#F8A978`), shifted 6–8px down-right
- Used on colored section backgrounds (e.g. powder-blue): white fill, navy stroke, salmon shadow
- Icon labels: Roboto Mono, 14px, lowercase, centered below icon

---

## Do's and Don'ts

- DO use 0px border radius consistently across all interactive elements
- DO keep strokes at 2px — not 1px, not 3px
- DO use offset shadows (4–8px) for hover/press states and icon depth — this is the brutalist signature
- DON'T show offset shadows on cards or buttons in their resting state — hover/press only
- DO write UI copy in lowercase (nav, labels, buttons, tags)
- DO use DM Serif Display for any headline that needs warmth or personality
- DO use Roboto Mono for all functional/UI text — including body copy
- DON'T use drop shadows (box-shadow blur) — only hard offset shadows with 0 blur
- DON'T round corners on any interactive element (buttons, cards, inputs)
- DON'T use more than two section background colors on a single page without a neutral break
- DON'T mix the monospace body font with a sans-serif — the mono/serif pairing is the system
