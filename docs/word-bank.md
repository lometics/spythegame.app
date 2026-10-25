# Word bank

Secret words with hints graded by closeness. Lives in `src/data/words/`:

- `meta.json`: language-neutral data: `id`, `category`, `sub`, `difficulty` (1 = everyone knows it, 3 = niche), `grade` (A/B/C, see Grading) with a `review` note for B and C, and the sub-category ids per category.
- `<lang>.json`: text per language, keyed by the same ids: `word`, `associated[]`, `sibling[]`, plus labels for sub-categories.

Loader and checker: `src/game/words.ts`. Each language file loads on demand, with English as the fallback. In play (`src/game/pairs.ts`), categories covered by the word bank come from here, minus grade C words. The word bank covers food, places, animals, nature, body, sports, music, clothing, jobs, vehicles, household, tech, myth and entertainment, plus the seasonal packs halloween, christmas, easter and summer (see `src/game/season.ts`: the pack in season is pre-selected for new players and listed first). Every word exists in all 15 app languages. Not covered on purpose: "tricky" (mixed by design) and the sensitive categories (tyrants, dark humor, prophets, stereotypes, peoples, terror, infamous, religions): those are real people, groups and tragedies, where generated hints go wrong easily, so they keep their hand-curated pairs. These categories and custom lists still use `src/data/pairs.*.json`; there the one curated spy word is used as both decoy and close hint, and the category name serves as the category hint.

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

## Grading

Every word gets a grade from three reviews:

- **Blind hint test**: a fresh LLM sees only the category and one close hint and names 5 guesses. A hint "misses" if the word isn't among them.
- **Decoy review**: each decoy is judged good / synonym / subtype / unrelated / weak.
- **Suitability**: how well known the word is (1-3), whether it translates naturally, whether the word and its hints are appropriate for a mixed-age table, and how many angles there are to give clues (1-3).

| Grade | Meaning | Rule |
|---|---|---|
| A | great | none of the issues below |
| B | fine, played | known to most adults but not all, or translates poorly, or fewer clue angles, or 1 missing hint, or 1 poor decoy |
| C | kept for reference, **not played** | inappropriate, not widely known, hard to give clues for, 2+ missing hints, or both decoys poor |

`node scripts/wordbank-grade.cjs <reviewDir> report` lists what to fix; `... apply` writes `grade`, `review` and the reviewed `difficulty` into `meta.json`. `scripts/wordbank-files.cjs` reads and writes the word files in their one-entry-per-line layout.

## Pipeline

1. **Pick words**: about 40 per category, spread across sub-categories.
2. **Write hints**: LLM or by hand, following the rules above. Generator prompt:
   > For each word in category X give: sub-category id, 3 associated hints (different kind of thing, linked to the word, short nouns, none sharing a stem with the word), 2 siblings (same kind, clearly different, no synonyms, no sub-types, widely known). Output JSON matching `src/data/words/en.json`.
3. **Automatic check**: `npx vitest run src/game/words.test.ts` (ids line up across files, sub labels present, minimum hint counts, no duplicates, no stem leaks).
4. **Blind critic**: `node scripts/wordbank-critic.mjs export <dir>` writes shuffled hints without the words. Give `hints-<cat>.tsv` to a fresh LLM acting as the spy ("5 guesses per hint"), save as `guesses-<cat>.json`, then `node scripts/wordbank-critic.mjs score <dir>`. Labels: `direct` = word was guess #1, `ok` = guess #2-5, `MISS` = not in top 5 (misleading or too vague). Give `siblings.tsv` to another fresh LLM and have it classify each pair as good/synonym/subtype/unrelated/weak.
5. **Review**: fix every MISS and every non-good sibling, re-run step 3, blind-test only the replacements, then grade (see Grading).
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

### 2026-10-25: 12 more categories, 471 words, en/de/fr/it/es

- Generated 40 words each for animals, nature, body, sports, music, clothing, jobs, vehicles, household, tech, myth and entertainment (4 parallel generators, shared brief). 9 words came up in two categories and were kept in one, so 471 new words, 551 in total.
- Step 4, first pass: 155 of 1413 close hints missed, 61 of 942 decoys poor. Suitability: nothing inappropriate, 1 word not widely known (Leprechaun), 2 hard to clue (Forehead, Invisibility cloak). A few hints leaned on stereotypes or US-only references (donut → Police, hair salon → Gossip, poncho / maracas → Mexico, hearing aid → Grandpa, tacos → Tuesday) and were replaced too.
- Replaced all of them once, then blind-tested only the replacements: 26 of 161 new hints still missed, 13 of 61 new decoys still poor. Those count against the grade instead of another round of rewriting.
- Result: **A 381, B 162, C 8** (C: Forehead, Tracksuit, Metal detector, Text message, QR code, Leprechaun, Invisibility cloak, Water pistol).
- Food and places were graded too (suitability only; their hints passed the first run): 72 A, 8 B.

### 2026-10-25: seasonal packs, 10 more languages

- 4 seasonal packs (Halloween, Christmas & New Year, Easter & spring, summer), 30 words each; Skeleton dropped (already in body), so 119. Review as above: 82 of 357 close hints missed at first (seasonal categories are broad), 17 decoys poor; after one rewrite 5 hints and 6 decoys still fail. Result **A 85, B 33, C 1** (Spider web). Whole bank: 670 words, A 466, B 195, C 9.
- All 670 words translated into pt, nl, pl, sv, tr, ru, ar, ja, ko and zh, and the seasonal packs into de, fr, it, es; one translator per language, told to localize. Some languages replace the secret word itself where the English one doesn't fit (ru: Panettone → Мандарины, Roast turkey → Оливье; ja: Leprechaun → 座敷わらし; ar keeps alcohol only where the secret word is alcoholic, and drops pork from hints). CJK languages use a stricter stem rule (no shared character), which makes some of their decoys a bit looser. tr: "Azrail" replaced by the neutral "Ölüm meleği".
