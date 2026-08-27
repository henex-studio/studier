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

### Fix, found after Milestone 1 — DONE, 15 August 2026

**What the operator saw.** Clicking "Back to test collection" on the Tone Test setup screen went to the consent screen instead, which looked like being signed out.

**Cause.** The button navigated to `/`. The app treats the empty path as the consent screen unconditionally, regardless of login state, because that route is checked before the routes that require a session. This was never a logout. Every other "back to collection" link in the app already avoids this by going to `/admin` instead, which is not a special-cased path and falls through correctly to the test collection.

**Fix.** Both places in the Tone Test setup screen that navigated to `/` now navigate to `/admin`, matching the rest of the app.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx`.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** From the Tone Test setup screen, click "Back to test collection" and confirm it returns to the test list, still signed in.

## Milestone 1 complete

The operator can create a Tone Test, fill in its content, add wording variants, and find it all again later. It cannot be published or answered yet, which matches the end state Milestone 1 was scoped to reach.

---

## Milestone 2, configure and publish a Tone Test

### Step 1. Database, role questions and risk gates — DONE, 18 August 2026

**Model used:** Opus. Table design and the gate assignment decision.

**What happened.** Created one new table, `tone_questions`, holding every question a Tone Test asks. Three kinds of question live in it: rating questions (the 1 to 5 agreement statements that feed the Content Score), open questions (free text, never scored), and gate questions (the six risk gates, answered Pass, Concern or Fail).

**Why there is no separate risk gate table.** The plan named `tone_risk_gates` as a second table. Building it that way would have meant one row per study per gate, holding a gate's name and whether it is critical. But under the settled product definition neither of those varies by study. It is a fixed platform fact. A per-study table would have carried six identical rows for every Tone Test ever created, and invited someone later to edit one copy and not the others. The gate's identity now sits on the gate question itself, as two fields, which is also where a participant's answer points. One table instead of two, and no way for copies to drift apart.

**The document conflict this resolved.** The original specification assigns gates to roles under the old role names, giving the Editor three gates including Privacy and consent and Harm blame and stigma. `HANDOVER.md` section 2.5 settled a different assignment later, and states that where the two disagree the handover is current. This build follows the settled version: the Agency answers five gates including all four critical ones, and the Editor answers one non-critical gate. The Audience answers none, because a gate is a judgement and the Audience supplies evidence. Nothing new was decided here.

**Default questions.** A new file, `src/lib/tonetest/defaultQuestions.js`, holds the template every new Tone Test starts from: 32 questions in total, being 10 for the Audience, 13 for the Agency and 9 for the Editor. Wording comes from the specification's section 14. Gate question wording was written fresh, since the specification only named the gates rather than phrasing them as questions. All of it is editable by the creator in Step 3; none of it is locked.

The Accessibility and readability gate's wording says explicitly that it reviews the copy and is not a compliance assessment against the accessibility standard. Leaving that unsaid would have implied a judgement the gate does not make, which the settled definition specifically warns against.

**Seeding.** The first time a Tone Test is opened in the builder, its questions are created from that template, in the same place the settings row is already created. The table has a uniqueness rule covering study, role, type and order, so if seeding ever ran twice the second attempt fails rather than silently doubling every question.

**Verified by:** reading back the table's actual structure and every constraint after applying it, and running the seed template through a script that checks it against the same rules the database enforces, plus the counts and gate assignment in `HANDOVER.md` section 2.5. All checks passed: 32 rows, correct distribution per role, six gates seeded exactly once each, four critical gates all assigned to the Agency, no gates assigned to the Audience. `npm run build` also completes without errors.

**Operator checks.** Nothing visible yet, as planned. The interface for this arrives in Steps 2 and 3.

### Step 2. Role enable and disable — DONE, 18 August 2026

**Model used:** Sonnet. Interface work, using the `active_roles_json` field and gate assignment already settled in Step 1.

**What happened.** The setup screen gained a Roles section: one card per role, showing its description, a toggle, and which gates it answers (or, for the Audience, a note that it answers none). Turning a role off asks for confirmation first, and the confirmation names exactly which gates that role currently answers, flagging when one of them is critical, since a critical gate normally blocks a recommendation on its own if it fails, and switching the role off means that check will not run at all. Turning a role back on needs no confirmation.

If no role is active at all, a message says so, matching the pattern already used for too few variants.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` (the new section and the confirm-before-disable logic), `src/lib/tonetest/defaultQuestions.js` (exported the role labels and descriptions already defined there in Step 1, so this step did not redefine them).

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Turn the Agency off and confirm the warning names all five of its gates and flags the four critical ones. Turn the Editor off and confirm the warning names its one gate, not flagged critical. Turn the Audience off and confirm the warning says it answers no gates. Cancel a disable and confirm nothing changed. Confirm a disable, save, reload, and confirm it stayed off. Turn all three roles off and confirm the "at least one role" message appears.

