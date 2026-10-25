# Word bank

Secret words with hints graded by closeness. Lives in `src/data/words/`:

- `meta.json`: language-neutral data: `id`, `category`, `sub`, `difficulty` (1 = everyone knows it, 3 = niche), and the sub-category ids per category.
- `<lang>.json`: text per language, keyed by the same ids: `word`, `associated[]`, `sibling[]`, plus labels for sub-categories.

Loader and checker: `src/game/words.ts`. Each language file loads on demand, with English as the fallback. In play (`src/game/pairs.ts`), categories covered by the word bank (food, places) come from here. All other categories and custom lists still use `src/data/pairs.*.json`; there the one curated spy word is used as both decoy and close hint, and the category name serves as the category hint.

## Hint ladder

What the spy can be given, hardest to easiest for the spy:

| Level | Source | Example (Bakery) |
|---|---|---|
| Category | `category` (i18n name) | Places |
| Sub-category | `sub` → `subs[sub]` | Shop |
| Associated | `associated[]` | Bread |
| Sibling (undercover mode) | `sibling[]` | Butcher |

Associated and sibling are separate game modes: with an associated hint the spy knows they are the spy; with a sibling the spy gets a decoy word.

## Writing rules

1. **Word**: concrete, describable without saying it, known to a casual European/US group.
2. **Associated**: a thing linked to the word but of a different kind (Bakery → Bread, not → Patisserie). Short noun preferred. Should point to the word without spelling it out. A guesser should still be able to come up with 2+ other candidates.
3. **Sibling**: same kind, clearly a different thing. Not a synonym (Hospital/Clinic), not a sub-type or parent (Wine/Champagne, Volcano/Mountain), not obscure (Jambalaya).
4. No hint may share a word or stem with the word (Lemon/Lemonade, Corn/Popcorn, Police station/Fire station). `sharesRoot` enforces this.
5. 3 associated + 2 sibling per entry (checker minimum is 2 each).
6. Translations: localize, don't transliterate. If an association doesn't work in a culture (Tacos → Tuesday), replace it with a local one. Ids, sub and difficulty never change per language.

## Pipeline

1. **Pick words**: about 40 per category, spread across sub-categories.
2. **Write hints**: LLM or by hand, following the rules above. Generator prompt:
   > For each word in category X give: sub-category id, 3 associated hints (different kind of thing, linked to the word, short nouns, none sharing a stem with the word), 2 siblings (same kind, clearly different, no synonyms, no sub-types, widely known). Output JSON matching `src/data/words/en.json`.
3. **Automatic check**: `npx vitest run src/game/words.test.ts` (ids line up across files, sub labels present, minimum hint counts, no duplicates, no stem leaks).
4. **Blind critic**: `node scripts/wordbank-critic.mjs export <dir>` writes shuffled hints without the words. Give `hints-<cat>.tsv` to a fresh LLM acting as the spy ("5 guesses per hint"), save as `guesses-<cat>.json`, then `node scripts/wordbank-critic.mjs score <dir>`. Labels: `direct` = word was guess #1, `ok` = guess #2-5, `MISS` = not in top 5 (misleading or too vague). Give `siblings.tsv` to another fresh LLM and have it classify each pair as good/synonym/subtype/unrelated/weak.
5. **Review**: fix every MISS and every non-good sibling by hand, re-run step 3.
6. **Translate**: one pass per language, then a native-style review for idioms and cultural fit, then re-run step 3.

## Run log

### 2026-10-25: food + places, 40 each, en/de/fr/it/es

- Step 3 caught 1 stem leak: Supermarket → Market.
- Step 4 (LLM as spy), associated hints:
  - food: 75 direct / 35 ok / 10 miss
  - places: 98 direct / 18 ok / 4 miss
  - Replaced all 14 misses. A blind recheck of the replacements found 3 still missing (Naan, Pita, Cheese), and those were replaced again (Turmeric, Garlic sauce, Long fork).
  - Most associated hints are `direct`, so this tier is the "close hint". A looser tier would need hints picked from the `ok` band.
- Step 4 siblings: 146 good, 6 subtype, 5 weak, 2 unrelated, 1 synonym. All 14 non-good pairs were replaced.
- Step 6: one translator per language, told to localize. They swapped US-only cues (Taco Tuesday, cops and donuts, diners, pumpkin pie) and fixed compound-word stem leaks (Flughafen/Hafen, Aeroporto/Porto, Panadería/Pan). The review pass fixed 2 more (es Templo, fr Diner).
- ConceptNet relatedness check skipped: API returned 502.
