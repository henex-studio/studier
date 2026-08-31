# Tone Test Development Plan

**Written:** 3 August 2026
**Approve before work starts.** Nothing is built until the operator says yes.
**Product definition:** `harness-docs/HANDOVER.md` section 2. That is what this plan implements.

---

## How we work

The operator does not open a terminal, type commands, or read code.

**The assistant** writes code, commits it to the `dev` branch, and applies database changes.
**Vercel** builds `dev` and produces a preview URL, separate from the live site.
**The operator** opens the preview URL, uses it, and says what is wrong.

Nothing reaches the live site until the operator asks for it. The live Tree Test is unaffected throughout.

Before any database change, the assistant states in plain terms what will change and what could go wrong. Database changes are applied directly, because Tone Test adds new tables rather than altering existing ones, and adding a table cannot break Tree Test. The one exception is Step 1.2, which adds a column to an existing table. That step is called out separately.

Every completed step is recorded in `harness-docs/DEV-LOG.md`.

---

## Five milestones

| # | What gets built | What the operator can do at the end |
|---|---|---|
| 1 | Create a Tone Test and add wording variants | Create a study, add two to four variants, save, come back and find them |
| 2 | Roles, questions, weights, publishing checks | Configure a complete study and publish it |
| 3 | The participant flow | Open the public link and complete the study as each role |
| 4 | Results | See scores, confidence, gate status and recommendations |
| 5 | Export, lifecycle, guide | Export CSV, close, clear, reuse, and read the in-app guide |

Milestone 1 is detailed below. The rest are outlined at the end and detailed when we reach them, because what we learn in Milestone 1 will change them.

---

## Milestone 1, in detail

Six steps. Each ends with something the operator checks.

### Step 0. Confirm the preview pipeline

**What happens.** Push a trivial change to `dev` and confirm Vercel produces a preview URL.

**Why first.** Everything after this assumes the operator can see results. If `dev` does not build a preview, that has to be fixed before anything else, and it is a Vercel setting rather than a code change.

**Operator checks.** A preview URL exists and the current site loads on it.

**Risk.** None. No code changes.

---

### Step 1. Database, part one: study type

**What happens.** Add a `study_type` column to the `studies` table. Allowed values `tree_test` and `tone_test`. Every existing study becomes `tree_test`.

**Why it needs care.** This is the only step that touches an existing table. Every current study record gets a new field.

**What could go wrong.** If existing code somewhere assumes the exact shape of a study record, an added column could surprise it. In practice this is very unlikely, because the code reads named fields rather than whole rows. The change is also reversible by dropping the column.

**Operator checks.** Open the live site. The study list loads, existing Tree Tests open, and everything behaves as before. **This check happens on the live site, not the preview, because the database is shared.**

**Stop condition.** If anything looks wrong, the column is dropped immediately and we work out why before continuing.

---

### Step 2. Database, part two: Tone Test tables

**What happens.** Create two new tables.

`tone_test_settings` holds one row per Tone Test: the scenario, the content goal, the sensitivity level, the variant mode, the Content Score weights, and which roles are active.

`tone_variants` holds one row per wording variant: a label, the wording, an optional internal note, and its display order.

Both get access control rules copied from the existing pattern, reusing the three permission functions already in the database.

**What could go wrong.** Almost nothing. New tables cannot affect existing ones. If the design is wrong we drop and recreate.

**Operator checks.** Nothing visible yet.

---

### Step 3. Choosing a study type when creating

**What happens.** The study list page gains a choice between Tree Test and Tone Test next to the title box. Choosing Tree Test behaves exactly as it does now. Choosing Tone Test creates a study and opens the new builder.

**Files touched.** `StudyListPage.jsx`, which is existing shared code. The change is small: a type selector, and a branch that sends the user to a different page.

**Operator checks.** On the preview URL, create a Tree Test the way you always have and confirm nothing changed. Then create a Tone Test and confirm it opens a new, mostly empty page.

---

### Step 4. The Tone Test builder, basic fields

**What happens.** A new page holding the fields every Tone Test needs: title, scenario, content goal, sensitivity level, welcome message, privacy message, end message, and an optional closing time.

Layout and styling copy the existing Tree Test builder, so the two look like one product.

**Files touched.** One new file. Plus one line in `App.jsx` to add the route.

