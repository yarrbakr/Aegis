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

## Phase 3 — The trust layer  *(the headline — do NOT skip or defer)*
**Goal: the app is provably safe.**
- [ ] **Output guardrail** (`lib/guardrails/allergen.ts`): scan each meal's `ingredients.allergen_tags` against the user's `allergens`. Unsafe → block, log `meal_blocked`, regenerate (≤3). Safe → log `meal_passed`.
- [ ] **Input guardrail** (`lib/guardrails/injection.ts`): screen free-text prefs for injection patterns; log `injection_detected`.
- [ ] Visible **"✓ allergen-safe"** badge on every meal card.
- [ ] Mistral fallback wired into the LLM client.
- **Done when:** we can force an unsafe suggestion and watch it get blocked + regenerated, with an event logged.

## Phase 4 — Visualization & taste
**Goal: it looks considered and the safety is *visible*.**
- [ ] **Safety Dashboard** (from `safety_events`): generated / passed / blocked / injections caught / allergens screened. Console-styled.
- [ ] **Budget bar chart** + budget meter. **Nutrition donut.**
- [ ] Apply [Design.md](Design.md) fully: palette, fonts, spacing, empty/loading/error states.
- **Done when:** the app matches the design spec and the Safety Dashboard tells the safety story at a glance.

## Phase 5 — Evidence & eval
**Goal: a number that proves it works.**
- [ ] `eval` script (TypeScript/node): run N generations across allergy profiles, assert zero unsafe meals pass the guardrail, print **catch rate**. Tests the *real* shipped `lib/guardrails` code (not a copy).
- [ ] Save the eval output (screenshot/log) for the README.
- **Done when:** the eval prints a clean catch-rate figure (target 100%).

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
