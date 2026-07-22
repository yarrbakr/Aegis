# Aegis — Memory (project state · READ THIS FIRST every session)

> **This is the single source of truth for where we stand.** Every session reads this before doing anything. After every prompt/task, append what happened to the **Session Log** at the bottom.

---

## 📍 Current status
- **Phase:** Phase 0 *in progress* — local skeleton complete & verified; cloud deploy pending the user's accounts.
- **Currently working on:** **Locked all-Vercel (D10).** Next: deploy the Next.js skeleton to Vercel (first live URL) + create the Supabase project.
- **Currently-edited file:** none (between steps).
- **Live URLs:** none yet (Vercel pending).
- **Blockers:** user actions — creating the Supabase project (in progress) + importing the repo into Vercel (walking through now).
- **Git:** remote = `github.com/yarrbakr/Aegis`. **Pushed ✓** — `main` (6 commits, incl. `--no-ff` merge) and `feat/phase-0-skeleton` are live on origin. Workflow: branch-per-feature, commit everything, ask before every push (done for this push).

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

## 🔨 In progress
- **Phase 0 (cloud deploy):** ✓ push. → **deploy Next.js to Vercel (first live URL)** → create Supabase project → wire env vars. (No Render — all-Vercel per D10.)

## ⏭️ Next up
1. **Finish Phase 0 deploy:** deploy to Vercel (live URL) → Supabase project + keys → wire env vars (Phase 1 needs them).
2. Then **Phase 1** (auth + preferences: run schema/policies, Supabase Auth, onboarding form).

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