**Operator checks.** Fill in every field, save, leave the page, come back, and confirm everything is still there. This is the first real test that data is being stored correctly.

---

### Step 5. Wording variants

**What happens.** A section of the builder for adding wording variants. Add, edit, delete, reorder. Minimum two, maximum four, enforced in the interface.

**Files touched.** The new builder page only.

**Operator checks.** Add three variants. Reorder them. Delete one. Save, reload, and confirm the order and content survived. Try to add a fifth and confirm it is refused.

---

### Step 6. The study list shows both types

**What happens.** The study list shows which type each study is, and the Edit link goes to the right builder.

**Files touched.** `StudyListPage.jsx`.

**Operator checks.** Both types appear in the list, clearly distinguishable, and Edit opens the correct builder for each.

---

### End of Milestone 1

The operator can create a Tone Test, fill in its content, add wording variants, and find it all again later. It cannot be published or answered yet.

**Realistic elapsed time.** Two to four hours including the operator's checks, spread over as many sessions as suits. Steps 1 and 2 are quick. Steps 4 and 5 are the substantial ones.

---

## Milestone 2, in detail

**Written:** 18 August 2026. **Approve before work starts, same as Milestone 1.**

Seven steps. Each ends with something the operator checks, same pattern as Milestone 1.

### A document conflict this milestone resolves

The original specification (`docs/tone-test/Studier_Tone_Test_PRD_v2_ScoringAligned.md`) assigns risk gates to roles under their old names, from before the Audience, Agency, Editor rename. Under that older assignment, the Plain Language and Accessibility Reviewer (now Editor) answers three gates: Accessibility and readability, Harm blame and stigma, and Privacy and consent.

`HANDOVER.md` section 2.5 settled a different assignment later, and states plainly that where the two disagree, the decision log and handover are current. Under the settled version, Agency answers five of the six gates, including all four critical ones (Policy accuracy, Safety risk, Privacy and consent, Harm blame and stigma), plus the non-critical Operational promise. Editor answers exactly one gate, Accessibility and readability, which is not critical.

This milestone builds to the settled version, not the PRD's older one. This is not a new decision, it is an old document catching up to one already made. It is recorded here rather than asked again.

### Step 1. Database, role questions and risk gates

**What happens.** Two new tables.

`tone_questions` holds one row per question: which study, which role, the question text, the question type (rating, open text, or gate), and its display order. Rating and open questions are per role. Gate questions carry which of the six fixed gates they represent and whether that gate is critical, using the settled assignment above.

`tone_risk_gates` is not a separate table after all. On reflection, a gate's criticality is a fixed platform fact, not a per-study setting, so it does not need its own table with per-study rows. It is stored as two columns directly on gate-type rows in `tone_questions`: `gate_key` and `gate_critical`. This avoids a redundant table and keeps gate identity attached to the question that asks it, which is where the response ties back to it anyway.

When a Tone Test is first opened in the builder, its `tone_questions` rows are seeded from the default templates in PRD section 14, adapted to the settled gate assignment: six Audience rating questions, four Audience open questions, five Agency rating questions, five Agency gate questions (four critical), three Agency open questions, five Editor rating questions, one Editor gate question (not critical), three Editor open questions. Creators can edit question wording after seeding; the platform does not lock it.

**What could go wrong.** Almost nothing, this only adds a table. Access rules copied from the same pattern as `tone_variants`.

**Operator checks.** Nothing visible yet.

---

### Step 2. Role enable and disable

**What happens.** The Tone Test setup screen gains a section with a toggle for each of the three roles, backed by the `active_roles_json` field already in `tone_test_settings` from Step 2 of Milestone 1. Disabling a role shows a warning naming which gates will then have no respondent, and marking which of those are critical. The creator confirms before it takes effect.

**Operator checks.** Turn a role off, see the warning naming its gates, confirm, and see the role marked off. Turn it back on.

---

### Step 3. Question templates, editable

**What happens.** For each active role, the setup screen shows its seeded rating, gate, and open questions, editable in place. Creators can change wording. Adding or removing individual questions is not in this step, only editing the wording of what was seeded, which matches what the specification asks for.

**Operator checks.** Edit a question's wording for each role, save, reload, confirm it stuck.

---

### Step 4. Content Score weight setup

