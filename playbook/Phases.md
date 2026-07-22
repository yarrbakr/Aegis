# Aegis — Build Phases

> Each phase ends with something **working and committed**. We do not start a phase until the previous one is done and (where relevant) deployed. This ordering is deliberate: **prove the pipeline first, then build inward, add the trust layer, then polish, then prove it works.**

Time budget: ~7 hours. Phases are sized so that if we run out of time, we still have a shipped, safe app — the trust layer (Phase 3) comes *before* polish (Phase 4) on purpose.

---

## Phase 0 — Setup & skeleton deploy  *(de-risk everything first)*
**Goal: a live, empty frontend before any features exist.** (All-Vercel — D10.)
- [x] Init Next.js (TypeScript + Tailwind) at repo root; `git init` + push to GitHub. (shadcn added when we build UI.)
- [x] Minimal FastAPI in `/backend` with `GET /health` (kept for the post-core Render stretch).
- [x] `.env.example` committed (frontend + backend).
- [ ] Create Supabase project; grab URL + anon key.
- [ ] Deploy Next.js → **Vercel** (live URL works).
- [ ] Wire env vars (Supabase URL + anon key) in Vercel + `.env.local`.
- **Done when:** the live Vercel URL loads.

## Phase 1 — Auth & data foundation
**Goal: a user can log in and save their preferences.**
- [ ] Run `schema.sql` + `policies.sql` in Supabase (all tables + RLS).
- [ ] Supabase Auth: sign up / log in / log out.
- [ ] Onboarding form: diet type, allergies (multi-select), weekly budget, # people → saves to `profiles`.
- **Done when:** a logged-in user's preferences persist and reload correctly (RLS verified — can't see others' data).

## Phase 2 — Core AI generation ✅ DONE (verified locally)
**Goal: generate and display a weekly plan.**
- [x] `POST /api/generate-plan` (Next.js Route Handler): fixed system prompt + user prefs → Groq (Llama 3.3 70B, JSON mode) → structured meal JSON (**Zod**-validated, one repair retry).
- [x] Persist plan → meals → ingredients to Supabase (server-side, RLS-enforced via the user's session).
- [x] Plan view UI: 7-day grid of meal cards (name, cost, calories, macros, allergen tags); dashboard view/regenerate section.
- **Done when:** clicking "Generate" returns a saved, displayed weekly plan. ✅ **Verified:** one click → 21 meals, total ~68.50 within the 120 budget, read back from Supabase under RLS, no console errors. (No guardrail yet — that's Phase 3.)

## Phase 3 — The trust layer ✅ DONE (verified live)  *(the headline)*
**Goal: the app is provably safe.**
- [x] **Output guardrail** (`lib/guardrails/allergen.ts`): scan each meal against the user's `allergens` — **defense in depth**: not just `ingredients.allergen_tags` but ingredient names + meal text, synonym-expanded. Unsafe → block, log `meal_blocked`, regenerate (≤3, ≤12/plan), safe placeholder if still unsafe. Safe → log `meal_passed`. `safety_status` stamped per meal.
- [x] **Input guardrail** (`lib/guardrails/injection.ts`): screen free-text prefs for injection patterns; drop from prompt; log `injection_detected`.
- [x] Visible **"✓ allergen-safe"** badge on every meal card (+ "↻ regenerated for safety" note).
- [x] Mistral fallback wired into the LLM client (optional — used if `MISTRAL_API_KEY` set).
- **Done when:** we can force an unsafe suggestion and watch it get blocked + regenerated, with an event logged. ✅ **Verified:** `npm run test:guardrail` = **14/14 (100%)** incl. untagged-allergen catches; live generation = 21 meals screened, 21 passed, 0 unsafe served, `safety_events` logged & read back, no console errors. Also: currency switched to **USD** throughout.

## Phase 4 — Visualization & taste ✅ DONE (verified live)
**Goal: it looks considered and the safety is *visible*.**
- [x] **Safety Dashboard** (from `safety_events`): meals screened / passed / blocked+regen / injections caught / allergens watched + live event log. Dark console-styled. On the plan page (scoped) and dashboard (lifetime).
- [x] **Budget bar chart** (per-day cost + daily-budget line) + **budget meter** (spend vs weekly budget). **Nutrition donut** (weekly macros). Recharts, USD.
- [x] Apply [Design.md](Design.md): palette + fonts (Plus Jakarta Sans / Inter / JetBrains Mono), empty/loading/error states.
- **Done when:** the app matches the design spec and the Safety Dashboard tells the safety story at a glance. ✅ **Verified live:** console renders 21/21 + event log, charts draw, USD everywhere, safe badges on every card, no sideways page scroll, zero console errors.

## Phase 5 — Evidence & eval ✅ DONE
**Goal: a number that proves it works.**
- [x] `eval` script (`lib/eval/run-eval.ts`, `npm run eval`): a labeled corpus of unsafe + safe meals across 14 allergy profiles, run through the **real shipped** `screenMeal` (not a copy). Unsafe meals hide a real allergen 3 ways (tag / **untagged** ingredient / meal-name-only). Prints **catch rate** + specificity; exits non-zero on any miss.
- [x] Saved the eval output for the README → `lib/eval/RESULTS.md`.
- **Done when:** the eval prints a clean catch-rate figure (target 100%). ✅ **236 meals (180 unsafe / 56 safe) → CATCH RATE 180/180 = 100.0%, SPECIFICITY 56/56 = 100.0%.**

## Phase 6 — Docs & submission
**Goal: the AI-first process is visible and everything is submitted.**
- [ ] `README.md`: decides-then-builds — stack + data model + "locked decisions" table + "what I'd do next" + live link + eval number + "built with Claude Code" note.
- [ ] Finalize [Documentary.md](../Documentary.md), [Prompt.md](Prompt.md), [Memory.md](Memory.md).
- [ ] Final deploy check: every submitted link works from a fresh browser.
- [ ] Email submission: Full Name · Project Title (Aegis) · Live URL · GitHub link · 2–3 line description.
- **Done when:** submitted, and all links verified working.

---

## Stretch — only if genuinely ahead
- **Deploy the `/backend` FastAPI to Render** as a live "evidence" endpoint (`/health` + `/docs`) — the CyberGen FastAPI+LLM signal, added *only after* the core ships (D10).
- Shopping list from the plan · regenerate a single meal · **RAG** recipe retrieval.

## Architecture note
All-Vercel is the **primary** path (generation + guardrail in a Next.js server route) — see [Memory.md](Memory.md) D10. FastAPI/Render moved to the post-core **stretch** above. Keeps `main` shippable on one platform.
