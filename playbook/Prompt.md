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
*(Build prompts continue below as we go.)*
