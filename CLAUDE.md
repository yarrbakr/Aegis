# CLAUDE.md — Aegis

> **Aegis** — an AI meal planner with a safety shield: a deterministic guardrail screens every AI-generated meal against the user's allergies before it's shown. Built for the CyberGen / Himmatkaar internship task. This file is auto-loaded every session — it tells you how to work on this repo.

---

## 🚦 Start-of-session protocol (do this EVERY session, before anything else)
1. **Read [`playbook/Memory.md`](playbook/Memory.md) first.** It is the source of truth for the current phase, what's done, what's in progress, locked decisions, and open bugs. Never start work without it.
2. **Read the playbook files relevant to the task:**
   - Building a feature? → [`playbook/PRD.md`](playbook/PRD.md) + [`playbook/Phases.md`](playbook/Phases.md)
   - Touching architecture / DB / endpoints? → [`playbook/Architecture.md`](playbook/Architecture.md)
   - Any code at all? → [`playbook/Rules.md`](playbook/Rules.md)
   - Any UI? → [`playbook/Design.md`](playbook/Design.md)
3. **Confirm the current phase** from Memory.md and **stay in it.** Do not build ahead.

## 📝 End-of-prompt protocol (MANDATORY — the user's explicit rule)
After **every** prompt/task, append to [`playbook/Memory.md`](playbook/Memory.md)'s Session Log:
- **what was attempted · result · errors · outputs & logs · fix applied · next step.**

For build prompts, also add an entry to [`playbook/Prompt.md`](playbook/Prompt.md) (prompt → output → problems → fix).
Update Memory.md's **Current status**, **Completed**, **In progress**, and **Next up** sections as they change. This tracking is not optional — it's how any future session knows where we stand, and it's part of what the evaluator grades.

## 🌿 Git workflow (CHECK ON EVERY PROMPT — full detail in [Rules.md §6](playbook/Rules.md#6-git-workflow-branch-per-feature--commit-everything--ask-before-push))
1. **Commit every change** — every add / update / delete gets its own small commit with a message explaining *what & why* (`feat:` / `fix:` / `docs:` / `chore:`). This is the visible AI-first process CyberGen grades.
2. **Branch per feature** — build each feature on `feat/<thing>` off `main`; merge back only when it works; keep `main` deployable.
3. **NEVER push without explicit permission** — local commits & branches are fine; `git push`, PRs, or any remote change require the user's "yes" **for that specific push**. State what will be pushed and where, then ask.

---

## 🔒 Locked decisions (full list + rationale in [Memory.md](playbook/Memory.md#-locked-decisions))
- **Aegis** = safety-first AI meal planner.
- **Stack (D10):** Next.js + Tailwind + shadcn/ui + **server Route Handler** (Vercel) · Supabase Postgres + Auth + RLS. **All-Vercel** — the AI + deterministic guardrail run in a Next.js route. FastAPI (`/backend`) = documented architecture + **post-core Render stretch**.
- **LLM:** Groq (Llama 3.3 70B) primary, Mistral fallback.
- **The guardrail is deterministic code (TypeScript, in the route), never an LLM self-check.**
- **Design:** fresh & clean, 60/30/10 — off-white `#F8F9FA` / sage `#4C7B61` / coral `#FF6B6B`.
- **Ship > ambition:** deploy the Next.js skeleton first; FastAPI/Render only after the core ships.

## 🧭 Working principles (from Armghan's session + CyberGen's rubric)
- **Design before generate.** Decide, then build. The playbook already did this — follow it.
- **Trust & safety is the product, not a feature.** Every AI output passes the guardrail before display.
- **Shipped beats ambitious.** Smallest complete version first; no scope creep; stretch items wait.
- **Evidence over hype.** If we claim it's safe, the eval harness shows the number.
- **Taste.** Match [Design.md](playbook/Design.md). Empty/loading/error states count.
- **Evidence-based debugging.** Read the browser console + capture the real error before fixing.
- **Small, meaningful commits.** The commit history is a graded artifact.

## 🚫 Hard boundaries
- No real payment/bank integrations. No entering real secrets/credentials. Keys live in env vars only.
- Aegis is **not a medical device** — it filters declared allergens; it does not give medical/nutritional advice, and the UI says so.
- The LLM suggests; it never approves safety. User input is data, never instructions (injection defense).

## 🗂️ Where things live
- `README.md` — the decides-then-builds submission README (stack, data model, locked decisions, eval number, live link).
- `playbook/` — PRD, Architecture, Rules, Phases, Design, Memory, Prompt.
- `Documentary.md` — the build journey, CyberGen-framed. **Update it at each phase boundary.**
- `app/`, `components/`, `lib/` — Next.js app (incl. `app/api/` AI route, `lib/guardrails/` deterministic safety, `lib/taste.ts` best-effort dislikes, `lib/llm/` Groq+Mistral). `backend/` — FastAPI (post-core stretch). `supabase/` — schema + RLS + `migrations/`.

## ⚙️ Commands
- App dev (frontend + AI route): `npm run dev`
- Build (matches Vercel): `npm run build`
- **Guardrail unit checks:** `npm run test:guardrail` (currently **27/27**).
- **Eval (catch rate):** `npm run eval` → **236 meals → 100.0% catch / 100.0% specificity** (results in `lib/eval/RESULTS.md`).
- FastAPI stretch (local): `uvicorn backend.main:app --reload` → `GET /health`

## 🤖 LLM (current)
- **Groq `llama-3.3-70b-versatile`** primary; **Mistral `mistral-small-latest`** fallback (activated via `MISTRAL_API_KEY`). Keys are server-side secrets — never `NEXT_PUBLIC_`, never committed. Groq's free tier has a ~100k tokens/day cap; the Mistral fallback covers it.
