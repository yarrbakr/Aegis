# Aegis — Prompt Log

> A record of the key prompts used to build Aegis with Claude Code — and, for each, **what it produced, what broke, and how it was fixed.** This file is part of the "visible AI-first process" the evaluator rewards: it shows *how* the app was driven, not just the result.

**How to use:** add an entry per meaningful build prompt. Keep the actual prompt text (or a faithful summary), then fill Output / Problems / Fix. Cross-reference [Memory.md](Memory.md) for full session logs.

---

### Entry template
```
### #N — <short title>  ·  <phase>  ·  <date>
**Prompt (summary or verbatim):**
> ...

**Output achieved:** what it produced / whether it worked.
**Problems created:** errors, wrong assumptions, bad output.
**Fix applied:** the follow-up prompt or manual change that resolved it.
```

---

### #1 — Project scoping & playbook  ·  Pre-build  ·  2026-07-22
**Prompt (summary):**
> Discussed the assignment, CyberGen's values, and class notes. Scored the 5 project options against a weighted rubric; chose the Meal Planner reframed as a safety-first "allergen guardrail" app. Locked name (Aegis), stack (Next.js + FastAPI + Supabase), DB schema, design (60/30/10 sage/coral), and phases. Asked Claude to generate the playbook, CLAUDE.md, and Documentary.md.

**Output achieved:** 9 foundation files created; every major decision recorded with rationale. Clear phased build plan.
**Problems created:** none in the docs. Minor: local PDF page-rendering wasn't available.
**Fix applied:** extracted the class-notes PDF text via `pypdf` instead of image render.

---

