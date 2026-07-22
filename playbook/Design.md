# Aegis — Design

> Direction: **Fresh & clean (health-tech)** — trustworthy and appetizing — with the **Safety Dashboard** styled like a mini security console for contrast. Taste is heavily weighted by the evaluator, so this file is a real spec, not an afterthought.

---

## 1. Color & theme

Built on the **60 / 30 / 10 rule.**

| Role | Name | Hex | Usage |
|---|---|---|---|
| 60% — Canvas | Crisp Off-White | `#F8F9FA` | Page background |
| — Surface | White | `#FFFFFF` | Cards, panels |
| 30% — Structure | Sage Green | `#4C7B61` | Headers, primary buttons, nav, "safe" accents |
| 10% — Action | Vibrant Coral | `#FF6B6B` | Primary CTA (Generate), key highlights |

### Supporting tokens
| Token | Hex | Notes |
|---|---|---|
| `sage-dark` | `#3B6149` | Hover/pressed for sage |
| `sage-tint` | `#EAF1EC` | Safe-badge backgrounds, subtle fills |
| `coral-strong` | `#FA5252` | **Accessible** coral for text/links (see note) & hover |
| `ink` | `#1F2933` | Primary text |
| `muted` | `#6B7280` | Secondary text |
| `border` | `#E5E7EB` | Hairlines, dividers |
| `safe` | `#2F9E44` | "Allergen-safe" success green (distinct, high-contrast) |
| `danger` | `#E03131` | "Blocked / unsafe" — deliberately **not** coral, to keep CTA ≠ danger |
| `console-bg` | `#0F172A` | Safety Dashboard background (slate) |
| `console-line` | `#1E293B` | Console gridlines/borders |

> **Accessibility note (this itself is a trust signal — mention it in the README):**
> `#FF6B6B` on white is ~2.3:1 — **fails** for normal text. So: use coral only as a **fill** (buttons) with white bold text, or for large elements. For coral **text/links**, use `coral-strong` `#FA5252` or darker. Sage `#4C7B61` on white is ~4.9:1 — passes AA. Never encode meaning by color alone (safe badges also carry a ✓ and the word "safe").

### Semantic mapping
- **Safe / passed** → `safe` green + ✓ icon.
- **Blocked / unsafe** → `danger` red + shield-off icon (only ever on the *dashboard/logs*, never on a served meal).
- **Primary CTA ("Generate my week")** → coral fill, white text.
- **Secondary actions** → sage outline/ghost.

### Dark mode
MVP ships **light-only** for the main app (scope discipline). The **Safety Dashboard is dark by design** (console aesthetic) in both cases. If time allows in Phase 4, add a full dark theme — otherwise it's a stretch.

---

## 2. Fonts

Loaded via `next/font` (Google Fonts) — self-hosted, no layout shift.

| Use | Font | Weights |
|---|---|---|
| Display / headings | **Plus Jakarta Sans** | 600, 700 |
| Body / UI | **Inter** | 400, 500, 600 |
| Numbers / console / logs | **JetBrains Mono** | 500 |

Pairing rationale: Plus Jakarta Sans gives headings a friendly, geometric character (appetizing, human); Inter is the neutral workhorse for readable UI; JetBrains Mono on the Safety Dashboard sells the "security console" contrast and makes metrics feel precise.

---

## 3. Typography scale

`1rem = 16px`. Headings use Plus Jakarta Sans; body uses Inter.

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| Display | 2.25rem / 36px | 700 | 1.1 | Landing hero |
| H1 | 1.875rem / 30px | 700 | 1.2 | Page titles |
| H2 | 1.5rem / 24px | 600 | 1.25 | Section titles |
| H3 | 1.25rem / 20px | 600 | 1.3 | Card titles (meal names) |
| Body-lg | 1.125rem / 18px | 400 | 1.6 | Lead paragraphs |
| Body | 1rem / 16px | 400 | 1.6 | Default text |
| Small | 0.875rem / 14px | 500 | 1.5 | Meta (cost, calories) |
| Caption | 0.75rem / 12px | 500 | 1.4 | Labels — UPPERCASE, letter-spacing 0.05em |
| Mono | 0.875rem / 14px | 500 | 1.4 | Dashboard numbers, logs |

---

## 4. Layout & component notes

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 px. Generous whitespace — the "clean" in fresh & clean.
- **Radius:** cards `16px`, buttons `10px`, badges `full`. Soft, friendly.
- **Shadows:** subtle only (`0 1px 3px rgba(0,0,0,0.06)`); rely on whitespace and hairline borders, not heavy shadows.
- **Meal card:** white surface, H3 meal name, small meta row (cost · calories), a sage-tint **✓ allergen-safe** pill, thumbnail/emoji placeholder if no image.
- **Plan grid:** 7 columns on desktop → horizontal scroll / stacked on mobile. Never let the page scroll sideways.
- **Primary CTA:** one coral button per view, max. Coral is 10% — scarcity is what makes it pop.
- **Safety Dashboard:** dark `console-bg` panel, mono metrics, sage for "passed", danger-red for "blocked", a small live log list. This is the screenshot that wins — make it look like a real monitoring console (Argus energy).
- **States:** every data view needs an **empty**, **loading** (skeletons), and **error** state. Empty states are where beginners lose taste points — don't skip them.

---

## 5. Design evolution — D11 (SHIPPED, supersedes parts of §1 & §4)

Sections 1–4 above are the *original* fresh-and-clean spec (Phases 0–4). After the core shipped, a user-directed **design pass (locked decision D11)** reshaped the signed-in app into a "Daily Meal"-style **dashboard product**. Where D11 differs from above, **D11 is what shipped:**

- **Palette:** a **pastel base** (lavender `#ECEBFB` / peach `#FCEFE2` / mint `#E3F3EA` / rose `#FCE8EF`) on the `#F8F9FA` canvas, with **sage `#4C7B61` and coral `#FF6B6B` as the *accent*** (not the whole palette). Ink `#1F2933`.
- **Accent roles (changed):** **sage** = active nav pill **and primary buttons** (Generate, Save); **coral** = reserved for **safety/blocked** states. (Originally the primary CTA was coral — D11 moved primary actions to sage and kept coral for safety.)
- **App shell:** a **collapsible left sidebar** (Dashboard · Meal Plans · Security Console · Profile) over an `(app)` route group that gates auth once; state persisted in `localStorage`.
- **Safety Dashboard → "Security Console":** the dark `console-bg` terminal was **re-skinned to a light, on-brand card** with tinted tiles (sage / amber / violet) after user feedback that the dark console read as "scary." Raw `safety_events` log lines are **humanized** into friendly "here's what we caught for you" cards. (So `console-bg`/`console-line` in §1 are retired.)
- **Legibility pass:** stat-card labels darkened (`#3D4653` semibold / `#6B7280` medium) for contrast on the pastel cards.
- **Landing hero:** a per-character blur-in animation (`components/ui/soft-blur-in.tsx`, `motion`) — "Eat Healthy, Stay Healthy" — with one catchy line and a sage CTA.
- **Loading states:** `app/(app)/loading.tsx` skeleton + a `useLinkStatus` spinner on the clicked sidebar tab, so navigation never feels stuck.

What did **not** change: the semantic rule that **safe = green + ✓** and **blocked = danger red** (never coral-as-danger), the fonts (§2), the typography scale (§3), and "every data view needs empty / loading / error states."

---
*When building UI, re-read this file. §5 (D11) is the current shipped design; §1–4 hold the original rationale and the still-valid type/semantics.*
