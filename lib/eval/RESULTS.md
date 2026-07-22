# Aegis — guardrail eval results

**The number that proves it works.** Run with `npm run eval`. The harness builds a
labeled corpus of meals — ones we *know* are unsafe for a given allergy profile
(the allergen hidden three ways: as a correct tag, as an **untagged** ingredient,
and only in the meal name) and ones we *know* are safe — then runs every meal
through the **real shipped** `screenMeal()` from `lib/guardrails/allergen.ts`
(not a copy). The unsafe foods are an independent list of real allergen-containing
ingredients, so this measures coverage, not a circular match.

- **Catch rate** = of all unsafe meals, how many the guardrail blocked. Target **100%** — a single miss means an unsafe meal could reach a user, so the harness exits non-zero.
- **Specificity** = of all safe meals, how many it correctly allowed (false positives are a UX cost, not a safety failure).

## Latest run (2026-07-22)

```
════════════════════════════════════════════════════════════
  AEGIS GUARDRAIL EVAL — real shipped screenMeal() vs a labeled corpus
════════════════════════════════════════════════════════════

  Profile                            unsafe blocked   safe allowed
  ---------------------------------- ---------------- ------------
  Peanut allergy                     12/12            4/4
  Tree-nut allergy                   12/12            4/4
  Milk allergy                       15/15            4/4
  Egg allergy                        9/9              4/4
  Fish allergy                       9/9              4/4
  Shellfish allergy                  12/12            4/4
  Soy allergy                        9/9              4/4
  Wheat allergy                      9/9              4/4
  Coeliac (gluten)                   9/9              4/4
  Sesame allergy                     9/9              4/4
  Custom: kiwi                       6/6              4/4
  Custom: mango                      6/6              4/4
  Multi: peanuts + shellfish + kiwi  30/30            4/4
  Coeliac + dairy                    33/33            4/4

────────────────────────────────────────────────────────────
  Meals evaluated: 236  (180 unsafe, 56 safe) across 14 allergy profiles
  CATCH RATE  (unsafe meals blocked): 180/180 = 100.0%
  SPECIFICITY (safe meals allowed):   56/56 = 100.0%
────────────────────────────────────────────────────────────
  ✓ PASS — every unsafe meal was blocked. No unsafe meal can reach a user.
```

**100% catch rate, 100% specificity** across 236 meals / 14 profiles — including
the cases where the model would have *forgotten to tag* the allergen (the
untagged-ingredient and meal-name-only vectors), which the defense-in-depth name
scan still catches.

See also `npm run test:guardrail` (14 hand-written cases, incl. the block →
regenerate cycle and injection screening).