### #2 — Phase 0 skeleton (scaffold + backend + git)  ·  Phase 0  ·  2026-07-22
**Prompt (summary):**
> User provided the GitHub repo (`github.com/yarrbakr/Aegis`) and said go. Scaffold the Next.js app, build the minimal FastAPI `/health` backend, set up `.gitignore` + `.env.example`, and commit everything in small commits on the right branches (branch-per-feature; don't push).

**Output achieved:** Next.js 16.2.11 + TS + Tailwind scaffolded at repo root (`npm run build` passes). FastAPI `/backend/main.py` with `/health` → 200 (smoke-tested via TestClient). `.gitignore`, `.env.example` (root + backend), pinned `requirements.txt`. `git init`, remote set, 4 commits on `feat/phase-0-skeleton`, merged to `main` via `--no-ff`. Nothing pushed (awaiting permission).
**Problems created:** (1) `create-next-app` won't use a folder name starting with `_`. (2) Windows "resource busy" on temp-folder delete. (3) guessed `openai==1.59.0` pin didn't exist on PyPI.
**Fix applied:** (1) used `aegis-tmp`, moved files to root, deleted temp. (2) deleted via PowerShell `Remove-Item -Recurse -Force`. (3) installed with capped ranges, then re-pinned the exact resolved versions.

---

### #3 — Phase 2: core AI generation (end to end)  ·  Phase 2  ·  2026-07-22
**Prompt (summary):**
> User added `GROQ_API_KEY` to `.env.local` and said: build Phase 2 in one go, push the code, and update Phases.md. Build `POST /api/generate-plan` (Groq → Zod-validated meal JSON → persist plan/meals/ingredients under RLS) plus the 7-day plan-grid UI and a generate button, on `feat/generate-plan`.

**Output achieved:** Full pipeline built and **verified live locally**. Route (`nodejs`, `maxDuration=60`): auth → load profile → fixed system prompt with prefs inserted as *data* (injection defense) → Groq Llama 3.3 70B in JSON mode (temp 0.3) → **Zod validation with one repair retry** → persist as the user so RLS enforces ownership. UI: `MealCard`, `PlanGrid` (7-day, horizontal-scroll — page never scrolls sideways), `GenerateButton` (loading + inline error), `/plan/[id]` (reads back under RLS), dashboard view/regenerate section. `npm run build` green. One click produced **21 meals, total ~68.50 within the 120 budget**, macros + allergen tags per card; the model avoided the user's declared allergens (Peanuts/Shellfish/Kiwi); zero console errors. 4 small commits.
**Problems created:** none functional. Local dev port 3000 was busy → autoPort moved it to 49674 (no impact). CRLF/LF line-ending warnings on commit (cosmetic, Windows).
**Fix applied:** n/a — built to spec. Note for prod: generation needs `GROQ_API_KEY` added to **Vercel** env (server-side secret) before it works on the live URL.

---

### #4 — Phase 3 (trust layer) + Phase 4 (viz) + USD, in one go  ·  Phase 3–4  ·  2026-07-22
**Prompt (summary or verbatim):**
> "(1) use USD, update it. (2) complete phase 3 and phase 4 in one go, test it, check it matches all — and make sure it matches the requirement: *Create weekly meal plans based on the user preferences, budget and dietary requirements*." (User had added the Groq key.)

**Output achieved:** Both phases built and **verified live**.
- **USD:** `lib/format.ts` (`usd`/`usdApprox`) across cards/plan/dashboard/onboarding; prompt states costs are USD.
- **Phase 3 (guardrail):** deterministic `lib/guardrails/allergen.ts` (`screenMeal` — defense-in-depth: tags **and** ingredient/meal names, synonym-expanded; allergen-aware to avoid nut-butter / plant-milk / GF-flour false positives) + `injection.ts` input filter. Route: input guardrail → generate → output guardrail (single-meal regenerate ≤3/meal, ≤12/plan; safe placeholder) → persist w/ `safety_status` → log `safety_events`. Mistral fallback in the LLM client. "✓ allergen-safe" badges.
- **Phase 4 (viz):** dark **Safety Dashboard** (`safety_events`), **BudgetMeter**/**BudgetBar**/**NutritionDonut** (recharts) via `lib/plan-stats.ts`, Design.md fonts (Jakarta/Inter/JetBrains Mono).
- **Tests:** `npm run test:guardrail` = **14/14 (100%)**; live generation = 21 screened / 21 passed / 0 blocked, `safety_events` read back, USD + charts + badges render, zero console errors.

**Problems created:** (1) recharts 3 tooltip formatter types are stricter (`value` may be `undefined`). (2) `.ts`-extension imports in the guardrail test would break Next's typecheck. (3) Browser-pane clicks wouldn't reliably land on the generate button.
**Fix applied:** (1) dropped explicit formatter param types + `Number()` coercion. (2) excluded `**/*.test.ts` from tsconfig; run the test via Node type-stripping. (3) tested the endpoint directly with `fetch()` from the page session (endpoint testing is Rules-endorsed), then rendered the resulting plan page.

---

### #5 — Phase 5: eval harness (push held)  ·  Phase 5  ·  2026-07-22
**Prompt (summary or verbatim):**
> "Do Phase 5 for now and hold the push — I have major design/color and interactive feature changes before we push it to GitHub and the live site updates."

**Output achieved:** `lib/eval/run-eval.ts` (`npm run eval`) — a labeled corpus of unsafe + safe meals across 14 allergy profiles run through the **real shipped** `screenMeal` (unsafe foods planted 3 ways: correct tag, **untagged** ingredient, meal-name-only; the food list is independent of the guardrail's synonyms, so it's not circular). Prints catch rate + specificity, exits non-zero on any miss. **236 meals (180 unsafe / 56 safe) → 100.0% catch rate, 100.0% specificity.** Output saved to `lib/eval/RESULTS.md` for the README. Push deliberately NOT done — held per user.
**Problems created:** harmless Node module-type warning on the script; `.ts`-extension imports would break Next's typecheck.
**Fix applied:** left the warning (adding `"type":"module"` risks Next's CJS config); excluded `lib/eval/**` from tsconfig; run via Node type-stripping.

---

### #6 — 5 UX/safety fixes from live testing  ·  Post-P5 hardening  ·  2026-07-22
**Prompt (summary or verbatim):**
> User tested locally and reported 5 issues (annotated screenshots): (1) sign-in/create-account fields identical; (2) name & budget marked optional but should be required; (3) Safety Dashboard says 21 passed AND 10 blocked (looks like 31); (4) regeneration logs look like the model is stuck; (5) a blocked Tuesday-dinner log vs a "safe" replacement card — mismatch. "First fix these, then we'll come to the designing."

**Output achieved:** all 5 fixed + a bonus root-cause fix, verified live.
- Login → two-mode form (Sign in vs Create account with a required Name field, distinct actions).
- Name + weekly budget now required (schema + form).
- Safety Dashboard metrics recomputed from the authoritative meals table and reworded to non-additive tiles (MEALS SERVED / CAUGHT + REGENERATED / INJECTIONS / ALLERGENS) with a plain-language subtitle — no more contradiction.
- Guardrail logs one clear event per meal ("original X blocked → replaced with safe Y"), no "attempt 1/3" spam; catches surfaced first in the log.
- Bonus: fixed a real guardrail false positive — "salt-free seasoning" / "gluten-free bread" / "dairy-free cheese" were being blocked; `screenMeal` now honors "-free / free of / no / without" in name scans (tags still trusted).

**Problems created:** browser-pane clicks unreliable; a compound PowerShell here-string merged two commits.
**Fix applied:** verified via form_input + endpoint fetch + JS state reads; `git reset --soft` and recommitted with `-F` message files (4 clean commits). `npm run build` green, `test:guardrail` 18/18, `eval` 100%/100%.

---

### #7 — Dashboard app shell + pastel redesign  ·  Design pass (D11)  ·  2026-07-22
**Prompt (summary or verbatim):**
> User shared a "Daily Meal" dashboard reference and confirmed the direction: adopt the pastel scheme with a hint of Aegis; landing = dashboard; sidebar IA = Dashboard · Meal Plans · Security Console · Profile; "meal for today" prominent + real charts/pie; snack recommendations (guardrail-screened) instead of meal recs; keep the default accent (sage = active nav + primary buttons, coral = safety).

**Output achieved:** built on `feat/dashboard-shell`, `npm run build` green.
- **Shell:** `components/shell/Sidebar.tsx` + `Topbar.tsx` over an `app/(app)/` route group whose `layout.tsx` gates auth once. Sage active pill; icon-only rail on mobile, full labels on md+.
- **Dashboard (pastel):** `DashboardView` (presentation split from data-loading) — stat cards (calories/carbs/protein/budget), a sage `CaloriesLine` chart (Weekly toggle; Monthly/Yearly gated honestly), the macro Report donut, Meal-for-today, and snack recommendations. A slim safety strip links to the Security Console (safety stays visible without a stat card).
- **Snacks:** `lib/snacks.ts` — a curated list filtered through the SAME `screenMeal` guardrail; the preview (peanuts+milk) correctly hid PB rice cakes / yogurt / cheese-crackers. Guardrail earns its keep on a 2nd surface, zero extra model calls.
- **Nav pages:** Meal Plans / Security Console / Profile reuse the already-verified charts, PlanGrid, and SafetyDashboard inside the shell.

**Problems created:** (1) couldn't log into local dev (expired session) to view the authed pages. (2) stale dev-server logs showed old `blocked`/`safetyStats` errors (not real). (3) after deleting the temp preview route, `next build` tripped on a stale generated type in `.next`.
**Fix applied:** (1) split `DashboardView` and rendered it with sample data on a throwaway `/design-preview` route (no auth/DB) to screenshot, then deleted it — never entered credentials. (2) a full `npm run build` confirmed disk was clean. (3) `rm -rf .next && npm run build` → green.

---

### #8 — Design feedback round 1 (5 items)  ·  Design pass  ·  2026-07-22
**Prompt (summary or verbatim):**
> User tested the new dashboard (as a `cybergen` account) and flagged 5 things: (1) the search bar doesn't work; (2) panel headings hard to catch — match the reference; (3) the Meal Plans week is clustered — wants a roomier layout (idea: vertical days → click to reveal); (4) the Security Console is too black/scary; (5) the "Recent events" look like raw model logs. Then chose **day tabs** for the layout and **remove** for the search.

**Output achieved:** all 5 done, `npm run build` green, verified live on the real cybergen plan.
- Headings → bold + underline rule; fixed the calorie chart's clipped Y-axis (width 40→48).
- Security Console rewritten from the dark terminal to a light on-brand card (sage/amber/violet tiles); applies to /security and /plan/[id].
- Safety log → friendly activity cards derived from `event_type` + `allergen` (catches framed positively), no raw "attempt/placeholder" noise.
- Meal Plans → `components/meal/WeekView.tsx` day-tabs (opens on today, roomy 3-card day); retired `PlanGrid`.
- Removed the search field, then the whole `Topbar` (it only duplicated the sidebar user block).

**Problems created:** (1) a transient mismatch when clicking a day tab in the throwaway `/design-preview` (looked like active≠content). (2) after deleting the temp preview route, `next build` tripped on a stale generated type in `.next`.
**Fix applied:** (1) not a real bug — verified live on the cybergen account, tab switching swaps the day correctly (Wed→Fri). (2) `rm -rf .next && npm run build` → green.

---

### #9 — Legibility pass + animated landing hero  ·  Design pass  ·  2026-07-22
**Prompt (summary or verbatim):**
> "The highlighted details [stat-card sub-labels] should be caught by the eye in the first look… make those more obvious and the same in the rest of the web app." Plus: animate the landing hero (provided a `SoftBlurIn` motion component) with "Eat Healthy, Stay Healthy" / "yours truly, Aegis". Plus 4 questions (snacks Groq-or-guesses, where's the eval, taste-prefs time/risk, the animation).

**Output achieved:** `npm run build` green, verified live.
- **Legibility:** stat-card label → `#3D4653` semibold, sub → `#6B7280` medium (was #6B7280 / #9CA3AF); same darkening on the Security Console tiles.
- **Landing animation:** installed **`motion`**, added `components/ui/soft-blur-in.tsx` (per-char blur-in, respects reduced-motion), rewrote `app/page.tsx` hero — animated "Eat Healthy," / "Stay Healthy" + "yours truly, Aegis"; kept the safety hook as subhead; CTA → sage. No console errors.
- **Answers:** snacks = curated `lib/snacks.ts` filtered by the deterministic guardrail (NOT Groq; the weekly plan IS Groq-generated + screened); eval = `npm run eval` (`lib/eval/run-eval.ts`) → re-ran **236 meals / 100% / 100%**; taste prefs ≈ 30–45 min, low risk (additive nullable `profiles` columns).

**Problems created:** none — build green, no console errors, motion works with React 19 / Next 16.
**Fix applied:** n/a.

---

### #10 — Sidebar collapse + per-day nutrition + hero one-liner  ·  Design pass  ·  2026-07-22
**Prompt (summary or verbatim):**
> "Add a collapse button to minimize this sidebar" · "make this pie chart show the macros of the selected day from the meal plan page and also show which day's macros it is showing" · "that's a lot of text, summarize it in one line, don't make it sound ai or generic, something catchy".

**Output achieved:** all 3 done, `npm run build` green, verified live on cybergen.
- Sidebar → desktop collapse toggle (chevron), minimizes to the icon rail and back; persisted in localStorage. Collapse + expand both verified.
- Nutrition donut moved into `WeekView`; it now shows the selected day's macros and names the day ("Nutrition · Wednesday"). Verified Wed 170g → Thu 260g on tab switch. Standalone weekly-nutrition card retired on /meal-plans + /plan/[id] (top row now Budget + Cost-by-day).
- Hero paragraph → one line: "AI plans your week; a safety shield keeps your allergens off the menu."

**Problems created:** removed `NutritionDonut`/`weeklyMacros` imports from two pages — potential unused-import errors.
**Fix applied:** cleaned the imports + `macros` vars in both pages; `npm run build` green.

---

### #11 — Taste preferences (the last vision piece)  ·  2026-07-22
**Prompt (summary or verbatim):**
> "Start work on the Taste Preferences thing, read all the files, make sure the existing working web app doesn't break. DON'T PUSH ANYTHING, do everything locally, make sure the taste preference thing is used where necessary in the features of the app and log everything."

**Output achieved:** built end-to-end on `feat/taste-preferences` (4 commits, unpushed). `npm run build` green, `test:guardrail` **22/22**, `eval` still **236 → 100%/100%**.
- **Data:** `favorite_cuisines` + `disliked_foods` (`text[]`) on `profiles` — migration `0001_taste_preferences.sql` (additive/idempotent, no new RLS), `schema.sql` + `types.ts` + `onboardingSchema` (`COMMON_CUISINES`).
- **Security:** `screenPreferences` now injection-screens the taste free-text too (poisoned cuisine dropped + logged); prompt gets the screened prefs as DATA via `PromptPrefs`; soft rules 7–8 (lean toward cuisines / avoid dislikes) that **never override the hard allergen+diet rules — safety wins over taste**. Output guardrail unchanged.
- **UI:** onboarding "Taste preferences (optional)" fieldset; Profile placeholder → live chips card. Reads guard `?? []` (won't break pre-migration).
- **2nd surface:** dashboard snacks drop disliked snacks *after* the safety screen (never surfaces an unsafe snack; falls back if dislikes empty it).
- **Tests:** +4 taste-injection checks in `guardrails.test.ts`.
- **Verification:** couldn't log into local dev (no account creation/passwords) → rendered the real taste markup with sample data on a throwaway `/taste-preview` route, screenshotted the onboarding fieldset + Profile card, deleted the route + `.next`, rebuilt green.

**Problems created:** (1) changed `safeSnacks`/`screenPreferences`/`buildPlanMessages` signatures — risk of stale callers. (2) taste columns don't exist in the live DB yet → onboarding SAVE would error until the migration runs.
**Fix applied:** (1) grepped all callers, updated the dashboard call + route threading; the existing `screenPreferences` test still passes (subset destructure). (2) **left as a flagged pending user action** — reads are defensive so nothing else breaks; migration is the one non-local step (present it / offer the pooler). Nothing pushed per instruction.

---

### #12 — Fix: disliked food still appeared in a plan  ·  2026-07-22
**Prompt (verbatim):**
> "i added mushrooms in the one that I disliked, but it still showed up" (with a screenshot of a "Grilled Portobello Mushrooms" meal card).

**Output achieved:** made dislikes deterministic instead of trusting the model. All local, `npm run build` green, `test:guardrail` **27/27**, `eval` still **100%/100%**.
- Root cause: dislikes were a soft prompt hint (rule 8) the model half-ignored (the meal's own description said "…replaced with grilled eggplant" while keeping the mushroom name). Data path was correct.
- Fix: `lib/taste.ts` `findDislikedTerm` (deterministic, plural-forgiving) + a best-effort **TASTE PASS** in the route that re-rolls disliked meals on the RAW output **before** the allergen guardrail (bounded ≤2/meal, ≤6/plan; dedicated `buildDislikeRegenMessages`). Runs first so the guardrail is the authoritative last word and audit logs name the final meals. Snacks reuse the shared matcher. +5 taste tests.
- **Safety:** guardrail + eval untouched; any allergen a taste re-roll introduces is still caught. Safety is never traded for taste.

**Problems created:** first wiring put the taste pass AFTER the safety pass (would make `safety_events` name the pre-swap meal — the Session-6 log/card-mismatch class) and I mangled the try/catch block mid-edit.
**Fix applied:** reordered to taste→safety (raw meals first); rewrote the block cleanly; renumbered the step comments; re-ran build/tests/eval green.

---

### #13 — Post-ship: loading states + 502 diagnosis + Mistral answer  ·  2026-07-22
**Prompt (summary):**
> New-account live test surfaced 3 things: (1) generate → 502 (`api/generate-plan` 502 in devtools); (2) navigation/clicks feel stuck — add a loading animation; (3) "what happened to the Mistral fallback?"

**Output achieved:** diagnosed with evidence, fixed what's in-code, `build`/`27-27`/`100%-100%` green.
- **Diagnosis:** probed Groq with the local key → trivial call 200 (key/model fine); full 21-meal call → **429 daily token cap** (Limit 100000, Used 95530). The 502 was Groq's free-tier TPD limit, not a bug. Mistral fallback exists in code but was never keyed.
- **#2:** `app/(app)/loading.tsx` skeleton (sidebar persists) + `useLinkStatus` spinner on the clicked tab. Verified the skeleton via throwaway `/loading-preview` (screenshot, deleted).
- **#1:** 429 → friendly "at capacity" message (429, not 502); single-meal calls capped at `max_tokens` 2000 (was 8000) to ease the daily cap.
- **#3:** answered — fallback is real, just needs `MISTRAL_API_KEY` set to activate.

**Problems created:** `useLinkStatus` is a newer `next/link` export — risk it wasn't available in this Next version.
**Fix applied:** it is (Next 16); build compiled clean. Left the Groq-cap + Mistral-key items as flagged user actions (can't set their secrets/env).

---

### #14 — Faster Mistral fallback + Phase 6 (README + playbook sync)  ·  2026-07-22
**Prompt (summary):**
> "Do the [mistral-small] swap and tell me if we can add a Mistral chatbot." → then: "push the mistral swap, make sure ALL playbook docs + CLAUDE.md + Documentary.md capture everything, go ahead with Phase 6, hold the chatbot."

**Output achieved:**
- Verified `mistral-small-latest` = ~32s full plan (vs ~56s large), valid JSON, honored allergen + dislike → `MISTRAL_MODEL` swap; merged + pushed (`117f6d6`).
- **Chatbot:** answered (feasible; Mistral base, Groq stays primary for planning; MUST defer safety to the deterministic guardrail — never adjudicate). **Deferred per user.**
- **Phase 6:** wrote `README.md` (decides-then-builds + eval number + locked decisions + what's-next). Synced Phases/Design/Architecture/PRD/CLAUDE to the shipped reality (D11 design, taste columns, Groq+Mistral). Documentary got the "day the tokens ran out" hardening section + Phase 6 + "what I'd do next".

**Problems created:** Design.md and Phases.md had drifted (dark console / coral CTA / unchecked P0-P1 boxes) vs. what actually shipped.
**Fix applied:** added Design.md §5 (D11 supersedes) rather than rewriting; checked P0/P1, added Phase 5.5, updated counts (14/14 → 27/27). Build green (docs-only).

---
*(Build prompts continue below as we go.)*
