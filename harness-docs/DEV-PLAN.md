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

## Milestones 3 to 5, outline only

**Milestone 3, the participant flow.** The public link detects the study type, shows welcome and privacy content, offers only the active roles, locks the role once answering starts, assigns or displays variants according to the mode, shows the right questions, and saves responses.

**Milestone 4, results.** Response counts, Content Score by variant, breakdown by role, Evidence Confidence, gate status, the recommendation label, open comments grouped by role and variant, and the automatic flag from the Audience blame rating to the Agency.

**Milestone 5, finishing.** CSV export, close, clear data, reuse, and the in-app guide.

Each is planned in detail when we reach it, using what the previous milestone taught us.

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
