# Aegis — Rules (how we work + boundaries for the AI)

> These rules exist so a fast build stays a *trustworthy* one. That's the whole CyberGen thesis.

---

## 1. What to DO

- **Read [Memory.md](Memory.md) first, every session.** It's the source of truth for where we stand.
- **Log after every prompt.** After each build prompt/task, append the result, errors, outputs, and logs to [Memory.md](Memory.md) and, if it was a build prompt, to [Prompt.md](Prompt.md). Non-negotiable.
- **Stay in the current phase.** Follow [Phases.md](Phases.md) in order. No feature from a later phase until the current one is done *and* deployed. (Overcommitment is the known failure mode — this rule is the guardrail against it.)
- **Design before generate.** Consult [Architecture.md](Architecture.md) and [Design.md](Design.md) before writing code for a new area.
- **Commit small and often**, with meaningful messages. The commit history is part of the submission — it's the visible AI-first process.
- **Validate everything**, especially LLM output — Zod on the frontend, Pydantic on the backend. Reject malformed data loudly.
- **Every AI output passes the guardrail before display.** No exceptions.
- **Secrets live in env vars.** Never commit keys. `.env` is gitignored; `.env.example` documents the shape.
- **Test endpoints with Postman/Thunder Client** before wiring the frontend.
- **Deploy the skeleton first** (Phase 0), then build inward.
- **When fixing a bug, gather evidence first** — screenshot the UI, read the browser console, capture the actual error — then fix. (Armghan: evidence, not guesses.)

## 2. What to AVOID

- ❌ **No real payment or bank integrations.** Manual entry + a "load sample data" path only.
- ❌ **Never enter real credentials/secrets** into the app or commit them.
- ❌ **No scope creep.** No second feature before the first ships. Stretch items in [PRD.md](PRD.md#35-stretch) wait.
- ❌ **The LLM never grades its own safety.** The allergen guardrail is **deterministic code**, not an "is this safe?" prompt. A security company would never trust the model to check itself.
- ❌ **No medical/nutritional advice.** Aegis filters *known declared allergens*. It is not a medical device and must say so in the UI. Don't imply clinical safety.
- ❌ **Don't trust LLM output blind** — always parse, validate, and guardrail it.
- ❌ **Don't over-engineer.** Pick the boring, finishable option every time.

## 3. Libraries (locked — don't add others without recording it in Memory.md)

**Frontend**
- `next`, `react`, `typescript`
- `tailwindcss`, `shadcn/ui`, `lucide-react` (icons)
- `recharts` (charts)
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod` (validation)

**Backend**
- `fastapi`, `uvicorn`, `pydantic`, `python-dotenv`
- `openai` (Groq is OpenAI-compatible) + `httpx`
- `pytest` (for the eval harness / checks)

**Fonts:** Plus Jakarta Sans (display), Inter (body), JetBrains Mono (dashboard/console). See [Design.md](Design.md).

## 4. Error handling (defined up front, not bolted on)

| Failure | Handling |
|---|---|
| LLM call fails / times out | Retry once → fall back to Mistral → if both fail, graceful UI error ("couldn't generate, try again"). Never a white screen. |
| LLM returns malformed JSON | Pydantic rejects it → one repair retry → then safe error. Never render unvalidated data. |
| Guardrail finds an allergen | **Block the meal, log a `meal_blocked` safety_event, regenerate** (max 3 tries). If still unsafe, show a safe placeholder — *never* the unsafe meal. |
| Injection detected in input | Strip/refuse the offending input, log `injection_detected`, proceed with sanitized prefs. |
| Supabase error | Caught, user-friendly message, logged to Memory.md. |
| Any bug | Check the **browser console** + network tab first; capture the real error before fixing. |

## 5. Boundaries for the AI (the app's LLM)

1. **The LLM only *suggests*. It never *approves*.** Safety is decided by deterministic guardrail code downstream.
2. **The system prompt is fixed server-side.** User input is inserted as *data*, never as instructions — this is the structural defense against prompt injection.
3. **Output must match a strict schema** (meals with typed fields). Anything else is rejected.
4. **User free-text is screened** by the input guardrail before it reaches the model.
5. **Low temperature** for consistent, parseable output.
6. **Every guardrail decision is logged** to `safety_events` — the audit trail *is* evidence.

## 6. Git workflow (branch-per-feature · commit everything · ask before push)

These three are **checked on every prompt** (also pinned in [CLAUDE.md](../CLAUDE.md)):

1. **Commit every change.** Every change, update, addition, or deletion is committed with a message that explains *what changed and why*. Small, logical commits — never a giant dump. This is the **visible AI-first process** CyberGen grades. Use conventional prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
2. **Branch per feature.** Every feature is built on its own branch off `main`, named `feat/<thing>` (e.g. `feat/auth`, `feat/generate-plan`, `feat/allergen-guardrail`, `feat/safety-dashboard`). Merge back to `main` only when the feature works. `main` always stays deployable.
3. **Ask before pushing.** Never `git push` (or open/merge a PR, or change anything on the remote) without the user's explicit go-ahead **for that push**. Local commits and branches don't need permission — pushes do. Always state what will be pushed and to which branch before asking.

---
*If a rule needs to change mid-build, record the change and the reason in [Memory.md](Memory.md) — don't silently break it.*
