# Aegis — Memory (project state · READ THIS FIRST every session)

> **This is the single source of truth for where we stand.** Every session reads this before doing anything. After every prompt/task, append what happened to the **Session Log** at the bottom.

---

## 📍 Current status
- **Phase:** **Phase 2 COMPLETE** ✅ (verified locally) — AI generation → validated → persisted → 7-day grid. Next: Phase 3 (the trust layer / guardrail).
- **Currently working on:** wrapping Phase 2 — commit `feat/generate-plan`, merge to `main`, push (user approved), then verify live on Vercel (needs `GROQ_API_KEY` added to Vercel env).
- **Currently-edited file:** none.
- **Live URLs:** **https://aegis-zeta-six.vercel.app** — auth + onboarding live. ⚠️ Generation won't work in prod until `GROQ_API_KEY` is added to **Vercel env vars** (server-side secret, NOT `NEXT_PUBLIC_`).
- **Blockers:** to verify generation live, user must add `GROQ_API_KEY` to Vercel (Project → Settings → Environment Variables) and redeploy. Test accounts in Supabase: `aegisdemo2026@gmail.com`, `aegislive2027@gmail.com` (deletable).
- **Git:** remote = `github.com/yarrbakr/Aegis`. `feat/generate-plan` = 4 code commits off `main`. Workflow: branch-per-feature, commit everything, ask before every push.

---