### Step 3. Question templates, editable — DONE, 18 August 2026

**Model used:** Sonnet. Interface work over the questions seeded in Step 1.

**What happened.** The setup screen gained a Questions section, showing every active role's rating, gate and open questions, grouped by role and then by type, with wording editable in a text box per question. Gate questions show which fixed gate they represent and whether it is critical, read-only, next to the editable wording. Only roles currently turned on in the Roles section appear here, so turning a role off in Step 2 also hides its questions from this section without deleting them.

**What this step does not do.** Adding or removing individual questions, and changing a question's type or which gate it represents. The plan scoped this step to wording edits only, since that is what the specification asks for; anything beyond that is a larger change to a fixed, seeded structure and was not part of this step.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Edit a rating question's wording for each active role, save, reload, confirm it stuck. Turn a role off in the Roles section and confirm its questions disappear from this section; turn it back on and confirm they return with any edits intact. Confirm gate questions show their gate name and critical marking correctly, matching Step 2's warning text for that role.

### Step 4. Content Score weight setup — DONE, 18 August 2026

**Model used:** Sonnet. Interface work over the `content_score_weights_json` field already defined in Step 2 of Milestone 1, using the group names and defaults settled in `HANDOVER.md` section 2.5 (Audience Evidence 40, Agency Assurance 35, Content Quality 25).

**What happened.** A weights section with three number inputs and a live running total. The total is shown in the same green-or-red pattern already used for the variant and role warnings, so it reads as consistent with the rest of the page. This step builds the input and the total only; the publish block for a total that is not exactly 100 is Step 7's job, as planned.

**One thing corrected during the build, not in the plan.** The first version disabled a weight's input field when its role was turned off in Step 2, on the idea that the weight would "redistribute automatically." That reasoning does not hold. Automatic redistribution is a scoring-time rule from `HANDOVER.md` section 2.5, for when a specific variant happens to receive no responses from a role, and it has not been built yet, it belongs to Milestone 4. It is not a builder-time rule about a role being switched off, and nothing in the plan or the product definition says disabling a role should also silently change the study's configured weights. Building it that way would have made the field lie about what it does. The field now stays editable regardless of role state, and if a weight is left pointed at a role that is off, a plain note says so and suggests reassigning it, rather than the interface pretending to handle it.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Change each weight and confirm the total updates live. Set weights that do not total 100 and confirm the total shows in red with the reason. Set them to total exactly 100 and confirm it shows in green. Turn a role off in the Roles section while its weight is still above 0, and confirm the note about it appears.

### Fix, found during Step 4 verification — DONE, 18 August 2026

**What the operator saw.** Two problems. First, a weight field showing 0 could not be cleared to type a new number; it snapped back to 0 immediately. Second, turning a role off left its weight field sitting there, still counted toward the total, with only a note suggesting the operator deal with it manually.

**Fix 1, the input.** The field was forcing every edit through `Number(...)`, so an empty field became 0 the instant it was cleared, before a new digit could be typed. The field now allows a genuinely empty value while being edited, and only becomes a real number when it is saved.

