# Aegis — Memory (project state · READ THIS FIRST every session)

> **This is the single source of truth for where we stand.** Every session reads this before doing anything. After every prompt/task, append what happened to the **Session Log** at the bottom.

---

## 📍 Current status
- **Phase:** **Phases 3, 4, 5 COMPLETE** ✅ + **5 UX/safety fixes** from the user's live testing (see Session 6). Only **Phase 6 (docs/README + submission)** remains — after the user's design pass.
- **Currently working on:** **Design pass on `feat/dashboard-shell` — shell built (Session 7b) + feedback round 1 done (Session 8).** App shell (Sidebar-only over an `(app)` route group; topbar removed), pastel **Dashboard** (stat cards, sage Calories chart, Report donut, Meal-for-today, guardrail-screened **snack recs**, safety strip), **day-tabs Meal Plans** (`WeekView`), light **Security Console** (humanized event cards), Profile. Accent: **sage = active nav + primary buttons, coral = safety/blocked**. `npm run build` green; **verified live on the user's cybergen account**. NOT pushed yet. **Next: taste preferences** (`profiles` migration + form + prompt) → push on user's go → Phase 6.
- **Currently-edited file:** none.
- **Live URLs:** **https://aegis-zeta-six.vercel.app** — now deploying the FULL app (P3 guardrail + P4 dashboard/charts + USD + Session-6 fixes). Generation needs `GROQ_API_KEY` in Vercel (user says it's set). Confirm the Vercel build went green + spot-check live before relying on it.
- **Blockers:** none.
- **Git:** remote = `github.com/yarrbakr/Aegis`. `origin/main` = `7bc433a` (everything through Session 6). All feature branches pushed. Workflow: branch-per-feature, commit everything, ask before every push.
- **Eval number (for README):** `npm run eval` → **236 meals / 14 profiles → 100.0% catch rate, 100.0% specificity** (saved in `lib/eval/RESULTS.md`).

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
| D11 | **Design pivot → "Daily Meal"-style dashboard app shell.** Adopt a **pastel** scheme (lavender/mint/pink/peach cards, dark sidebar) **with a hint of Aegis sage/coral** as accent. Landing = **dashboard** (5 stat cards incl. **≥2 safety/budget**, calories line chart, nutrition report donut, "meal for today", **snack recommendations** — snacks pass the same `screenMeal` guardrail). Left-sidebar IA: **Dashboard · Meal Plans · Security Console · Profile**. Add **taste preferences** (cuisines / include / dislike) to Profile + onboarding, fed to the prompt as *data* (**best-effort — only declared allergens are safety-enforced by the guardrail; dislikes are not a safety guarantee**). | User-directed design pass (Session 7). Reorganizes existing pages into one shell; keeps **safety front-and-center** (dedicated Security Console + safety stat cards) per "trust & safety is the product". Extends D6 — that sage/coral/off-white palette becomes the *accent* on top of the pastel base. |

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
- **Phase 3 (trust layer):** deterministic guardrail in `lib/guardrails/` — `allergen.ts` `screenMeal()` is **defense-in-depth** (tags + ingredient names + meal text, synonym-expanded; allergen-aware so dairy-free butters / plant milks / GF flours don't false-trip). Route wired: input guardrail (`injection.ts` `screenPreferences`) → generate → output guardrail (block + single-meal regenerate ≤3/meal, ≤12/plan; safe placeholder fallback) → persist with `safety_status` → log `meal_passed`/`meal_blocked`/`injection_detected` to `safety_events`. `lib/llm/groq.ts` gained an optional **Mistral fallback** (`MISTRAL_API_KEY`). `MealCard` shows **"✓ allergen-safe"**. Test `lib/guardrails/guardrails.test.ts` (`npm run test:guardrail`) = **14/14**. Currency → **USD** (`lib/format.ts`). **Verified live:** POST → 200, 21 screened / 21 passed / 0 blocked, `safety_events` read back, no console errors.
- **Phase 4 (viz & taste):** `components/charts/SafetyDashboard.tsx` (dark console from `safety_events`) on plan (scoped) + dashboard (lifetime); `BudgetMeter`, `BudgetBar` (recharts, daily-budget line), `NutritionDonut` (recharts) via `lib/plan-stats.ts`; fonts Plus Jakarta Sans / Inter / JetBrains Mono (`app/layout.tsx` + `globals.css`). **Verified live:** console + charts render, USD everywhere, safe badges, no sideways scroll, zero console errors. Added dep: **recharts** (locked lib list).
- **Phase 5 (eval):** `lib/eval/run-eval.ts` (`npm run eval`) — labeled corpus of unsafe + safe meals across 14 profiles through the real shipped `screenMeal` (unsafe hidden 3 ways incl. untagged + name-only). **236 meals → 100.0% catch rate, 100.0% specificity.** Output in `lib/eval/RESULTS.md`. Exits non-zero on any miss.

## 🔨 In progress
- Merge `feat/phase-5-eval` → `main` (P3/P4 already merged). **Push remains ON HOLD** per user (design/interactive changes coming first).

## ⏭️ Next up
1. **Design pass (D11) — dashboard app shell.** (a) confirm final 5 stat-card set + pastel/accent hex with user; (b) build the shell + sidebar nav (Dashboard · Meal Plans · Security Console · Profile) on `feat/dashboard-shell`; (c) wire **taste preferences** into onboarding/Profile + the prompt (as data); (d) add **snack recommendations** (must pass `screenMeal`). Verify live, then push on user's go.
2. **Phase 6 — docs & submission:** `README.md` (decides-then-builds + stack/data-model + locked-decisions table + "what I'd do next" + live link + the eval number + "built with Claude Code"), finalize Documentary/Prompt/Memory, final deploy check from a fresh browser, email submission (Full Name · Aegis · Live URL · GitHub · 2–3 line description).
3. When user says go: push `main` → Vercel auto-deploys → verify P3/P4/P5 live in prod (user says `GROQ_API_KEY` is in Vercel now).
- **Stretch (only if ahead):** deploy `/backend` FastAPI to Render as a live evidence endpoint; single-meal regenerate button; RAG.

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

### 2026-07-22 — Session 5: Phase 3 (trust layer) + Phase 4 (viz) + USD — built & verified live
- **Attempted:** in one pass — switch currency to USD; build the whole deterministic guardrail (Phase 3) and the visualization/taste layer (Phase 4); test; ensure it matches the brief ("weekly meal plans based on preferences, budget and dietary requirements"). User said `GROQ_API_KEY` is added.
- **Result:** ✅ Both phases done & verified.
  - **USD:** `lib/format.ts` (`usd`/`usdApprox`) applied to cards, plan page, dashboard, onboarding ($ prefix + "USD" label); prompt tells the model costs are USD.
  - **Phase 3:** `lib/guardrails/allergen.ts` (`screenMeal` — defense-in-depth: tags + names + meal text, synonym-expanded, allergen-aware false-positive handling) + `injection.ts` (`screenPreferences`). Route rewired: input guardrail → generate → output guardrail (single-meal regenerate ≤3/meal, ≤12/plan; safe placeholder) → persist w/ `safety_status` → log all decisions to `safety_events`. `groq.ts` → optional Mistral fallback. `MealCard` → "✓ allergen-safe" badge. Single-meal schema + regen prompt added.
  - **Phase 4:** `SafetyDashboard` (dark console), `BudgetMeter`, `BudgetBar`, `NutritionDonut` (recharts) + `lib/plan-stats.ts`; surfaced on `/plan/[id]` (scoped) and `/dashboard` (lifetime); design-system fonts (Jakarta/Inter/JetBrains Mono).
- **Errors & fixes:** (1) recharts 3 `Tooltip` formatter type is stricter (`value` may be `undefined`) → dropped explicit param annotations, coerce with `Number()`. (2) `.ts`-extension imports in `guardrails.test.ts` (needed by Node type-stripping) would break Next's typecheck → excluded `**/*.test.ts` in tsconfig. (3) Browser-pane clicks wouldn't land on the generate button (coordinate-space mismatch) → verified the endpoint directly via `fetch('/api/generate-plan')` from the page session (Rules.md endorses endpoint testing).
- **Outputs & logs:** `npm run build` green; `npm run test:guardrail` = **14/14 (100%)**. Live: `POST /api/generate-plan → 200` (13.7s), **21 screened / 21 passed / 0 blocked**, plan `14ee5fd2…`, declared Peanuts/Shellfish/Kiwi absent, `safety_events` render in the Safety Dashboard, charts draw, USD everywhere, no console errors, no sideways scroll. Commits on `feat/phase-3-trust` (b2c97cf, 03d4a8a, 5e74ea9, d03c325, 3ad910f) merged to main (37830c2); `feat/phase-4-viz` (7c166b9, 5e1bd3e) not yet merged. Added dep: recharts@3.10.0. Note: 3 npm-audit advisories are in next/postcss/sharp (pre-existing framework deps), not recharts — left as-is near deadline.
- **Fix applied:** see errors above.
- **Next:** merge Phase 4 → main; **ask for push permission**; then Phase 5 eval + Phase 6 docs/submission.

### 2026-07-22 — Session 5b: Phase 5 eval harness (push held)
- **Attempted:** user said "do Phase 5 now, HOLD the push — I have major design/color + interactive changes before pushing." Build the eval harness that prints the guardrail catch rate.
- **Result:** ✅ `lib/eval/run-eval.ts` (`npm run eval`) — labeled corpus across 14 allergy profiles, each unsafe food planted 3 ways (correct tag / **untagged ingredient** / **meal-name-only**), plus safe-by-construction meals; all run through the REAL shipped `screenMeal` (unsafe foods are an independent list, so it's not circular). Reports catch rate + specificity, exits non-zero on any miss. **236 meals (180 unsafe / 56 safe) → 100.0% catch rate, 100.0% specificity.** Saved `lib/eval/RESULTS.md` for the README. `npm run build` green, `npm run test:guardrail` still 14/14.
- **Errors & fixes:** harmless Node `MODULE_TYPELESS_PACKAGE_JSON` warning on the eval script — left as-is (adding `"type":"module"` risks breaking Next's CJS config resolution). Excluded `lib/eval/**` from tsconfig (Node-only `.ts`-extension imports).
- **Outputs & logs:** commit `121c181` on `feat/phase-5-eval`. Not merged yet.
- **Fix applied:** n/a.
- **Next:** merge `feat/phase-5-eval` → main (local only — **still holding the push** per user). Then user's design/interactive changes → Phase 6 docs → push when they say go.

### 2026-07-22 — Session 6: 5 UX/safety fixes from live testing (push still held)
- **Attempted:** user reported 5 issues from testing and said "fix these, then we'll do design." (1) sign-in & create-account looked identical; (2) name/budget wrongly optional; (3) Safety Dashboard read as contradictory (21 passed + 10 blocked ≈ 31); (4) regeneration logs ("attempt 1/3") looked like the model was stuck; (5) a blocked meal's log didn't match its safe replacement card.
- **Result:** ✅ all fixed on `fix/ux-and-safety-log`, verified live.
  1. Login is a two-mode form (tab toggle): Sign in = email+password; Create account = required Name + email + password + own button. Signup writes display_name via auth metadata → trigger.
  2. `onboardingSchema` requires display_name + weekly_budget; form drops "(optional)", adds `required`.
  3. Metrics now come from the authoritative **meals table** (safety_status), tiles reworked to non-additive: MEALS SERVED (all safe) / CAUGHT + REGENERATED / INJECTIONS / ALLERGENS + plain-language subtitle. Verified live: "21 served · all safe / 1 caught + regenerated / 0 injections".
  4. Guardrail logs exactly **one event per meal** (no per-attempt spam); blocked meals read "original X blocked (reason) → replaced with safe Y / safe fallback plate". Recent-events list surfaces catches first.
  5. Same reworded log makes the safe replacement card consistent with the log — no mismatch.
  - **Bonus (root cause of #5's placeholder):** found + fixed a real guardrail false positive — "salt-free seasoning" (and "gluten-free bread" / "dairy-free cheese") were being blocked. `screenMeal` now honors "<allergen>-free / free of / no / without" in name scans (tags still trusted; real allergens elsewhere still caught).
- **Errors & fixes:** browser-pane clicks unreliable again → used `form_input` + endpoint `fetch` + JS state reads for verification. A compound here-string mis-parsed and merged two commits → `git reset --soft` and recommitted via `-F` message files (4 clean commits: 7e2c7bc auth, c9be1b4 required, bd69669 metrics, 45746a6 free-of).
- **Outputs & logs:** `npm run build` green; `npm run test:guardrail` **18/18**; `npm run eval` still **100% / 100%**. Live: new plan `62739979…` shows coherent metrics + one-line block log + consistent safe plate.
- **Next:** merge `fix/ux-and-safety-log` → main (local). Hold push. User does design/interactive pass → Phase 6 → push on their go.

### 2026-07-22 — Session 7: design direction locked (dashboard shell + IA)
- **Attempted:** user shared a "Daily Meal" dashboard reference (crossed out heart/water/exercise trackers, Message, an extra nav item) and asked (a) is it fully buildable on our stack, and (b) laid out the app vision.
- **Result:** confirmed **100% buildable on the current stack** — Next.js + Tailwind + shadcn/ui + recharts, **no new libraries**. Locked the design direction as **D11**: pastel palette + Aegis sage/coral *accent*; landing = dashboard; sidebar IA = **Dashboard · Meal Plans · Security Console · Profile**; **snack recommendations** (guardrail-screened) replace the meal-recs panel; **taste preferences** added to Profile + onboarding.
- **Safety guardrails kept central:** ≥2 of the 5 stat cards are safety/budget; **Security Console** is its own destination; recommended snacks MUST pass the same `screenMeal` guardrail; taste "dislikes" are best-effort prompt hints, **not** a safety guarantee (only declared allergens are enforced).
- **Logging question answered (user asked):** _build process_ is logged in **Memory.md** (this session log), **Prompt.md** (build prompts → output → problems → fix), **Documentary.md** (phase-boundary narrative), and the **git commit history**; _app runtime_ is logged in the **`safety_events`** table (every guardrail decision: meal_passed / meal_blocked / injection_detected) plus plans/meals/ingredients persisted under **RLS**.
- **Next:** confirm final stat-card set + palette hex, then build the shell + views on `feat/dashboard-shell`; wire taste prefs + snack recs; verify live; push on user's go; then Phase 6.

### 2026-07-22 — Session 7b: dashboard shell + pastel redesign BUILT
- **Attempted:** build the D11 dashboard app shell. User answered the two open questions: (1) drop the "meals safe" stat card in favor of prominence for Meal-for-today + the charts; (2) "keep your default" accent (sage = active nav + primary buttons, coral = safety/blocked).
- **Result:** built on `feat/dashboard-shell`, `npm run build` **green** (all routes compile, TS passes). Three commits: app shell (Sidebar + Topbar + `(app)` route-group layout, auth gated once); pastel Dashboard (`DashboardView` split from data-loading; stat cards calories/carbs/protein/budget; sage `CaloriesLine` chart w/ Weekly toggle, Monthly/Yearly honestly gated; macro Report donut; Meal-for-today; **snack recs**; safety strip → Security Console); and the Meal Plans / Security Console / Profile pages reusing existing verified components.
- **Snacks = safety on a 2nd surface:** `lib/snacks.ts` is a curated list filtered through the SAME `screenMeal` guardrail — the preview (allergens peanuts+milk) correctly dropped PB rice cakes / Greek yogurt / cheese & crackers, showing only safe snacks. No extra model calls.
- **Verification:** couldn't log into local dev (expired session; not creating accounts / entering passwords). Split `DashboardView` presentation from the page, rendered it with sample data on a throwaway `/design-preview` route (no auth/DB), screenshotted the full page (shell + cards + charts + meal-for-today + snacks), then **deleted** the temp route. Changed `GenerateButton`: redirect → `/meal-plans`, primary → sage.
- **Errors & fixes:** (1) stale dev-server logs referenced old `blocked`/`safetyStats` code — not real (disk was already the fixed Session-6 versions); build confirmed clean. (2) After deleting `/design-preview`, `next build` failed on a stale generated type (`.next/dev/types/validator.ts` referencing the removed route) → `rm -rf .next && npm run build` → green.
- **Next:** **taste preferences** — add `favorite_cuisines` / `disliked_foods` columns to `profiles` (Supabase migration + RLS-safe), surface in onboarding + Profile as a real editor, feed into `buildPlanMessages` as DATA (best-effort; allergens stay the only enforced constraint). Then verify, push on user's go, Phase 6.

### 2026-07-22 — Session 8: design feedback round 1 (5 items)
- **Attempted:** user tested the new dashboard (logged in as a `cybergen` account) and gave 5 items: (1) search bar doesn't work; (2) panel headings hard to catch — match the reference; (3) Meal Plans week is clustered — wants a less-cramped layout (idea: vertical days, click to reveal); (4) Security Console too black/scary; (5) Recent-events look like raw model logs.
- **Result (this session — the clear 3 done, `npm run build` green):**
  - #2 **headings:** "Calories Graph"/"Report"/"Meal for today"/"Snack recommendations" → bold + underline rule (reference look). Also fixed the calorie chart's clipped Y-axis (width 40→48, left margin 0).
  - #4 **Security Console:** rewrote `SafetyDashboard` from the dark terminal into a light on-brand card (sage/amber/violet tinted tiles). Applies to /security AND /plan/[id] (same props).
  - #5 **safety log:** replaced mono log lines with friendly activity cards derived from `event_type` + `allergen` — catches framed positively ("Unsafe meal caught & replaced…"), no internal "attempt/placeholder" noise. Confirmed via throwaway `/design-preview` (mock events), screenshotted, then deleted the temp route + `.next`.
  - #1 **search:** was a deliberate disabled placeholder. User chose **Remove it** → removed the search field; that left the topbar only duplicating the sidebar user block, so the **whole Topbar was removed** (deleted `components/shell/Topbar.tsx`). Cleaner; content starts at each page's header.
  - #3 **Meal Plans layout:** user chose **day tabs** → new `components/meal/WeekView.tsx` (client): a row of day chips (opens on today, "today" badge) + the selected day's breakfast/lunch/dinner as 3 roomy cards. Replaces the old `PlanGrid` on /meal-plans AND /plan/[id]; PlanGrid deleted.
- **Verified LIVE (browser was logged in as the user's `cybergen` account):** real dashboard, real Meal Plans day-tabs (tab switching swaps the day correctly — Wed→Fri confirmed), and the real light Security Console with humanized event cards. `npm run build` green throughout. Temp `/design-preview` used then deleted again.
- **Next:** **taste preferences** (profiles migration + form + prompt) — the last vision piece; then push on user's go; Phase 6. All Session-8 feedback (5/5) is done.

### 2026-07-22 — Session 9: legibility pass + animated landing hero
- **Attempted:** user asked to (a) make faint secondary labels (stat-card sublabels) obvious across the app, and (b) animate the landing hero (provided a `SoftBlurIn` motion component) with "Eat Healthy, Stay Healthy" + "yours truly, Aegis". Plus 4 questions (answered in chat).
- **Result (`npm run build` green, verified live on cybergen):**
  - **Legibility:** stat-card label → `#3D4653` semibold, sub → `#6B7280` medium (was #6B7280 / #9CA3AF); same darkening on Security Console tiles. Clearly more legible on the pastel cards.
  - **Landing animation:** added dep **`motion`** (new locked lib alongside recharts); `components/ui/soft-blur-in.tsx` (per-char blur-in reveal, respects reduced-motion). Rewrote `app/page.tsx` hero: animated "Eat Healthy," / "Stay Healthy" + "yours truly, Aegis" signature; kept the safety hook as subhead; CTA → sage. No console errors.
  - **Eval (answer to user Q2):** ran `npm run eval` → **236 meals / 14 profiles → 100.0% catch, 100.0% specificity** (lib/eval/run-eval.ts; results in lib/eval/RESULTS.md).
- **Answers given:** Q1 snacks = curated `lib/snacks.ts` list filtered by the deterministic guardrail (NOT Groq-generated; the weekly PLAN is Groq-generated + screened). Q3 taste prefs est. ~30–45 min, low risk (additive profiles columns, nullable, defaults; only touches onboarding/profile/prompt).
- **New dependency:** `motion` (^12) — landing hero animation only. Add to Architecture/Rules locked-lib list.
- **Next:** taste preferences on user's go; then push; Phase 6.