**What happens.** A section showing the three weight fields (Audience Evidence, Agency Assurance, Content Quality) already stored in `content_score_weights_json`, with a live total. Publishing is blocked unless active weights total exactly 100; this step builds the input and the running total, not the publish block itself, which belongs to Step 7.

**Operator checks.** Change a weight, see the total update live. Set weights that do not total 100 and see that reflected, without yet being blocked from anything (the block arrives in Step 7).

---

### Step 5. Risk gate configuration display

**What happens.** A read-only view of the six gates, which role answers each, and which are critical, drawing from the seeded `tone_questions` gate rows. This step does not let creators change gate criticality, since that is a platform-level fact under the settled decision, not a per-study choice.

**Operator checks.** See all six gates listed with their role and critical marking matching the table in `HANDOVER.md` section 2.5.

---

### Step 6. Preview by role

**What happens.** A preview mode, reachable from the setup screen, that shows what a participant would see after choosing a given active role: the assigned or all variants depending on variant mode, and that role's questions in order. Read-only, submits nothing.

**Operator checks.** Preview as each active role, confirm the right questions and variants appear.

---

### Step 7. Publishing checks

**What happens.** The publish action (added to the test collection alongside the existing Tree Test publish flow) is blocked unless: welcome and privacy content are present, scenario and content goal are present, there are two to four variants, at least one role is active, required role questions exist for every active role, active Content Score weights total exactly 100, and the closing time is not in the past. This mirrors the existing Tree Test publish-check pattern already in `StudyListPage.jsx`.

**Operator checks.** Try to publish an incomplete Tone Test, see the specific reasons listed. Fix them one at a time, watch the list shrink. Publish once every check passes.

---

### End of Milestone 2

The operator can fully configure a Tone Test, including roles, questions, weights and gates, preview it from each role's perspective, and publish it. Nobody can answer it yet, since the public participant flow is Milestone 3.

**Realistic elapsed time.** This is the largest milestone. Four to six hours including operator checks, spread across sessions. Steps 1 and 3 carry the most design judgement; the rest are largely mechanical once those are right.

---

## Milestone 3, in detail

**Written:** 24 August 2026. **Approve before work starts, same as Milestones 1 and 2.**

Six steps. This is the first milestone where anonymous strangers touch the database, so access control carries more weight here than anywhere before it.

### What makes this milestone different

Everything built so far runs behind a sign-in. Milestone 3 opens a path for people who are not signed in to write to the database. That changes what a mistake costs. A wrong access rule in the builder shows a creator something they should not see. A wrong access rule here lets anyone on the internet write rows, read other people's responses, or answer a test that is not published.

For that reason, and following the rule already set in `CLAUDE.md` section 5, the checks in this milestone happen on the deployed preview rather than locally. A local session carries leftover sign-in state that hides exactly the faults this milestone can introduce.

### Two design decisions taken here, with reasoning

**Sessions get their own table rather than extending the existing one.** The specification (section 19.8) suggests extending `participant_sessions`, which Tree Test already uses, with role, assigned variant and completion status. This plan does not do that. It creates `tone_sessions` instead.

The reason is that `participant_sessions` is live Tree Test data with working access rules. Adding Tone Test columns to it means every Tone Test change carries a risk of disturbing Tree Test, and it produces a table where half the columns are always empty depending on which type the row belongs to. A separate table keeps the two apart, matches how `tone_variants` and `tone_questions` were already handled, and costs nothing except that the results screen later reads from two places instead of one. The trade-off runs the right way.

**Responses split into two tables, not one.** `tone_responses` holds ratings and open text. `tone_gate_responses` holds gate answers. They look similar enough to merge, but a gate answer is a different kind of thing: it has a status of Pass, Concern or Fail rather than a number or a sentence, it belongs to a named gate, and Milestone 4 reads it under completely different rules, where a single Fail on a critical gate overrides everything else. Merging them means one table with columns that only apply half the time, and scoring code that has to keep asking which kind of row it is looking at. This follows the specification, sections 19.6 and 19.7.

### Step 1. Database, sessions and responses

**What happens.** Three new tables.

`tone_sessions` holds one row per participant per test: the study, the participant identifier already generated by the existing browser code, the chosen role, the assigned variant if the mode assigns one, the display order used if the mode compares all, and the times it started and finished.