## 🔒 Locked decisions
| # | Decision | Rationale |
|---|---|---|
| D1 | **Project = Aegis**, a safety-first AI meal planner | Distinctive; the safety layer answers CyberGen's core question. Name echoes their "Argus". |
| D2 | **Stack:** Next.js + Tailwind + shadcn + **server Route Handler** (Vercel) · Supabase Postgres. FastAPI (`/backend`) kept as a post-core stretch. | Mandated (Supabase/Vercel/Git). AI + guardrail run in a Next.js route on Vercel — one platform, RLS-enforced. See D10. |
| D3 | **DB = Supabase Postgres, relational** | Data is relational (user→plans→meals→ingredients). "Default to Postgres" (class notes). |
| D4 | **LLM = Groq (Llama 3.3 70B) primary, Mistral fallback** | Free, fast, OpenAI-compatible. Fallback = reliability story. |
| D5 | **Guardrail is deterministic, not LLM-judged** (TypeScript, inside the Next.js route) | A security company never lets the model grade its own safety. |
| D6 | **Design:** Fresh & clean; 60/30/10 → off-white `#F8F9FA` / sage `#4C7B61` / coral `#FF6B6B` | User-chosen palette. Safety Dashboard = dark console. |
| D7 | **Deploy skeleton first; ship on one platform (all-Vercel)** | Protect "shipped". A working link beats a perfect stack. Superseded the two-service plan — see D10. |
| D8 | **No real payments/bank integrations; not a medical device** | Out of scope + safety. |
| D9 | **Git workflow: commit every change (explained), branch-per-feature (`feat/*`), ask before every push** | Visible AI-first process + `main` stays deployable. Pinned in [Rules.md §6](Rules.md#6-git-workflow-branch-per-feature--commit-everything--ask-before-push) + CLAUDE.md. |
| D10 | **All-Vercel is primary: AI generation + deterministic guardrail run in a Next.js server Route Handler. FastAPI/Render demoted to a post-core stretch (a live "evidence" endpoint only).** | (1) One platform → clean ship, no free-tier cold-start in front of the evaluator. (2) The route runs under the user's Supabase session → **RLS enforced automatically** (stronger security story for a safety app). (3) Same guardrail behavior, TypeScript instead of Python — the eval tests the *real* shipped code. FastAPI stays in `/backend` as documented architecture; deploy to Render only after the core ships. |

---

## ✅ Completed
- Read all 3 source documents (assignment image, company brief, class notes).
- Scored 5 project options → chose Meal Planner (70/80).
- Locked name, stack, DB schema, design direction.
- Created playbook: PRD, Architecture, Rules, Phases, Design, Memory, Prompt.
- Created CLAUDE.md + Documentary.md.
- **Phase 0 (local):** scaffolded Next.js 16 + TS + Tailwind at repo root (`npm run build` passes); FastAPI `/backend` with `/health` (smoke-tested → 200); `.gitignore` + `.env.example` (frontend + backend); `git init`, remote set, 4 clean commits + merge to `main`.
- **Phase 0 (cloud):** ✅ **deployed Next.js skeleton to Vercel — live at https://aegis-zeta-six.vercel.app.** Resolved Vercel's new multi-service auto-detection (it saw `/backend/requirements.txt` and tried to deploy FastAPI too) by switching the **Application Preset to Next.js** → clean single-app build (no Python step). Auto-deploy on push to `main` is wired.
- **Phase 1 (DB):** applied `schema.sql` + `policies.sql` to Supabase via the session pooler — 5 tables, **RLS ON on all**, 8 policies, 2 triggers (verified).
- **Phase 1 (auth):** email/password auth (`@supabase/ssr`), `/login` (sign in/up + error surfacing), `/auth/signout`, protected `/dashboard`, `/onboarding` form → `profiles` (zod-validated, RLS-enforced), rebuilt landing. **Verified live locally:** signup→onboarding→dashboard persists; route protection works; custom-allergen merge works. Next 16 `middleware`→`proxy` migration done.
- **Phase 2 (AI generation):** `POST /api/generate-plan` (Next.js route, `nodejs` runtime, `maxDuration=60`): auth → load profile → fixed prompt w/ prefs as data → Groq Llama 3.3 70B (JSON mode, temp 0.3) → **Zod-validate w/ one repair retry** → persist plan/meals/ingredients as the user (RLS). UI: `MealCard`/`PlanGrid` (7-day, horizontal-scroll), `GenerateButton` (loading + inline error), `/plan/[id]` (RLS read-back), dashboard view/regenerate. **Verified locally:** 1 click → 21 meals, total ~68.50 within 120 budget, model avoided the user's declared allergens (Peanuts/Shellfish/Kiwi), no console errors, `npm run build` green.

## 🔨 In progress
- Merging `feat/generate-plan` → `main`, pushing (user approved), then live prod verify (pending `GROQ_API_KEY` in Vercel env).

## ⏭️ Next up
1. Add `GROQ_API_KEY` to Vercel env → redeploy → verify generation live in prod.
2. **Phase 3 — the trust layer (headline):** deterministic allergen guardrail in `lib/guardrails/allergen.ts` (scan `ingredients.allergen_tags` vs `profiles.allergens`, block+regenerate ≤3, log `safety_events`) + injection filter (`injection.ts`) + Mistral fallback + "✓ allergen-safe" badges on cards. Hook point already marked in `app/api/generate-plan/route.ts` (right before persistence, `safety_status` field ready).

## 🐞 Open bugs / issues
- none yet.

---

## 📝 Session Log
> Append a dated entry after every prompt/task. Format:
> `### [date/time] — <what was attempted>` → **Result** / **Errors** / **Outputs & logs** / **Fix applied** / **Next**.
> (Build-prompt specifics also go in [Prompt.md](Prompt.md).)

### 2026-07-22 — Session 1: scoping + playbook creation
- **Attempted:** Read source docs, choose the project, define the whole plan, create the playbook + CLAUDE.md + Documentary.md.
- **Result:** Locked Aegis (safety-first AI meal planner). Full stack, DB schema, design, phases, and rules recorded. 9 foundation files created.
- **Errors:** PDF page-render unavailable locally (pdftoppm missing) → worked around by extracting text with `pypdf`. No impact.
- **Outputs:** `playbook/*.md` (7 files), `CLAUDE.md`, `Documentary.md`.
- **Fix applied:** n/a.
- **Next:** Start Phase 0 on user's go.

### 2026-07-22 — Session 1b: repo description + Git workflow rules
- **Attempted:** Wrote the GitHub repo "About" description; added the 3 Git rules (commit-everything, branch-per-feature, ask-before-push) where they're enforced each prompt.
- **Result:** Rules added to [Rules.md §6](Rules.md#6-git-workflow-branch-per-feature--commit-everything--ask-before-push) and pinned in CLAUDE.md's per-prompt protocol; logged as locked decision D9.
- **Errors:** none.
- **Outputs:** repo description delivered to user (About one-liner + topics + submission blurb).
- **Next:** User provides the GitHub repo link → begin Phase 0.

### 2026-07-22 — Session 2: Phase 0 local skeleton
- **Attempted:** Start Phase 0 after receiving the repo link (`github.com/yarrbakr/Aegis`). Scaffold Next.js, build the FastAPI `/health` skeleton, set up git + commits.
- **Result:** Local skeleton complete & verified. Next.js **16.2.11** (`npm run build` ✓, "Compiled successfully in 9.4s"). FastAPI `/health` → **200** `{status: ok, service: aegis-api}` (TestClient smoke test). `.gitignore`, `.env.example` (root + backend). Repo initialized, remote set, commits on `feat/phase-0-skeleton`, merged into `main` via `--no-ff`.
- **Errors & fixes:** (1) `create-next-app` rejects folder names starting with `_` → scaffolded into `aegis-tmp`, moved files to root, deleted temp. (2) temp folder `rm` hit "Device or resource busy" (Windows handle) → removed via PowerShell. (3) pinned `openai==1.59.0` didn't exist on the index → switched to capped ranges, installed, then re-pinned exact resolved versions (openai 2.46.0, fastapi 0.139.2, uvicorn 0.51.0, pydantic 2.13.4, httpx 0.28.1, python-dotenv 1.2.2, pytest 8.4.2).
- **Outputs & logs:** commits `fa90c87` (foundation) → `f2905fd` (Next scaffold) → `af6fc52` (FastAPI) → `e7aa8b6` (env examples) → `2c74370` (merge). Nothing pushed.
- **Next:** Get push permission; guide the user through Vercel + Render + Supabase; wire env vars; confirm frontend → `/health`.

### 2026-07-22 — Session 2b: pushed + locked all-Vercel (D10)
- **Attempted:** Push to origin (with permission); then debated FastAPI/Render vs all-Vercel with the user.
- **Result:** Pushed `main` (6 commits) + `feat/phase-0-skeleton` to `github.com/yarrbakr/Aegis`. After a full pros/cons discussion, **locked all-Vercel (D10)**: generation + deterministic guardrail run in a Next.js server Route Handler; FastAPI/Render becomes a post-core "evidence endpoint" stretch. Deciding factors: one-platform clean ship, no free-tier cold-start, and RLS enforced automatically via the user's session (stronger security story). No user-facing feature lost; eval moves from pytest to a TS script that tests the real shipped guardrail.
- **Errors:** none.
- **Outputs:** playbook updated — Memory (D2/D5/D7 amended, D10 added), Architecture (flow, stack, deployment, structure), Phases (0/2/3/5, stretch), Documentary (pivot decision + value map).
- **Next:** Walk the user through the Vercel deploy (first live URL); create Supabase project; wire env vars.

### 2026-07-22 — Session 2c: Phase 0 COMPLETE — skeleton live on Vercel
- **Attempted:** Deploy the Next.js skeleton to Vercel; user creating the Supabase project in parallel.
- **Result:** ✅ **Live at https://aegis-zeta-six.vercel.app** — starter page loads, auto-deploy on push to `main` wired. **Phase 0 done** (its "done when" was just the live URL loading).
- **Errors & fixes:** Vercel's new import UI auto-detected `/backend/requirements.txt` as a second **FastAPI "Web Service"** and defaulted to its multi-service "Services" preset (demanded a `vercel.json`). Fix: changed **Application Preset → Next.js**, which dropped to a clean single-app deploy that ignores `/backend`. Verified the build log showed only `npm install`/`next build` (no `pip`/Python). Guidance for future sessions: keep `/backend` in the repo (documented architecture) but Vercel must stay on the **Next.js** preset, root `./`.
- **Supabase:** guided the create-project screen — unlink GitHub, save DB password, region Asia-Pacific, **Data API on**, **automatic RLS on** (leave auto-expose as-is; RLS is the gate). Awaiting URL + anon key.
- **Next:** Receive Supabase URL + anon key → wire `.env.local` + Vercel env → begin Phase 1 (schema + RLS + auth + onboarding).

### 2026-07-22 — Session 3: Phase 1 — schema applied + auth/onboarding built & verified
- **Attempted:** Apply schema/policies to Supabase; build the Supabase client wiring, email/password auth, onboarding, protected dashboard; verify the whole flow live in the browser.
- **Result:** ✅ DB applied (5 tables, RLS ON on all, 8 policies, 2 triggers). Auth built and `npm run build` green. **Live browser test passed:** signup created a user + profile (via trigger); route protection redirects `/dashboard`→`/login`; error round-trip works. After confirming the test user in the DB, full happy path verified: sign in → dashboard → onboarding (Peanuts+Shellfish, custom "kiwi", budget 120, people 2) → **saved & persisted**, dashboard shows the prefs. RLS-enforced writes work.
- **Errors & fixes:** (1) `SUPABASE_DB_URL` needed the **Session pooler** (IPv4), not Direct (IPv6-only on free tier). (2) test email `@aegis.app` rejected by Supabase → used a gmail. (3) sign-in blocked by **"Email not confirmed"** — project still has email confirmation ON; confirmed the test user via `auth.users.email_confirmed_at` to finish testing; **user must turn the toggle OFF** for real signups. (4) Next 16 `middleware`→`proxy` rename.
- **Outputs:** commits `7531a44` (schema, merged to main), `4f4659f` (feat/auth). Test account `aegisdemo2026@gmail.com` (deletable).
- **Next:** user (1) turns off email confirmation, (2) adds `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel → merge `feat/auth`→`main` → push (auto-deploy) → verify live → Phase 2.

### 2026-07-22 — Session 3b: Phase 1 shipped & verified LIVE
- **Attempted:** Push `main` (Phase 1) → Vercel auto-deploy → verify auth end-to-end on production.
- **Result:** ✅ Pushed (`392da1b`). Deploy went live. **Production test passed:** fresh signup (`aegislive2027@gmail.com`) logged in instantly (email confirmation now OFF) → onboarding → saved (Peanuts, Milk, custom "mango", budget 150, people 3) → dashboard shows the prefs; session persisted across a browser reopen. Vercel env vars + Supabase connection + RLS writes all working in prod. **Phase 1 COMPLETE & LIVE.**
- **Errors:** none.
- **Outputs:** live at https://aegis-zeta-six.vercel.app. Branches `feat/db-schema`, `feat/auth` pushed.
- **Next:** Phase 2 — need `GROQ_API_KEY`, then build `/api/generate-plan` + plan grid.

### 2026-07-22 — Session 4: Phase 2 — core AI generation built & verified
- **Attempted:** Build the whole Phase 2 pipeline in one go on `feat/generate-plan` (user added `GROQ_API_KEY` to `.env.local`), verify locally, update docs, push.
- **Result:** ✅ Built & verified. `POST /api/generate-plan` (nodejs, `maxDuration=60`): auth → profile → fixed prompt (prefs as **data**) → Groq Llama 3.3 70B (JSON mode, temp 0.3) → **Zod validate w/ one repair retry** → persist plan/meals/ingredients (RLS). UI: `MealCard`, `PlanGrid` (7-day horizontal-scroll), `GenerateButton` (loading + inline error), `/plan/[id]` (RLS read-back), dashboard view/regenerate. `npm run build` green (10.3s). **Live browser test:** one click → `POST /api/generate-plan → 200`, 21 meals rendered, total **~68.50 within 120 budget**, macros + allergen tags per card, model correctly avoided the user's declared allergens (Peanuts/Shellfish/Kiwi), **no console errors**. Screenshot captured.
- **Errors:** none. (Dev server auto-moved 3000→49674, port was in use.)
- **Outputs & logs:** commits `8f0748f` (schemas+types), `0d2a376` (Groq client + prompt), `8297eaf` (route), `fab25c9` (UI) on `feat/generate-plan`. New files: `lib/llm/groq.ts`, `lib/prompt.ts`, `app/api/generate-plan/route.ts`, `components/meal/{MealCard,PlanGrid,GenerateButton}.tsx`, `app/plan/[id]/page.tsx`.
- **Fix applied:** n/a.
- **Next:** merge → `main`, push (approved), add `GROQ_API_KEY` to Vercel env → verify live, then Phase 3 (guardrail).