**Fix 2, the weight for a disabled role.** On review, this was a real design mistake, not a matter of taste, caught because the operator asked. The plan for this step said "active weights must total 100," and the first build silently reinterpreted that as "these three weights must always total 100," which is not the same rule and was never approved. A role that is off answers nothing, so a weight assigned to it cannot mean anything. The weight field for an inactive role's group is no longer shown at all, and the total now only sums the active groups. The inactive weight is not cleared, only hidden, so turning the role back on restores it exactly as it was.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Clear a weight field to empty and type a new value without it fighting back. Turn a role off and confirm its weight field disappears and the total recalculates over the remaining roles only. Turn it back on and confirm its weight is exactly what it was before.

### Layout change, raised by the operator after Step 4 — DONE, 18 August 2026

**What the operator raised.** Roles and their Content Score weights were shown as two separate sections, with no visual link between a role and the weight it carries. The operator asked to put them together instead.

**Why this was worth doing now.** The pairing is fixed, not incidental: Audience carries the Audience Evidence weight, Agency carries Agency Assurance, Editor carries Content Quality. Two sections asked the operator to hold that mapping in their head; one list removes the need.

**What changed.** The Roles section and the Content Score weights section are now one section, "Roles and Content Score weights." Each role's card shows its toggle, its gates, and, only while that role is active, its weight field directly beneath. The running total sits at the bottom of the combined list. No data model or save logic changed, this is layout only.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Model used:** Sonnet.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Confirm each role's card now shows its own weight field directly beneath it, that turning a role off removes its weight field from view, and that the total at the bottom still updates the same way as before.

### Step 5. Risk gate configuration display — DONE, 18 August 2026

**Model used:** Sonnet. Read-only display over data already settled, no new design judgement involved.

**What happened.** A new "Risk gates" section lists all six gates with the role that answers each, whether it is critical, and whether that role is currently active for this study. This comes straight from the fixed `GATES` list in `defaultQuestions.js`, the same source used to seed the questions in Step 1, so there is only one place this fact is defined. Criticality and role assignment are not editable here, since the plan and `HANDOVER.md` section 2.5 both treat those as platform-level facts, not per-study settings. A gate whose role is currently off shows as "Not covered" so the operator can see the gap before it shows up as a surprise in results later.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors.

**Operator checks.** All six gates appear with the role and critical marking matching `HANDOVER.md` section 2.5 (Agency answers Policy accuracy, Safety risk, Privacy and consent, Harm blame and stigma, all critical, plus Operational promise, not critical; Editor answers Accessibility and readability, not critical). Turn a role off and confirm its gates switch to "Not covered."

### Step 6. Preview by role — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** A "Preview by role" section, read-only, submits nothing. The operator picks an active role and sees the wording it would be shown and its questions in order. Which variants appear follows the variant mode exactly as PRD section 13.3 defines it: one variant in single_random mode, all variants in compare_all mode.

**A gap found while building this.** `variant_mode` has existed as a database column since Milestone 1 Step 2, with the two values the PRD always specified, but no control for it was ever added to the builder. It was defaulting silently and the operator could not change it. This is not a new product question, PRD section 7 of the setup flow already says the creator chooses the variant mode; it was simply missed in Milestone 1 Step 4. Added the missing control (a two-option choice, in the Wording variants section) as part of this step, since Step 6's preview cannot mean anything without it.

**Files touched.** `src/pages/tonetest/ToneBuilderPage.jsx` only.

**Verified by:** `npm run build` completes without errors. Not yet verified by the operator in the browser.

**Operator checks.** Set the variant mode, save, reload, confirm it stuck. Preview as each active role and confirm the right variant(s) and questions appear, matching the mode selected.