`tone_responses` holds one row per answered rating or open question: the session, the question, the variant the answer refers to, and the value.

`tone_gate_responses` holds one row per gate answered: the session, the gate, the variant, the status, and an optional comment.

Access rules are the part that matters. Anonymous participants may insert rows only for a study that is published and not closed, may read nothing back, and may never touch another session's rows. Creators and administrators may read everything for their own studies and write nothing. This is stricter than the pattern used for `tone_variants`, because those tables are read by participants and these are written by them.

**What could go wrong.** Only new tables, so Tree Test cannot be affected. The risk is in the access rules rather than the structure, which is why step 6 checks them from a signed-out browser rather than trusting they are right.

**Operator checks.** Nothing visible yet.

### Step 2. The public link recognises a Tone Test

**What happens.** Today `/test/<slug>` always opens the Tree Test runner. It needs to look at the study type first and open the right one.

The awkward part is that the address only carries the slug, so the type is unknown until the study is fetched. Rather than putting that fetch into `src/App.jsx`, which is a shared review-gated file, a small router component does the fetch and hands off to whichever runner is right. `App.jsx` changes by an import and one line, which is dispatch and nothing more, matching how the publish checks were handled in Milestone 2 Step 7.

One naming wrinkle to accept knowingly: the writable folders are all named for Tone Test, so a component that serves both types has to live in a Tone Test folder. That is a limit of the current configuration, not a design choice, and it is better than putting real logic into a shared file.

**Operator checks.** Open an existing published Tree Test link and confirm nothing changed. A published Tone Test link should reach a Tone Test screen rather than the Tree Test one.

### Step 3. Welcome, privacy, and choosing a role

**What happens.** The participant sees the welcome message, then the privacy message, then the list of active roles with the description of each. Disabled roles do not appear. Choosing a role and confirming creates the session row and fixes the role for that browser.

The role locks once answering starts, as the specification requires. Before that point the participant can change their mind freely. Reopening the link on the same browser returns to the same session rather than starting a second one, using the participant identifier the existing code already stores.

**A question this step raises and does not answer.** Nothing stops one person answering three times as three different roles, or clearing their browser storage and starting again. The specification does not address it and neither does the settled product definition. This is recorded in `open-questions.md` rather than decided here. It does not block the step, because the honest MVP position is that Tone Test measures wording rather than policing participants, but the results screen in Milestone 4 should probably say so rather than implying every response is a different person.

**Operator checks.** Open a published Tone Test as a signed-out participant. Only active roles appear. Pick one, confirm, and reload the page; the same role should still be selected.

### Step 4. Showing the wording and the questions

**What happens.** Which wording appears follows the variant mode. In single assignment mode one variant is picked at random the first time the session is created and stays fixed for that participant. In compare all mode every variant appears, in an order shuffled once per session and then kept.

Both the random pick and the shuffle happen once and are written into the session row. Recomputing them on every page load would mean a participant who refreshes sees a different wording, which quietly ruins the data.

Then the chosen role's questions appear in order: ratings first, then gates, then open questions. Gate questions offer Pass, Concern or Fail with an optional comment. In compare all mode, a final preference question asks which wording the participant preferred.

**Operator checks.** In single assignment mode, confirm one variant appears and stays the same across reloads. In compare all mode, confirm all variants appear and their order stays the same across reloads for the same participant. Confirm the questions match the role chosen.

### Step 5. Submitting

**What happens.** Required questions must be answered before the participant can submit. Open questions stay optional, as they were when the defaults were seeded. Submitting writes the responses, marks the session finished, and shows the end message.

Returning to a finished session shows the end message again rather than a blank form or a chance to answer twice.

**Operator checks.** Try to submit with a required question blank and see it refused, naming what is missing. Complete a full response as each active role. Reopen the link afterwards and confirm it shows the completion message rather than letting you answer again.

### Step 6. Closed tests, and checking the access rules properly

**What happens.** A test that is closed, or past its closing time, shows a plain message saying it is no longer accepting responses. A link to a draft test shows nothing at all, because a draft is not public.

Then the access rules from step 1 get tested rather than assumed. `CLAUDE.md` is explicit that a system cannot be validated by reading documents about it, and the harness work already produced four faults that were invisible on review and only appeared when run. So this step includes deliberately attempting, from a signed-out browser, to read another participant's responses, to write a response to an unpublished study, and to write a response to a closed one. Each attempt should fail.

