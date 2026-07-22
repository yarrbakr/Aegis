# The Making of Aegis — a build documentary

> A running account of how Aegis was built, told through **CyberGen's own workflow and values.** Not a changelog — a record of *decisions and why*, so the process is as legible as the product. Updated at each phase boundary.

---

## 0. The brief, and the brief behind the brief

The visible assignment: build and deploy one web app using AI tools + **Supabase, Vercel, Git**. Five suggested ideas. Deadline, one evening.

The *real* assignment — read out of CyberGen's positioning and Dr. Armghan's teaching — is different:

> **CyberGen sells trust in AI. The winning submission isn't the most ambitious app. It's the smallest app that also answers: "how do you know the AI is correct, and what happens when it's wrong or attacked?"**

Twenty-five people will submit "a working app." Aegis is built to answer that second question out loud. That framing drove every decision below.

---

## 1. Design before generate (the decision phase)

Armghan's rule: *the backend is where design gets expensive — decide before you build.* So before any code, the whole thing was designed and written down in [`/playbook`](playbook/). The key decisions:

**Which project?** Five options were scored against a weighted rubric (trust angle ×3, shippability ×3, stack fit ×2, deployability ×2, taste ×2, distinctiveness ×2). The **Meal Planner won (70/80)** — not because meal planning is exciting, but because it's the *one* option where a wrong AI answer causes physical harm (an allergen), which makes a safety layer genuinely necessary instead of bolted-on. Budget Planner was the runner-up (62); its scope risk and invisible safety story lost it the tie.

**The reframe.** Aegis isn't "a meal planner with AI." It's *"a meal planner that cannot feed you what you're allergic to"* — and it proves that claim. That single sentence is the product.

**The name.** *Aegis* — Athena's shield — deliberately rhyming with CyberGen's flagship product **Argus**. A quiet signal: I know your house.

**The stack**, chosen to match how CyberGen actually ships:
- Next.js + Supabase + Vercel — the mandated stack, and Armghan's own class example.
- **FastAPI** — because "FastAPI + LLM deployment" is *word-for-word* the open role.
- **Postgres**, because the data is relational (user → plans → meals → ingredients) — his exact database rule.
- A **deterministic guardrail**, never an LLM grading its own safety — because that's what a security company would demand.

All of it is recorded in [Architecture.md](playbook/Architecture.md), [PRD.md](playbook/PRD.md), and [Memory.md](playbook/Memory.md) *before* generation — the design-before-generate discipline, made visible.

---

## 2. How Aegis answers each thing CyberGen values

| CyberGen value | How Aegis answers it |
|---|---|
| Trust & safety *is* the product | The deterministic allergen guardrail gates every AI output; unsafe meals never reach the user. |
| Shipped beats ambitious | Skeleton deployed first; scope frozen to one headline + a fallback that guarantees a live link. |
| Taste | Fresh & clean design spec (60/30/10), real empty/loading/error states, a console-styled Safety Dashboard. |
| Design before generate | The entire `/playbook` written before code. |
| AI-first workflow, visibly | `CLAUDE.md`, a decision log, a prompt log, and small commits — the process is in the repo. |
| Evidence & measurement | An eval harness that prints the guardrail's catch rate as a number. |
| FastAPI + RAG/agents | Generation + guardrail run server-side in a Next.js route for a clean, RLS-enforced ship; a FastAPI version is kept in `/backend` and deployed to Render as a post-core stretch. RAG kept as a scoped stretch. |
| Their product suite | Guardrails (allergen block), Cortex Shield (injection filter), Argus (Safety Dashboard + eval), Rego (RLS access control) — four products, demonstrated in a consumer app. |

---

## 3. The build loop

Following Armghan's loop — **Describe → Generate → Run → Observe → Refine** — across phases. This section grows as we build; each phase records what was intended, what actually happened, and what we learned.

### Phase 0 — Setup & skeleton deploy
**Intended:** stand up an *empty but live* pipeline before any feature — Next.js on Vercel, FastAPI on Render, Supabase ready — so the risky part (deployment) is proven first.

**What actually happened (local half, done):** scaffolded Next.js 16 + TypeScript + Tailwind at the repo root (`npm run build` passes cleanly) and a minimal FastAPI backend whose `/health` endpoint returns `200 {status: ok}` — smoke-tested locally before committing. Set up `.gitignore` and `.env.example` templates (no real secrets ever touch git), then committed in small, labelled steps on a `feat/phase-0-skeleton` branch and merged to `main` once it built — the branch-per-feature workflow, visible in the history.

**Learned / decided:** pin backend deps to versions actually resolved locally so Render reproduces the same build (a guessed pin, `openai==1.59.0`, didn't exist — caught it before it ever reached the cloud). Keep the Python service in `/backend`, deliberately not `/api`, so Vercel doesn't mistake it for serverless functions.

**A decision we revisited — and this is *why* we write decisions down.** The original plan put the AI + guardrail on a separate FastAPI service on Render. Talking it through, **all-Vercel won**: the generation + guardrail now run in a Next.js server route instead, which (1) ships on **one platform** with no flaky free-tier cold-start in front of the evaluator, and (2) runs under the user's Supabase session so **Row-Level Security is enforced automatically** — a stronger security story for a safety-branded app. No user-facing feature changes; the eval even gets better (it tests the *real* shipped guardrail, not a copy). The FastAPI code stays in `/backend` as documented architecture and a *post-core* Render stretch. *Shipped beats ambitious — the simpler, safer design won.* (Full rationale: [Memory.md](playbook/Memory.md) D10.)

**Cloud half — done:** ✓ pushed to GitHub, ✓ **deployed live to Vercel — https://aegis-zeta-six.vercel.app** (auto-deploys on every push to `main`). One snag worth noting: Vercel's importer spotted the `/backend` FastAPI and tried to deploy it as a *second* service — a neat confirmation that the folder reads as real FastAPI, but not what we wanted. Switching the Application Preset to **Next.js** gave a clean single-app deploy that leaves `/backend` as documentation. **Phase 0 is complete: the empty pipeline is live before a single feature exists** — exactly the de-risk order we set out to follow. Next: Supabase keys → Phase 1.

### Phase 1 — Auth & data foundation
_pending_

### Phase 2 — Core AI generation
_pending_

### Phase 3 — The trust layer
_pending_

### Phase 4 — Visualization & taste
_pending_

### Phase 5 — Evidence & eval
_pending_

### Phase 6 — Docs & submission
_pending_

---

## 4. What I'd do next (kept honest)
_To be written at the end — the "if I had another day" list. Naming the limits is itself a CyberGen signal: evidence over hype._

---
*Sources for the strategy: CyberGen product sites, the "AI-First Developer / Vibe Coder" role, Dr. Armghan's writing, and the Day-1 bootcamp notes. Full reasoning in [`/information/company-information.md`](information/company-information.md).*
