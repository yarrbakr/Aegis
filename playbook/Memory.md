# Aegis — Memory (project state · READ THIS FIRST every session)

> **This is the single source of truth for where we stand.** Every session reads this before doing anything. After every prompt/task, append what happened to the **Session Log** at the bottom.

---

## 📍 Current status
- **Phase:** Phase 0 not started — playbook/foundation just created.
- **Currently working on:** Foundation docs complete. Next action = begin Phase 0 (setup & skeleton deploy) *when the user says go*.
- **Currently-edited file:** none (planning stage).
- **Live URLs:** none yet (Vercel / Render pending Phase 0).
- **Blockers:** waiting on the user's GitHub repo link before Phase 0 remote setup.
- **Git:** repo not yet created/linked. Workflow locked (D9): branch-per-feature, commit everything, **ask before every push**. No commits made yet.

---

## 🔒 Locked decisions
| # | Decision | Rationale |
|---|---|---|
| D1 | **Project = Aegis**, a safety-first AI meal planner | Distinctive; the safety layer answers CyberGen's core question. Name echoes their "Argus". |
| D2 | **Stack:** Next.js + Tailwind + shadcn (Vercel), FastAPI (Render), Supabase Postgres | Mandated (Supabase/Vercel/Git) + FastAPI to match CyberGen's job stack. |
| D3 | **DB = Supabase Postgres, relational** | Data is relational (user→plans→meals→ingredients). "Default to Postgres" (class notes). |
| D4 | **LLM = Groq (Llama 3.3 70B) primary, Mistral fallback** | Free, fast, OpenAI-compatible. Fallback = reliability story. |
| D5 | **Guardrail is deterministic, not LLM-judged** | A security company never lets the model grade its own safety. |
| D6 | **Design:** Fresh & clean; 60/30/10 → off-white `#F8F9FA` / sage `#4C7B61` / coral `#FF6B6B` | User-chosen palette. Safety Dashboard = dark console. |
| D7 | **Deploy skeleton first, keep a Next.js-route fallback for FastAPI** | Protect "shipped". A working link beats a perfect stack. |
| D8 | **No real payments/bank integrations; not a medical device** | Out of scope + safety. |
| D9 | **Git workflow: commit every change (explained), branch-per-feature (`feat/*`), ask before every push** | Visible AI-first process + `main` stays deployable. Pinned in [Rules.md §6](Rules.md#6-git-workflow-branch-per-feature--commit-everything--ask-before-push) + CLAUDE.md. |

---

## ✅ Completed
- Read all 3 source documents (assignment image, company brief, class notes).
- Scored 5 project options → chose Meal Planner (70/80).
- Locked name, stack, DB schema, design direction.
- Created playbook: PRD, Architecture, Rules, Phases, Design, Memory, Prompt.
- Created CLAUDE.md + Documentary.md.

## 🔨 In progress
- Nothing yet — awaiting go to start Phase 0.

## ⏭️ Next up
1. **Phase 0** — init Next.js, GitHub repo, Supabase project, FastAPI `/health`, deploy skeleton to Vercel + Render, wire env vars.
2. Then Phase 1 (auth + preferences).

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
