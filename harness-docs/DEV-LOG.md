# Development Log

One entry per completed step. What was done, what the operator saw, what comes next.

**Plan:** `harness-docs/DEV-PLAN.md`
**Product definition:** `harness-docs/HANDOVER.md` section 2

**Preview URL:** https://studier-git-dev-cafes-projects-5a353a12.vercel.app
Always shows the latest `dev` build. Separate from the live site.

**Live site:** deploys only from `main`, only when the operator asks.

---

## Milestone 1, create a Tone Test and add wording variants

### Step 0. Confirm the preview pipeline — DONE, 3 August 2026

**Nothing needed building.** Vercel was already set up to build the `dev` branch. The four most recent deployments all came from `dev` and all succeeded.

The preview address is stable and always points at the latest `dev` build:
`studier-git-dev-cafes-projects-5a353a12.vercel.app`

Production last deployed on commit `ac458e5`, which is the commit tagged `pre-harness-baseline`. The live site has not changed at any point during this work.

**Operator check:** open the preview address and confirm the site loads and you can log in.

---

### Step 1. Add study type to the database — DONE, 15 August 2026

**What happened.** Added a `study_type` column to the `studies` table in Supabase, applied directly (not through this repository, since Supabase changes go through the database connector). Allowed values `tree_test` and `tone_test`. Every existing study defaulted to `tree_test`. Added a check constraint and an index on the column.

**Why Sonnet, not Opus.** The design decision (add this column, these two values) was already settled in the product definition. This step was mechanical execution of a decision already made, not new judgement. Opus is for steps that require designing something, like Step 2.

**Verified by:** re-reading the table structure after the change and confirming the column, default and constraint were exactly as intended. All tables in the database currently show zero rows, which the operator should confirm is expected before Step 2.

**Operator check still open:** open the live site and confirm the study list loads and existing Tree Tests open normally.

---

### Repository account migration — DONE, 15 August 2026

Not a Milestone 1 step, but recorded here because it affected where this project lives.

**What happened.** The operator moved their GitHub account from `cafeyee` to `henex-studio`, and pointed GitHub Desktop at a fresh local folder, `Work/Studier/code/Studier`, connected to `henex-studio/studier`. The `dev` branch history (4 commits) was pushed across from the old account by the operator directly, preserving full commit history.

Separately, this working folder (`Work/Harness/projects/studier`) is where the assistant has been reading and writing throughout this project, and it holds several files that were never committed anywhere: this development log, the development plan, the handover document, the scoring options analysis, and the retirement of two superseded planning documents into `docs/tone-test/archive/`.

**Decision, 15 August 2026.** Going forward, product code and product decisions live in `Work/Studier/code/Studier`, the folder GitHub Desktop manages and the operator pushes from. Harness-mechanism material (decision log, open questions register, guard scripts, subagent definitions, the settings template) stays in `Work/Harness/projects/studier`. The four documents above move to the Studier folder because they are product decisions and a development plan, not harness mechanism, and development cannot proceed without them being where the code is.

**What the operator needs to do:** commit and push the files the assistant just copied into this folder (see below), so `henex-studio/studier` on GitHub has everything.

---

### Step 2. Create the Tone Test tables — DONE, 15 August 2026

**Model used:** Opus. This step designed table structure and access rules, which are expensive to change once data exists.

**What happened.** Created two new tables. Nothing existing was touched, so Tree Test could not be affected.

`tone_test_settings` holds one row per Tone Test: the scenario, the content goal, the sensitivity level, the variant mode, the Content Score weights, which roles are active, and a spare field for Evidence Confidence settings. The weights and active roles start at the agreed defaults, so a new Tone Test is usable without configuring anything.

`tone_variants` holds one row per wording variant: a label, the wording, an optional private note, and a display order.

Access rules were copied from the existing `study_tasks` pattern and reuse the three permission functions already in the database. Owners and admins have full access to their own studies. Anonymous participants can read only from published studies.

**One design decision worth recording.** Access rules in this database control which *rows* someone can see, not which *fields*. Left at that, an anonymous participant reading a published study's variants would also receive the creator's private note on each variant, and the scoring weights. Neither is meant for participants, and the private note in particular could contain internal reasoning about the wording.

Postgres can restrict access field by field, so it is now doing that. Anonymous participants receive the variant label, wording and order, and the study's scenario, content goal, sensitivity level, variant mode and active roles. They do not receive the private note, the Content Score weights, or the Evidence Confidence settings. Verified after applying by listing exactly which fields the anonymous role can read.

This is a new mechanism for this repository, introduced because the alternative was a real information leak that would have been harder to correct once participants existed.

**Two fields with no defined meaning.**

`sensitivity_level` was included because the development plan and the specification both call for it, but nothing has decided what values it takes or what it changes. It is stored as free text with no constraint. This remains one of the three open product questions.

`variant_source` appears in the specification's field list and nowhere else, with no values and no stated purpose. It was left out. Adding a column later is a small change, as Step 1 showed; removing a field that code has started to rely on is not.

**Also done.** The two migrations applied so far were written into `supabase/migrations/` so the repository carries a record of what the database looks like. The seven older loose SQL files in `supabase/` are history and are not the migration sequence.