### Step 7. Publishing checks — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** The Tone Test checklist now blocks Publish the same way Tree Test's already does: title, welcome message, privacy message, closing time not in the past, scenario, content goal, two to four variants each with wording, at least one active role, every active role's required questions carrying wording, and active Content Score weights totalling exactly 100. All reasons are listed together, not one at a time.

The check logic lives in a new file, `src/lib/tonetest/publishChecks.js`, not inside `StudyListPage.jsx`. `StudyListPage.jsx` is a shared, review-gated file; the only change there is an 11-line dispatch inside `validateBeforePublish` that calls the Tone Test checklist for a Tone Test and leaves the Tree Test path untouched. This follows the project rule that shared-file edits should route to a new module rather than carry real logic themselves.

The Content Score weight arithmetic (`WEIGHT_GROUPS`, `weightTotal`, `normalizeWeights`) moved out of `ToneBuilderPage.jsx` into `src/lib/tonetest/weights.js` at the same time, so the publish check and the builder page use the exact same rule for what counts as "active weights total 100" rather than two copies that could drift apart.

**What is deliberately not covered.** "Clear data and publish" (the button that wipes response data before republishing) still only clears Tree Test tables. For a Tone Test this means it publishes without actually clearing anything, since there is nothing yet to clear, participant responses are Milestone 3 work and do not exist yet. Not a defect at this point, but worth knowing before Milestone 3 response data exists.

**Files touched.** `src/lib/tonetest/publishChecks.js` (new), `src/lib/tonetest/weights.js` (new), `src/pages/tonetest/ToneBuilderPage.jsx` (updated to import weight helpers instead of defining them), `src/pages/StudyListPage.jsx` (11-line dispatch, review path).

**Verified by:** `npm run build` completes without errors. Not yet verified by the operator in the browser.

**Operator checks.** Try to publish an incomplete Tone Test and see the specific reasons listed. Fix them one at a time and watch the list shrink. Publish once every check passes.

### End of Milestone 2 (see below for the registration work that follows)

Building is complete through Step 7. Steps 6 and 7 have not yet been verified by the operator in the browser; the operator has chosen to defer that verification rather than check after each step, so this milestone is closing on the strength of the build check alone until that verification happens.

---

## Registration and privacy work

Taken out of order at the operator's direction, ahead of Milestone 3. Planned in `PLAN-registration.md` and `PLAN-privacy-policy.md`.

### Planning and decisions — DONE, 24 August 2026

**Model used:** Opus with extended thinking.

**What happened.** Both plans written against fevnote's actual implementation, which the operator connected as a reference. Five things were found that changed the shape of the work.

1. Studier has no privacy policy. The page at `/` is an acceptable use agreement, which is a different document with a different purpose. This is writing something new, not aligning something existing.
2. Three claims in fevnote's privacy policy would be false if copied into Studier's: that the operator cannot read a user's records, that data comes only from the person typing it, and the provider list. Structure and tone transfer, specific claims do not.
3. A security defect in the current registration path. `complete_invite_registration` runs with owner privileges, is callable by anyone signed out, and takes the user id as a parameter, so a caller holding a valid code and a known user id could overwrite that user's profile row including the role field. Two versions of the function were exposed.
4. The current flow would break the moment email confirmation was switched on, because it writes the profile row from the browser immediately after sign-up, when no session exists yet.
5. fevnote's decision to enforce its invite code only in the form does not transfer. Its reasoning is that a stray account sees nothing but its own empty data. A stray Studier account can create studies and publish public links, so the consequence is a live public artefact rather than an empty screen.

**Operator decisions.** Invite code stays alongside email verification. The code is enforced in the database, with a narrow exception for dashboard-created accounts. Account deletion follows fevnote, by email to `privacy@henex.uk` within 20 working days. Data location confirmed as Sydney; verified independently, the Supabase project reports region `ap-southeast-2`. The three authentication files moved from `protected_paths` to `review_paths`.

**Files touched.** `harness-docs/PLAN-registration.md`, `harness-docs/PLAN-privacy-policy.md`, `harness-docs/DEV-PLAN.md`, `project-config.json`.

