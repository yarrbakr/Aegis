# Aegis — Architecture

> Design-before-generate. The backend is where design gets expensive, so it's decided here *before* a line of code. (Armghan's rule.)

---

## 1. Tech stack (and *why* — this reasoning goes in the README)

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js (App Router) + TypeScript | Vercel's native framework; the "boring on purpose" pick. Armghan's own class example was Next.js. |
| **Styling** | Tailwind CSS + shadcn/ui | shadcn is what he named for portal/UI design. Fast, tasteful, accessible. |
| **Charts** | Recharts | React-native charting for the budget bar, nutrition donut, safety dashboard. |
| **Database** | Supabase (Postgres) | Data is **relational** (user → plans → meals → ingredients). His rule: relations → Postgres; default to Postgres. |
| **Auth** | Supabase Auth + Row-Level Security | Real per-user access control, not decoration. |
| **AI backend** | FastAPI (Python) | **Literally CyberGen's job-title stack.** Hosts generation + guardrail. |
| **LLM** | Groq (Llama 3.3 70B) primary · Mistral fallback | Free, fast (speed = "it just works" taste), OpenAI-compatible. Fallback = a small reliability story. |
| **Deploy** | Vercel (frontend) + Render (FastAPI) | Vercel is mandated. Render free tier is the textbook FastAPI deploy. |
| **Version control** | Git + GitHub | Mandated. Small, meaningful commits = visible AI-first process. |
| **API testing** | Postman / Thunder Client | Named in class notes. |
| **Validation** | Zod (frontend) · Pydantic (backend) | Never trust unvalidated data — especially LLM output. |

### The backend vs. database, in one line each
- **Supabase (database)** = the *pantry* — it only stores data.
- **FastAPI (backend)** = the *kitchen* — it does the work: calls the AI, runs the guardrail, then serves the result.
- **Next.js (frontend)** = the *dining room* — what the user sees and clicks.

---

## 2. App flow

```mermaid
flowchart TD
    U[User] -->|sets diet, allergies, budget| FE[Next.js frontend on Vercel]
    FE -->|save prefs| SB[(Supabase / Postgres)]
    FE -->|Generate plan request| API[FastAPI backend on Render]
    API -->|1. input guardrail: injection filter| API
    API -->|2. prompt + call| LLM[Groq LLM  ·  Mistral fallback]
    LLM -->|structured meal JSON| API
    API -->|3. OUTPUT GUARDRAIL: allergen check| GR{Safe?}
    GR -->|unsafe| RG[Block + regenerate, log event]
    RG --> API
    GR -->|safe| SAVE[Save plan/meals/ingredients + log safety_event]
    SAVE --> SB
    SAVE -->|safe plan| FE
    FE -->|render plan + charts + safety dashboard| U
```

**The critical rule visible in this diagram:** the LLM output never reaches the user without passing the deterministic allergen guardrail. That gate *is* the product.

---

## 3. Data model (Supabase / Postgres)

```
profiles          (1 per user)
  id            uuid  PK → auth.users.id
  display_name  text
  diet_type     text          -- omnivore | vegetarian | vegan | keto | ...
  allergens     text[]         -- ['peanut','shellfish',...] (the user's declared list)
  weekly_budget numeric
  num_people    int
  created_at    timestamptz

meal_plans        (user 1 → many)
  id            uuid  PK
  user_id       uuid  FK → profiles.id
  week_start    date
  total_cost    numeric
  status        text          -- generating | ready | failed
  created_at    timestamptz

meals             (plan 1 → many)
  id            uuid  PK
  plan_id       uuid  FK → meal_plans.id
  day_of_week   int           -- 0..6
  meal_type     text          -- breakfast | lunch | dinner
  name          text
  description   text
  cost          numeric
  calories      int
  protein_g / carbs_g / fat_g  int
  safety_status text          -- passed | blocked_regenerated
  created_at    timestamptz

ingredients       (meal 1 → many)   -- what the guardrail scans
  id            uuid  PK
  meal_id       uuid  FK → meals.id
  name          text
  quantity      text
  allergen_tags text[]         -- ['peanut','dairy',...]

safety_events     (user 1 → many)   -- the audit log → powers the Safety Dashboard + eval
  id            uuid  PK
  user_id       uuid  FK → profiles.id
  plan_id       uuid  FK → meal_plans.id (nullable)
  event_type    text          -- meal_passed | meal_blocked | injection_detected
  allergen      text          -- which allergen triggered it (nullable)
  detail        text
  created_at    timestamptz
```