**Operator checks.** Close a published Tone Test and confirm the link stops accepting answers. Try a draft test's link and confirm it gives nothing away. The access attempts above are reported rather than performed by the operator.

### End of Milestone 3

A Tone Test can be published, answered by real participants in each active role, and the answers are stored correctly. Nobody can see the results yet, since the dashboard is Milestone 4.

**Realistic elapsed time.** Four to six hours including the operator's checks. Step 1 carries the most design judgement, step 4 the most fiddly detail, step 6 the most value per minute spent.

### What Milestone 3 needs decided, and what it does not

Nothing in this milestone is blocked. Two questions come up during it and both can be recorded and passed over:

1. Whether repeat participation should be prevented, raised in step 3.
2. Whether a participant can leave part way through and come back later, or whether an abandoned session should expire. The plan above allows returning indefinitely, which is the simpler behaviour and easy to change later.

Three earlier open questions still sit unanswered and still do not block this milestone: what sensitivity level actually does, whether a variant can be deleted after responses exist, and whether Evidence Confidence should include researcher judgement. The second becomes real in Milestone 3 for the first time, because responses will finally exist, but it only bites when a creator tries to edit a published test.

---

## Milestone 4, in detail

**Written:** 30 August 2026. **Approve before work starts, same as the earlier milestones.**

This milestone turns stored answers into the three numbers the tool exists to produce. Everything it computes is already specified in `HANDOVER.md` section 2.5, which settles the calculation, the thresholds, which gates are critical, and the numeric bands for every recommendation status. Nothing here is invented.

**One correction before starting.** `open-questions.md` still describes Q-1 through Q-7 as blockers on this milestone. It is out of date. Those questions were answered when `HANDOVER.md` section 2.5 was written and the file was never updated. It has been given a status header saying so. Read section 2.5 as the authority on scoring, not the questions file.

### What the operator settled before this plan was written

**The blame flag threshold.** An Audience mean below 3.5 on "This message does not make me feel blamed" flags the Harm, blame and stigma gate for Agency attention. Adjustable per study, defaulting to 3.5.

The reasoning for 3.5 rather than 3.0 is that a mean of 3.5 normalises to 62.5, inside the "mixed" band rather than the failing one, so the flag fires while the wording still looks acceptable overall. Harm is the one thing this tool treats as irreversible, so it prompts early and lets the Agency decide rather than waiting for the average to turn clearly negative.

Making it adjustable is a deliberate departure from the principle in section 2.5 that scoring thresholds are fixed constants invisible to the creator. It is defensible here because this threshold produces a prompt for a human to look at something, not a score or a status. The cost is that the flag is no longer comparable between two studies that set it differently, which matters if these are ever compared side by side. Worth revisiting after the first real study.

**The "Not applicable" option.** Built as step 0 of this milestone, before anything is calculated.

### The gap this milestone has to close first

Section 2.5 settles a five-point scale with a midpoint at 3 and a "Not applicable" option excluded from all calculations. The scale and midpoint were built. **"Not applicable" never was.** Rating questions are seeded as required, so a participant facing a question that does not apply to them has no choice but to pick a number, and that number is counted.

This was missed in Milestone 3 and found while planning this one. It matters here specifically: the Content Score is defined as the mean of all *non-null* ratings, and the system currently cannot produce a null. Every score calculated before this is fixed carries a bias in an unknown direction, because a forced answer is not a neutral one.

---

### Step 0. The "Not applicable" option

**What happens.** A "Not applicable" choice appears alongside 1 to 5 on every rating question. Choosing it records that the participant saw the question and had no applicable view, which is different both from an unanswered question and from a rating of 3. It satisfies the required check, and it is excluded from every calculation in this milestone.

The database currently refuses to store it. `tone_responses` carries a check constraint requiring either a rating or some text, so a row with neither is rejected. A `not_applicable` flag column is added and the constraint is widened to accept a row that is explicitly marked not applicable. Storing an explicit row rather than storing nothing keeps the distinction between "did not apply to me" and "never answered", which Evidence Confidence needs, since only the second should count as missing evidence.