### Registration Step 1. Profile trigger and invite code enforcement — DONE, 24 August 2026

**Model used:** Opus with extended thinking.

**What happened.** Profile creation moved from the browser into a trigger on `auth.users`. Three columns added to `profiles`: `privacy_version`, `privacy_accepted_at` and `invite_code_used`. The invite code is now consumed inside the trigger in a single atomic statement, so two simultaneous sign-ups cannot both take the last use of a limited code.

**One design decision worth recording.** The trigger treats its two halves differently on purpose. The invite code check raises and stops the account being created, because that is the point of it. The profile insert swallows its own failures, because `App.jsx` already falls back to defaults when a profile row is missing and a missing row can be repaired by hand, whereas a registration path broken by a bug in the trigger cannot be repaired after the fact. Copying fevnote's blanket exception handler would have quietly disabled the invite code enforcement the operator just asked for.

**A limitation to know before Step 5.** When the trigger rejects a code, Supabase returns a generic database error rather than the message written here, so the registration form cannot show the real reason. This is why the form-level check stays: it gives the readable message, and the trigger is the enforcement backstop behind it. The two are not duplicates.

**Files touched.** `supabase/migrations/20260824_004_add_new_user_trigger.sql`. Applied to the database directly, as agreed for changes that only add.

**Verified by:** four behaviour tests run against the live database inside a transaction that was deliberately failed at the end, so nothing was left behind. An account with no invite code metadata, standing in for a dashboard account, was created with role `user` and no code recorded. An account with a valid code had its display name trimmed, its lowercase code stored uppercase, its role taken from the code, both consent timestamps stamped, and the code's use count moved from 0 to 1. An invalid code was refused. A whitespace-only code was refused rather than treated as absent. Rollback then confirmed: six accounts, six profile rows, no test users left, use count back to 0.

**Backwards compatibility.** The existing registration page passes no metadata, so it takes the dashboard path: the trigger writes a bare profile row, then the page's own call to `complete_invite_registration` fills in the rest exactly as before. Registration keeps working unchanged until Step 5 rewrites the page. The code is still consumed once, by the old function, not twice.

**Operator checks.** Nothing visible changed. Worth confirming that signing in still works and that the study list loads. Registering a genuinely new account would also still work, but leaves a real account behind, so it is better left until Step 5.

### Registration Step 4. Forgot password and reset password pages — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** Two new pages, `ForgotPasswordPage.jsx` and `ResetPasswordPage.jsx`, following fevnote's `ForgotPassword.jsx` and `ResetPassword` logic but rebuilt in Studier's own markup and CSS classes rather than fevnote's, since the two products do not share a component library. Requesting a reset shows the same "check your email" message whether or not the address has an account, matching fevnote's reasoning that confirming or denying an email's existence is itself a leak. Two lines in `src/App.jsx` route `/forgot-password` and `/reset-password`, reachable without the consent check, since someone locked out of their account already has one and already consented when they registered it.

**A gap this step knowingly leaves open.** Clicking a real reset link signs the browser in with a recovery session, and `App.jsx` does not yet tell that apart from an ordinary sign-in; it would currently route straight to `/admin` with the old password still active rather than to `/reset-password`. Registration Step 7 closes this by handling Supabase's `PASSWORD_RECOVERY` event specifically, on fevnote's pattern. Until then, `/reset-password` is reachable directly for testing but not yet reached automatically.

**Files touched.** `src/pages/ForgotPasswordPage.jsx` (new), `src/pages/ResetPasswordPage.jsx` (new), `src/App.jsx` (two imports, two route lines, review path).

**Verified by:** `npm run build` completes without errors.

**Operator checks.** Open `/forgot-password`, submit an email, confirm the same "check your email" message appears whether or not the address has an account. Open `/reset-password` directly and confirm the form renders; a real password change through it cannot be fully tested until Step 3 (email sending) and Step 7 (recovery routing) are both in place, so this check is about the form working, not the full email round trip yet.