**Relations (the Postgres justification):** `profiles 1→∞ meal_plans 1→∞ meals 1→∞ ingredients`, plus `profiles 1→∞ safety_events`.

**Row-Level Security:** every table gets a policy `auth.uid() = user_id` (via the plan/meal chain) so a user can only touch their own rows. DDL lives in `/supabase/schema.sql`, policies in `/supabase/policies.sql`.

---

## 4. Folder & file structure

Next.js at the repo root (Vercel zero-config); FastAPI in `/backend` (Render); the Python folder is **not** named `/api` so Vercel doesn't mistake it for serverless functions.

```
Cybergen-internship-task/            ← repo root
├─ CLAUDE.md                         ← master instructions (auto-loaded every session)
├─ Documentary.md                   ← the build journey, CyberGen-framed
├─ README.md                        ← decides-then-builds (created in Phase 6)
├─ playbook/
│  ├─ PRD.md  Architecture.md  Rules.md  Phases.md  Design.md  Memory.md  Prompt.md
│
├─ app/                             ← Next.js App Router (Vercel)
│  ├─ (auth)/login, signup
│  ├─ dashboard/                    ← main app: prefs, plan view, safety dashboard
│  ├─ api/                          ← Next.js route (FALLBACK AI path if FastAPI is cut)
│  ├─ layout.tsx  page.tsx          ← landing
├─ components/
│  ├─ ui/                           ← shadcn components
│  ├─ charts/                       ← BudgetBar, NutritionDonut, SafetyDashboard
│  └─ meal/                         ← MealCard, PlanGrid, SafetyBadge
├─ lib/
│  ├─ supabase/                     ← client + server helpers
│  ├─ types.ts                      ← shared TS types (mirror Pydantic + Zod)
│  └─ validation.ts                 ← Zod schemas
│
├─ backend/                         ← FastAPI (Render)
│  ├─ main.py                       ← app + endpoints
│  ├─ guardrails/
│  │  ├─ allergen.py                ← OUTPUT guardrail (deterministic)
│  │  └─ injection.py               ← INPUT guardrail
│  ├─ llm/
│  │  ├─ groq_client.py             ← primary
│  │  └─ mistral_client.py          ← fallback
│  ├─ eval/
│  │  ├─ run_eval.py                ← the eval harness → prints catch rate
│  │  └─ profiles.json              ← test allergy profiles
│  └─ requirements.txt
│
└─ supabase/
   ├─ schema.sql
   └─ policies.sql
```

### API endpoints (FastAPI)
| Method | Path | Does |
|---|---|---|
| `POST` | `/generate-plan` | input guardrail → LLM → output guardrail → returns safe plan + logs events |
| `POST` | `/check` | (utility) run the guardrail on an arbitrary meal — used by the eval harness |
| `GET` | `/health` | liveness (deployed first, in Phase 0) |

---

## 5. Deployment & the fallback (protecting "shipped")

- **Primary:** Next.js → Vercel, FastAPI → Render, Supabase hosted. Env vars hold all keys.
- **De-risk rule:** in Phase 0 we deploy an empty skeleton to *both* live URLs and confirm they work **before building features.** Prove the pipeline, then build inward.
- **Fallback:** if the two-service setup fights us by ~hour 4, the generation + guardrail collapse into a Next.js API route (`app/api/generate-plan`) and we drop FastAPI. The guardrail logic is written portable so this swap is cheap. **A working link beats a perfect stack.**

---
*Locked decisions live in [Memory.md](Memory.md). How-we-work rules live in [Rules.md](Rules.md).*