The per-study blame flag threshold column is added in the same migration, defaulting to 3.5, because batching two small schema changes into one reviewed migration is better than two.

**Files touched.** A new migration in `supabase/migrations/`. `src/pages/tonetest/ToneTestRunnerPage.jsx`. The two entry points that write ratings, `submit_tone_response` and the validation inside it.

**Operator checks.** Answer a rating question "Not applicable" and submit. Confirm submission is allowed, and that the answer is not silently treated as a 3.

---

### Step 1. The scoring library

**What happens.** One module of pure calculation, no screen and no database access, so it can be reasoned about and checked on its own. It computes, for a given variant: each role group's score, the weighted Content Score, Evidence Confidence, gate status per gate, and the recommendation label.

Every rule comes from section 2.5. Group score is the mean of non-null ratings normalised with `(mean − 1) ÷ 4 × 100`. A group with no responses has its weight removed and the rest scaled up proportionally, never treated as zero. Evidence Confidence is High at five or more responses per active role group per variant with an imbalance ratio of 0.5 or better, Medium at three or more in at least one active group, Low otherwise, with the documented downgrades. Recommendation rules are evaluated in priority order, first match wins.

Thresholds are named constants in one place, as section 2.5 asks, so they can be made configurable later without touching the calculation.

**How it is checked.** Section 2.5 contains a worked example: 34 Audience ratings summing to 131 and 10 Agency ratings summing to 37, with Content Quality absent, producing group scores of 71.3 and 67.5 and a Content Score of 69.5. The arithmetic was verified independently while writing this plan and it is correct. That example becomes the test fixture. If the library does not reproduce 69.5 from those inputs, it is wrong.

**Files touched.** New: `src/lib/tonetest/scoring.js`.

**Operator checks.** None. This step produces no visible change. It is reported when the worked example passes.

---

### Step 2. The dashboard shell and the read path

**What happens.** A Tone Test opened from the study list reaches a Tone Test dashboard rather than the Tree Test one. `DashboardPage.jsx` is a Tree Test screen throughout, so it gets a study-type branch that routes into a new `ToneDashboardPage`, the same dispatch pattern used for the builder and the participant runner.

The read path is confirmed rather than assumed. The owner and admin select policies on the three participant tables were written in Milestone 3 Step 1 but have only ever been exercised by the database owner, which bypasses row security entirely. This step checks that a signed-in owner can read their own study's responses and, more importantly, that a signed-in user who owns a different study cannot.

**Files touched.** `src/pages/DashboardPage.jsx`, a review path, dispatch only. New: `src/pages/tonetest/ToneDashboardPage.jsx`.

**Operator checks.** Open the Dashboard link on the Tone Test and confirm it is a Tone Test screen, not a Tree Test one showing empty tables.

---

### Step 3. Content Score and Evidence Confidence

**What happens.** For each wording variant: the Content Score, the contribution of each active role group, the number of responses behind it, and the Evidence Confidence label with the reason it landed there. A variant with too little evidence says so plainly instead of showing a confident-looking number.

The warning from section 2.5 appears when any active role group has fewer than three responses for a variant. It blocks nothing.

Presentation follows the existing dashboard's cards and tables. No charts. Section 2.9 puts advanced charts out of scope.

**Files touched.** `src/pages/tonetest/ToneDashboardPage.jsx`. Possibly `src/style.css`, a review path, only if existing classes genuinely do not stretch.

**Operator checks.** Compare the score shown against the same calculation done by hand for one variant. This is the check that matters most in the whole milestone.

---

### Step 4. Risk gates, recommendation status, and the blame flag

**What happens.** Each of the six gates shows Pass, Concern, Fail, or "Not covered" when its answering role was inactive, never Pass by default. Critical gates are marked as such. The recommendation label appears per variant with the rule that produced it stated in plain words, so the label is explainable rather than oracular.

The blame flag is calculated here: when the Audience mean on "This message does not make me feel blamed" falls below the study's threshold, the Harm, blame and stigma gate is marked as flagged for Agency attention. The flag is a prompt, not a judgement, and the wording must say so. The threshold gets an input in the Tone Builder, defaulting to 3.5.

**Files touched.** `src/pages/tonetest/ToneDashboardPage.jsx`, `src/pages/tonetest/ToneBuilderPage.jsx`.