### Registration Step 5. Registration page rewrite — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** The invite code field stays, per the operator's decision. Registration now happens through `supabase.auth.signUp` alone: invite code, display name and consent version travel as sign-up metadata, and the Step 1 trigger reads them, enforces the code, and writes the profile row. The page's own `validate_invite_code` check before sign-up stays as a friendly pre-check, matching fevnote's `Register.jsx` comment on the same pattern: it gives a clear message before an account is even attempted, while the trigger is the real enforcement point behind it. The direct call to `complete_invite_registration` and the forced immediate sign-out are both gone.

Two outcomes are handled after sign-up. An empty `identities` array means Supabase silently no-opped because the email already has an account, shown as its own message rather than a false success. A response with no session means confirmation is required, shown as a "check your email" screen; a response with a session, which is what happens today since email confirmation is not yet switched on, goes straight to `/admin`.

**Not yet stamped.** No `privacy_version` is written yet, because no privacy policy exists to agree to. That is the last piece of `PLAN-privacy-policy.md` Step 4, added here once the policy itself is written.

**Files touched.** `src/pages/RegisterPage.jsx`, review path.

**Verified by:** `npm run build` completes without errors. Not yet verified in the browser; the operator has deferred that.

### Registration Step 6. Sign-in page — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** A "Forgot your password?" link to `/forgot-password` added below the password field. Supabase's "Email not confirmed" error, easy to misread as a typo complaint, now shows as its own plain message pointing at the inbox, on the same pattern as fevnote's `describeAuthError`.

**Files touched.** `src/pages/LoginPage.jsx`, review path.

**Verified by:** `npm run build` completes without errors. Not yet verified in the browser.

### Registration Step 7. Recovery session routing — DONE, 24 August 2026

**Model used:** Sonnet.

**What happened.** `App.jsx`'s auth listener now reads the event name, not only the session. A `PASSWORD_RECOVERY` event sets a flag that overrides every other route and forces `ResetPasswordPage`, checked before the test runner, before consent, before everything. A `SIGNED_OUT` event clears the flag, which is what lets `ResetPasswordPage`'s own sign-out-then-redirect after a successful change fall straight through to the sign-in page rather than needing a callback wired through props. Closes the gap left open in Step 4: a real reset link's recovery session no longer lands in `/admin` with the old password still active.

**Files touched.** `src/App.jsx`, review path.

