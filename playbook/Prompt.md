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
*(Build prompts from Phase 0 onward get appended below as we go.)*