**Operator checks.** Confirm a disabled role's gates read "Not covered". Confirm the recommendation label matches the rule it claims to have applied. Set the blame threshold high enough to force the flag on and confirm it appears.

---

### Step 5. Comments, preferred wording, and counts

**What happens.** Open text answers grouped by role and by variant, so a comment can be read next to the wording it was about. Gate comments shown with their gate. In compare-all studies, a count of which wording participants preferred, kept separate from the Content Score, since a preference is not a score.

Participation counts: sessions started, sessions completed, and responses per role per variant.

**Files touched.** `src/pages/tonetest/ToneDashboardPage.jsx`.

**Operator checks.** Confirm comments appear under the right wording and the right role.

---

### Step 6. Checking the numbers

**What happens.** The milestone is checked rather than assumed, on the same reasoning as Milestone 3 Step 6 and for the same reason recorded in `CLAUDE.md`.

Three checks. The worked example from section 2.5 reproduces exactly. A variant's score is recalculated by hand from the stored responses and matches what the screen shows. A second account cannot read the first account's results, attempted for real rather than reasoned about.

**Operator checks.** Reported rather than performed, except the hand recalculation, which is worth doing together.

---

### What Milestone 4 needs decided

One question, and it should be answered before Step 4 rather than during it.

**Should a critical gate that is "Not covered" withhold the top recommendation status?** Rule 3 grants "Recommended for review" when the score is 70 or above, evidence is Medium or High, and no gate is Fail. "Not covered" is not Fail. So a study with the Agency role turned off, where all four critical gates have no respondent, can reach the highest status with no risk review having happened at all. Evidence Confidence does not catch this, because it only counts responses from roles that are active.

This contradicts section 2.5's own statement that the Agency is the role the process can least afford to lose. It is a product and safety decision, not an implementation detail, so it is recorded rather than answered here. Three obvious options: treat an uncovered critical gate as blocking the top two statuses; cap such a study at "Insufficient evidence"; or accept it as intended, on the grounds that the creator consciously turned the role off and was warned at the time.

The three older open questions still sit unanswered and still do not block: what sensitivity level does, whether a variant can be deleted once responses exist, and whether Evidence Confidence should include researcher judgement.

**Realistic elapsed time.** Four to six hours including the operator's checks. Step 1 carries the most design risk despite being invisible, and step 6 is where its correctness is actually established.

---

## Milestone 5, outline only

**Milestone 5, finishing.** CSV export, close, clear data, reuse, and the in-app guide.

Planned in detail when we reach it, using what Milestone 4 teaches us.

---

## What is not in this plan

The role rename has not been propagated to the older documents. Development uses the current names, Audience, Agency and Editor. The older documents are corrected later, or left with a note.

Three product questions remain open and none of them blocks Milestone 1: what sensitivity level does, whether a variant can be deleted after publishing when responses exist, and whether Evidence Confidence should include researcher judgement. Each is answered when the step that needs it arrives.

The scoring specification was going to be written as a separate document. It is not needed. The product definition in `HANDOVER.md` section 2.5 is complete enough to build from, and a separate specification would be a third copy of the same decisions, which is how documents drift apart.

---

## Deferred work, raised 15 August 2026

Two changes the operator wants, not part of Tone Test and not started. Raised now so they are not forgotten, planned in detail after Milestone 1.

**Privacy policy.** Align Studier's privacy policy with the approach already working in the operator's other product, fevnote. The entity is Henex Studio, the contact address is privacy@henex.uk. Studier already collects some personal data at registration, so this is a real gap, not a nice-to-have.

**Registration and account management.** Replace the current invite-code registration with the fevnote model: email verification and password reset as standard account management, rather than invite-only access.

Both touch the registration and consent flow, which is shared platform code rather than Tone Test code, so both are planned separately once Milestone 1 is out of the way and the current fevnote implementation can be reviewed as the reference.

**Planned in full on 24 August 2026.** See `harness-docs/PLAN-privacy-policy.md` and `harness-docs/PLAN-registration.md`. Both are blocked on the same operator decision, whether `RegisterPage.jsx`, `LoginPage.jsx` and `ConsentPage.jsx` stay on the absolute deny list or move to review. The registration plan also reports a security defect in the current invite-code function that is worth fixing regardless of what happens to the rest.
