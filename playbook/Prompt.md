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
*(Build prompts continue below as we go.)*