**Verified by:** `npm run build` completes without errors. This step cannot be meaningfully verified without a real reset email, which needs Step 3 (operator's Supabase settings) done first, so it stays unverified until Step 8.

### Registration Step 7a. Close the security hole — DONE, 26 August 2026

**Model used:** Opus with extended thinking.

**What happened.** The operator tested the full rewritten flow on the deployed preview end to end, including confirmation email delivery from `no-reply@mail.henex.uk`, an invalid invite code, forgot password, and setting a new password, with no issues. With that confirmed, both versions of `complete_invite_registration` were dropped and `accept_platform_consent` was restricted to signed-in callers. Nothing calls the dropped function; Step 5 already moved profile creation into the trigger.

**A mistake caught immediately rather than assumed away.** The first attempt revoked execute on `accept_platform_consent` from `anon` and stopped there. Checking `information_schema.routine_privileges` straight afterwards showed `anon` could still call it. The reason: Postgres grants execute on a newly created function to the `PUBLIC` pseudo-role by default, and this function was never revoked from `PUBLIC` when it was first written, back in `consent_v2_registration_update.sql`. Every role, including `anon`, inherits whatever `PUBLIC` can do, so revoking from `anon` alone changed nothing. A second statement revoking from `PUBLIC` directly fixed it, verified the same way. `validate_invite_code` has the same standing `PUBLIC` grant and keeps it deliberately, since the registration form must reach it before an account exists.

**Files touched.** `supabase/migrations/20260826_005_drop_invite_registration_function.sql`, `supabase/migrations/20260826_006_fix_accept_consent_public_grant.sql`. Applied directly to the database.

**Verified by:** both functions confirmed absent, `accept_platform_consent` confirmed uncallable by `anon` and callable by `authenticated`, account count unchanged at 8 profiles and 8 auth users before and after.

### Unplanned. Participant response data was readable by anyone — FIXED, 26 August 2026

**Model used:** Opus with extended thinking.

**How it was found.** Not by a security review. The privacy policy needs a section saying who can see a participant's answers, and the plan for it says explicitly that fevnote's claims must not be copied without checking they are true of Studier. Checking meant reading the actual access rules rather than the documentation, and the rules did not say what everyone assumed.

**What was wrong.** Anyone at all, with no account, could read every response to any published study. Confirmed by querying the live database as the anonymous role: 256 task responses, 29 final responses, 29 participant sessions. Overwriting another participant's submitted answers was also possible, demonstrated inside a transaction that was then rolled back with nothing damaged.

**Cause.** Two generations of access policies sat on the three response tables. The newer ones were correct and limited reads to the study owner and administrators. The older ones, left behind rather than replaced, allowed any anonymous caller to read and update every row belonging to a published study. Policies combine with OR, so the permissive older rule silently overrode the stricter newer one. Nothing in the newer work looked wrong on its own, which is why reading the newer migration would never have found this.

**The fix, and a wrong turn on the way to it.** Dropping the old policies closed the leak, and a check confirmed anonymous reads returned zero rows while the content participants legitimately need stayed readable. But the next check, whether participants could still submit, failed. PostgreSQL needs the conflicting row to be visible through a read policy before `INSERT ... ON CONFLICT DO UPDATE` can take the update path, and the test runner submits every answer that way. Anyone pressing the Back button to revise an answer would have hit it, so this was ordinary use breaking rather than an edge case. Column level grants were tried as a narrower alternative and do not satisfy the check either.

Submission therefore moved behind three security definer functions, the same pattern already used for `handle_new_user`. Anonymous participants now hold no privilege of any kind on the response tables and reach them only through entry points that decide what may be written. That also closes the overwrite problem properly rather than making it merely difficult.

**Files touched.** `supabase/migrations/20260826_007_fix_participant_response_read_leak.sql`, `supabase/migrations/20260826_008_participant_submission_functions.sql`, `src/pages/TestRunnerPage.jsx` (review path, three submission calls changed to RPCs).

**Verified by:** eight checks run as the anonymous role against the live database, in a transaction rolled back at the end. Direct read blocked, direct insert blocked, session start works, first answer works, the same answer revised works, final answers submitted twice works, session completion works, and a draft study still refuses everything. Response counts confirmed unchanged at 256, 29 and 29 afterwards, with no test rows left behind. `npm run build` passes.

**What this changes for Milestone 3.** Tone Test must use the same pattern from the start: participants get no direct table access, only entry points. The Milestone 3 plan already said its access rules should be tested by attempting the attack rather than by reading the policy; this is that principle paying for itself a milestone early, on live data.

**Still to do, not urgent.** The three older `supabase/*.sql` files record the superseded policies and are protected historical files, so they still describe the old arrangement. Anyone reading them for current behaviour would be misled. Worth a note at the top of each, which needs the operator since they are protected.

**Operator checks.** This one genuinely needs testing on the preview before it goes further: open a published Tree Test as a participant, answer a task, press Back, change the answer, go forward, finish the test, and confirm the responses arrive on the dashboard correctly.

### End of the registration and privacy work, for now

All eight steps of `PLAN-registration.md` are complete. The privacy policy itself, `PLAN-privacy-policy.md` Steps 1 through 6, has not been started; it was deliberately sequenced after registration, since the policy's "where information is sent" section depends on the sending service registration Step 3 just put in place. That is the natural next piece of platform work whenever the operator wants it. Milestone 3 of Tone Test is otherwise next in line per `DEV-PLAN.md`.
