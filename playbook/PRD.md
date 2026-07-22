# Aegis — Product Requirements Document (PRD)

> **Aegis** — *AI meal planning with a safety shield. It can't feed you what you're allergic to.*
> Named after Athena's shield — a deliberate nod to CyberGen's flagship **Argus**.

---

## 1. What to build

A web app that generates a **personalized weekly meal plan** from a user's diet, budget, and household size — and wraps the AI in a **safety guardrail** that guarantees no meal ever contains an ingredient the user is allergic to. Every AI suggestion is screened by a deterministic check *before it is shown*, unsafe meals are blocked and regenerated, and every guardrail decision is logged and surfaced on a live **Safety Dashboard**.

The headline is not "an AI meal planner." Every student will build that. The headline is:

> **"How do you know the AI is correct, and what happens when it's wrong or attacked?"** — answered, visibly, on screen.

That question is CyberGen's entire business. Aegis answers it in a friendly consumer app.

### The one-line pitch (for the submission "Description" field)
> Aegis is an AI meal planner with a safety layer: a deterministic guardrail screens every AI-generated meal against the user's allergies before it's shown, blocks unsafe suggestions, and proves it works with a live safety dashboard and an eval harness. Built on Next.js + Supabase + FastAPI, deployed on Vercel.

---

## 2. Targeted users

**Primary:** People with **food allergies or strict dietary needs** (peanut/tree-nut, gluten/celiac, dairy, shellfish, egg, soy) who want meal ideas but can't trust a generic AI that might casually suggest something dangerous.

**Secondary:** Budget-conscious meal planners (students, families) who want a week of meals inside a weekly spend.

**Why this user matters strategically:** it's the one meal-planning audience where a *wrong AI answer causes real harm* — which is exactly what makes the safety layer non-optional instead of decorative.

### Primary user story
> "I'm allergic to peanuts and shellfish, I have ~$60/week, and I'm vegetarian. Give me a week of meals I can actually eat — and I need to *trust* that none of them will hurt me."

---

## 3. Features

### 3.1 Core (MVP — this is what ships first, nothing added until it's live)
- **Auth** — email/password sign up & log in (Supabase Auth).
- **Preferences / onboarding** — diet type, allergies (multi-select), weekly budget, number of people. Saved per user.
- **Generate weekly plan** — AI produces 7 days × meals (breakfast/lunch/dinner) with ingredients, cost, and calories, as structured data.
- **Plan view** — the week as clean meal cards / grid; each meal shows cost, calories, and a safety badge.
- **Save & history** — plans persist per user in Supabase; user can revisit past plans.

### 3.2 Trust layer (the headline — the CyberGen DNA)
- **Output guardrail (allergen safety)** — every generated meal's ingredients are checked against the user's allergies *before display*. Unsafe → blocked + regenerated (bounded retries) → if still unsafe, shown as a safe placeholder, never the unsafe meal. **This check is deterministic, not LLM-judged** — a security company does not let the model grade its own safety.
- **Input guardrail (prompt-injection filter)** — the free-text preference box is screened for injection attempts (e.g. "ignore previous instructions…") before anything reaches the LLM.
- **Access control** — Supabase Row-Level Security: a user can only ever read/write their own data.
- **Safety Dashboard** — a live panel: meals generated, meals passed, unsafe blocked, allergens screened, injection attempts caught. Reads from the `safety_events` audit log.

### 3.3 Visualization / taste
- **Weekly budget bar chart** + a "**$X of $Y budget**" meter.
- **Nutrition donut** — calories + protein/carbs/fat.
- **Safety Dashboard** styled like a mini security console (the standout visual).

### 3.4 Evidence
- **Eval harness** — a script that runs N generations across a set of allergy profiles and reports the guardrail's **catch rate as a single number** (target: 100% of unsafe meals blocked).

### 3.5 Stretch (ONLY if ahead of schedule — named to stay disciplined, not to build now)
- Auto-generated shopping list from the plan.
- Regenerate a single meal.
- **RAG** — retrieve from a curated recipe dataset instead of pure generation (adds the literal word "RAG" to the stack).

---

## 4. Success criteria (definition of done)
1. Live, public, clickable URL on Vercel — **works when they click it.**
2. A logged-in user can set preferences and generate a safe weekly plan end-to-end.
3. The guardrail visibly blocks an unsafe meal (demoable) and the Safety Dashboard reflects it.
4. The eval harness outputs a real catch-rate number.
5. Repo shows the AI-first process: `CLAUDE.md`, the playbook, a decision log, a prompt log, clean commit history, and a decides-then-builds README.

## 5. Non-goals (explicitly out of scope)
- ❌ Real payment or bank integrations.
- ❌ Medical/nutritional *advice* — Aegis filters known allergens; it is **not** a medical device and says so.
- ❌ Mobile native app. Responsive web only.
- ❌ Social features, sharing, multi-user households.

---
*See [Architecture.md](Architecture.md) for how this is built, [Phases.md](Phases.md) for the build order, and [Rules.md](Rules.md) for the guardrails on how we work.*