**Operator checks.** Nothing visible yet. The interface changes begin at Step 3.


### Step 3. Choose a study type when creating — DONE, 15 August 2026

**Model used:** Sonnet. Interface work following an already-agreed plan.

**What happened.** The test collection page gained a type selector, Tree Test or Tone Test, next to the title box, defaulting to Tree Test so existing habits are unaffected. Choosing Tree Test creates a study exactly as before, using the same default welcome, privacy and end text as always, and opens the existing builder.

Choosing Tone Test creates a study with `study_type` set to `tone_test`, minimal default text, and opens a new placeholder page rather than the Tree Test builder. That placeholder confirms the study saved and named itself, and is where Step 4 builds the real setup screen.

**Files touched.** `StudyListPage.jsx` (the type selector and the branch in `createStudy`), a new file `src/pages/tonetest/ToneBuilderPage.jsx`, one added route in `App.jsx`, and a small CSS addition so the new dropdown fits next to the existing title field on both desktop and mobile widths.

**Verified by:** `npm run build` completes without errors.

**Operator checks still open:** on the preview URL, create a Tree Test the way you always have and confirm nothing changed. Then create a Tone Test and confirm it opens a new, mostly empty page that shows the title you gave it.

### Step 4. Tone Test builder, basic fields — DONE, 15 August 2026

**Model used:** Sonnet. Interface work, fields and layout already defined in the product definition.

**What happened.** The placeholder page from Step 3 was replaced with a real setup screen: test title, scenario, content goal, sensitivity level, welcome message, privacy message, end message, and an optional closing time. Layout follows the existing Tree Test builder's patterns (the same field blocks, the same text list editor for multi-line content) so the two look like one product.

The first time a Tone Test is opened in the builder, its `tone_test_settings` row is created automatically if it does not already exist. Every Tone Test has exactly one settings row from that point on.

**Sensitivity level is stored but does nothing**, and the field says so in the interface. This matches the standing open question; nothing was invented to fill the gap.

**A wording variants section is visible but empty**, with a note that it is coming next. This is Step 5.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx`, replacing the Step 3 placeholder in full. No other files changed.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Open a Tone Test, fill in every field, save, leave the page, come back, and confirm everything is still there. This is the first real test that Tone Test data is being stored correctly, not just that the page loads.

### Fix, found during Step 4 verification — DONE, 15 August 2026

**What the operator saw.** After saving a Tone Test and returning to the test collection, clicking "Edit" opened the Tree Test builder instead of the Tone Test builder, showing tasks, IA tree CSV and other Tree Test-only fields.

**Cause.** The test collection page's "Edit" links, and the test title link in list view, were all written to point at `/builder/:id` unconditionally, regardless of a study's type. This is Step 6's job under the original plan, but leaving it unfixed meant Step 4 could not actually be verified, so it was brought forward.

**Fix.** Every link that opens a study for editing now checks `study_type` and opens `/tone-builder/:id` for a Tone Test or `/builder/:id` for a Tree Test. Both card view and list view got a small coloured type badge next to the status badge, so the two kinds are visibly distinguishable in the collection, which is also part of Step 6's intent.

**Files touched.** `StudyListPage.jsx`, `style.css` (new badge colours).

**Verified by:** `npm run build` completes without errors.

**Operator checks.** From the test collection, open a Tone Test's Edit link and confirm it lands on the Tone Test setup screen from Step 4, not the Tree Test builder. Open a Tree Test's Edit link and confirm nothing changed there.

### Step 5. Wording variants — DONE, 15 August 2026

**Model used:** Sonnet. Interface work, rules already defined (two to four variants, label, wording, optional note, order).

**What happened.** The wording variants section is now a real editor: add, edit, delete, move up and down. A brand new Tone Test starts with two empty variants already present, since the test needs at least two to ever be publishable and an empty section gave no cue that variants are required. Add is disabled at four. Delete is disabled at two, with a message explaining why. Each variant has a label (for the creator's own reference, not shown to participants), the wording itself, and an optional internal note.

**How variants save.** Unlike the single settings row, variants are a list, so saving them is not a single update. On Save: any variant removed from the list is deleted from the database, any variant that already exists there is updated, and any new variant is inserted and then adopts its real database id in the interface, so a second Save updates it rather than creating a duplicate. All variant changes happen together with the rest of the page's Save button; there is no separate save action per variant.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Add a third variant. Reorder them with move up and down. Delete one down to two. Save, leave the page, come back, and confirm the order and content survived exactly. Try to add a fifth and confirm the button is disabled. Try to delete down to one and confirm the button is disabled at two.

### Step 6. Study list shows both types — DONE early, alongside the Step 4 fix above.

The test collection already shows which type each study is (a coloured badge next to the status badge) and Edit already opens the correct builder for each. See the "Fix, found during Step 4 verification" entry. Nothing further needed here.

---

## Milestone 1 complete

The operator can create a Tone Test, fill in its content, add wording variants, and find it all again later. It cannot be published or answered yet, which matches the end state Milestone 1 was scoped to reach.
