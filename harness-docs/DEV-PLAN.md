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

## Milestones 2 to 5, outline only

**Milestone 2, the rest of the builder.** Role configuration with enable and disable, default question templates per role that the creator can edit, Content Score weight setup with a live total that blocks publishing unless it reaches 100, the six risk gates, preview by role, and publishing checks. This is the largest milestone.

**Milestone 3, the participant flow.** The public link detects the study type, shows welcome and privacy content, offers only the active roles, locks the role once answering starts, assigns or displays variants according to the mode, shows the right questions, and saves responses.

**Milestone 4, results.** Response counts, Content Score by variant, breakdown by role, Evidence Confidence, gate status, the recommendation label, open comments grouped by role and variant, and the automatic flag from the Audience blame rating to the Agency.

**Milestone 5, finishing.** CSV export, close, clear data, reuse, and the in-app guide.

Each is planned in detail when we reach it, using what the previous milestone taught us.

---

## What is not in this plan

The role rename has not been propagated to the older documents. Development uses the current names, Audience, Agency and Editor. The older documents are corrected later, or left with a note.

Three product questions remain open and none of them blocks Milestone 1: what sensitivity level does, whether a variant can be deleted after publishing when responses exist, and whether Evidence Confidence should include researcher judgement. Each is answered when the step that needs it arrives.

The scoring specification was going to be written as a separate document. It is not needed. The product definition in `HANDOVER.md` section 2.5 is complete enough to build from, and a separate specification would be a third copy of the same decisions, which is how documents drift apart.
