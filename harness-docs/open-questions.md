# Studier Tone Test, Open Questions and Document Conflicts

**Date:** 2 August 2026
**Purpose:** Record every decision that is referred to but never made, and every place where two source documents disagree. Under H-5.5 the Planner records these and stops rather than inventing an answer. This file is what it reads.
**Companion:** `decision-log.md` holds what was actually decided. `codebase-survey.md` holds what the repository actually contains.

Two sections. **Q** entries are missing decisions and need an answer from the operator. **D** entries are conflicts between existing documents and need one source declared authoritative.

Each Q entry names the build plan task it blocks. A task cannot enter a plan while its blocking question is open.

---

# Part 1. Open questions

## Q-1 Which risk gates are critical?

**Blocks:** PLAN Task 9, Task 16. Indirectly Task 15.
**Severity:** Blocker.

S-5.3 states that a failed critical gate overrides a high Content Score and forces Not recommended until revised. Six gates exist. No source document says which of them are critical. PLAN Task 9 work item 2 says "mark gates as critical where needed", which defers the decision to whoever writes the code.

This is the clearest case in the whole set of a product decision an agent would be tempted to invent. The answer changes what the tool refuses to recommend, which is its main safety claim.

**What is needed:** For each of the six gates, critical or not.

| Gate | Critical? |
|---|---|
| Policy accuracy | |
| Operational promise | |
| Safety risk | |
| Harm, blame and stigma | |
| Privacy and consent | |
| Accessibility and readability | |

**Worth considering:** if all six are critical, the override rule fires on any single Fail from any single reviewer, which may make the tool unusable in practice. If only one or two are critical, the remaining gates become advisory and their Fail state needs a defined meaning.

---

## Q-2 What is the rating scale?

**Blocks:** PLAN Task 2 schema, Task 14 runner, Task 15 dashboard.
**Severity:** Blocker.

Every rating question in PRD §14 is written as a statement, for example "This message is clear." That format implies agreement scaling. No document states the number of points, the labels, whether a neutral midpoint exists, or whether a not applicable option is available.

The schema cannot define `response_value` without this, and Content Score cannot be computed without it.

**What is needed:** Point count, endpoint labels, presence of a midpoint, presence of a not applicable or prefer not to say option, and whether the scale is identical across all three roles.

---

## Q-3 How is Content Score computed from individual ratings?

**Blocks:** PLAN Task 15, Task 16, Task 17.
**Severity:** Blocker.

S-4.2 gives the weights across the three groups. Nothing states how the ratings inside a group become a group score, or how a group score becomes a number on a comparable scale.

Specific unknowns. Whether a group score is the mean of its rating questions or something else. Whether scores are normalised to 0 to 100 before weighting. Whether every rating question inside a group carries equal weight. How a group with no responses is handled, given that a variant may receive Audience responses and no Comms responses. Whether a Content Score is computed per variant per role and then combined, or pooled first.

The last one matters most. PRD §16 asks the dashboard to show both Content Score by variant and score breakdown by role, which means the calculation has to be defined at both levels and the two must reconcile.

**What is needed:** The calculation, stated precisely enough that two people implementing it independently would produce the same number.

---

## Q-4 What are the Evidence Confidence thresholds?

**Blocks:** PLAN Task 8, Task 15.
**Severity:** Blocker.

PRD §11.2 and SCORE §7.2 describe Low, Medium and High qualitatively. High requires "enough feedback" per variant and "no obvious sample imbalance". Low requires response numbers that are "very low". None of these are numbers.

OVER Risk 4 already identified this and said the boundary should be defined before Task 8. It has not been.

**What is needed:** Minimum responses per variant for Medium and for High. Minimum responses per active role. What counts as sample imbalance, expressed as a ratio. Whether thresholds are fixed or configurable per study, which PRD §28 item 5 lists as an open question in its own right.

---

## Q-5 Are participant relevance and response quality automated, manual, or dropped?

**Blocks:** PLAN Task 8.
**Severity:** Blocker.

S-4.5 lists four Evidence Confidence factors. Role coverage and response volume are computable from stored data. Participant relevance and response quality are not. SCORE §7.3 acknowledges this directly, saying some parts may need researcher judgement.

PLAN Task 8 work item 4 offers a researcher override "only if easy to implement without scope creep", which is not a decision. PLAN Task 8 Risk 1 states the consequence, that a fully automated confidence score is misleading if relevance cannot be known by the system.

**Three viable options.** Automate the two computable factors and drop the other two from MVP, documenting the reduction. Automate two and add a researcher override with a required note. Or make Evidence Confidence entirely manual with the system showing supporting counts.

**What is needed:** One of the three, or another.

---

## Q-6 What happens to a risk gate when its only respondent role is disabled?

**Blocks:** PLAN Task 6, Task 9, Task 16.
**Severity:** Blocker.

S-2.3 allows any role to be disabled provided one remains. S-5.4 assigns gates to roles. The two interact and no document addresses the interaction.

If Plain Language and Accessibility Reviewer is disabled, Accessibility and readability and Harm, blame and stigma have no respondent. If Comms and Policy Reviewer is disabled, four gates lose their respondent. If only Audience is active, which S-2.3 permits, no gate has a respondent at all and the entire risk gate layer is empty.

The recommendation status logic in S-5.3 then has nothing to evaluate, and it is undefined whether an unanswered gate is a pass, a blank, or a reason to lower Evidence Confidence.

**What is needed:** Behaviour for an unanswered gate. Whether disabling a role should warn about gate coverage. Whether an Audience-only configuration should be permitted at all.

---

## Q-7 What is a "strong" Content Score?

**Blocks:** PLAN Task 16.
**Severity:** Major.

PRD §17 rule 3 says status is Recommended for review when Content Score is strong, Evidence Confidence is Medium or High, and no critical gate failed. Strong is not defined. Rule 4 says status is Needs revision or Recommended with caution when scores are "mixed", also undefined, and offers two possible outputs without a rule for choosing between them.

Similarly rule 2 offers Insufficient evidence or Recommended with caution "depending on Content Score and gate status" without stating the dependency.

**What is needed:** Numeric thresholds, and a deterministic choice between the paired outputs in rules 2 and 4. Three of the five statuses currently cannot be produced reliably.

---

## Q-8 What does sensitivity level do?

**Blocks:** PLAN Task 4.
**Severity:** Major.

Sensitivity level appears as a Builder field in PRD §13.1 and as a column in `tone_test_settings` in PRD §19.2. Its permitted values are never listed and it has no stated effect on any behaviour. It does not appear in publishing checks, dashboard, export or gate logic.

**What is needed:** Either the value set and what it changes, or a decision to drop it from MVP. A stored field that does nothing will attract behaviour later and is better resolved now.

---

## Q-9 Can a variant be deleted after publishing when responses exist?

**Blocks:** PLAN Task 5.
**Severity:** Major.

PLAN Task 5 Risk 2 raises it and leaves it open, saying deletion "should be blocked or handled carefully". Task 5 Risk 3 adds that reordering must not break response mapping.

Responses reference `variant_id`. Deleting a variant orphans them, and the dashboard would show scores for a variant that no longer exists or silently drop data.

**What is needed:** Whether deletion is blocked after publish, blocked once responses exist, or permitted with a defined cascade. Also whether reordering after publish is permitted.

---

## Q-10 to Q-13, RESOLVED 2 August 2026

Four questions blocked the setup checklist. All four are answered and recorded in `harness-core/docs/decision-log.md`. Full original text is in git history.

### Q-10 Does the platform have real users? Resolved.
**Answer:** A small amount of real test data exists in the production database. No active users.
**Recorded as:** H-6.3, classification revised from `confidential` to `internal`. H-6.7, first-task band narrowed from three to five tasks down to two to three.
**Effect:** None operationally, since both classifications close the Gemini path. It matters because it lowers the cost of a defect reaching production from a user-facing incident to a rollback.
**Reverts when:** the first real study with external participants runs.

### Q-11 Which document owns the task numbering? Resolved.
**Answer:** `Studier_Tone_Test_MVP_Build_Plan_v2_ScoringAligned.md` is authoritative, with 21 tasks numbered 0 to 20.
**Consequence:** `Studier_Tone_Test_MVP_Project_Plan_Overview.md` is corrected or retired. See D-1. Until it is, any task number taken from the overview is wrong.

### Q-12 Does the direct-to-production workflow continue? Resolved.
**Answer:** No. It is retired in full.
**Recorded as:** H-6.12. Resolves S-8.3.
**Consequence:** `Studier_Project_Instructions.md` becomes background. Its rules, roles, tech stack and code conventions carry into the project `CLAUDE.md`. Its Workflow section is superseded.

### Q-13 How do database changes reach production? Resolved.
**Answer:** Supabase CLI migrations. A `supabase/migrations/` directory with timestamp-prefixed files. The seven existing loose SQL files are consolidated into one baseline migration.
**Recorded as:** H-6.13.
**Carried forward as a new risk:** the baseline must be verified against the real production schema, not assembled from the seven files by inspection. Recorded in the harness decision log open questions as item 6.

### Also settled at the same time, without having been asked as questions

**Execution layer.** Local Claude Code, confirmed after assessing a fully online alternative. Recorded as H-6.15, which also records the online design for later use, since it is the migration target for objective three.

**Verification split.** Build and regression run locally. Human acceptance and anonymous participant flows run on the Vercel preview, because RLS defects do not reliably reproduce locally. Recorded as H-6.14.

**Rollback baseline.** An annotated tag on the current `main` before anything is touched. Recorded as H-6.16. Every existing commit says "Add files via upload", so the current state is the only reliable restore point and it is currently unlabelled.

---

## Q-14 Is the gate to role mapping correct as written?

**Blocks:** PLAN Task 9.
**Severity:** Minor, but cheap to resolve now.

Per S-5.4, Harm, blame and stigma is answered only by the Plain Language and Accessibility Reviewer, not by the Comms and Policy Reviewer. Safety risk is answered only by Comms and Policy. Privacy and consent is answered by both. Audience answers none.

Harm and blame sitting with the accessibility reviewer rather than the policy reviewer is an unusual placement for a gate of that kind, and may be a drafting artefact rather than a decision.

**What is needed:** Confirmation, or a corrected mapping.

---

## Q-15 Should the Audience role answer any gate?

**Blocks:** PLAN Task 9.
**Severity:** Minor.

Related to Q-14 and Q-6. Audience participants currently contribute nothing to the risk gate layer. In an Audience-only study, permitted by S-2.3, the layer is empty. Whether that is intended, or whether Audience should answer a reduced gate set, is not addressed anywhere.

---

# Part 2. Document conflicts

## D-1 Task numbering does not match between the overview and the build plan

**Severity:** Blocker. See Q-11.

OVER states 18 development tasks and maps them as Milestone 1 tasks 1 to 3, Milestone 2 tasks 4 to 10, Milestone 3 tasks 11 to 13, Milestone 4 tasks 14 to 16, Milestone 5 tasks 17 to 18.

PLAN contains Tasks 0 through 20, which is 21 tasks, and maps them as Milestone 1 tasks 0 to 3, Milestone 2 tasks 4 to 11, Milestone 3 tasks 12 to 14, Milestone 4 tasks 15 to 18, Milestone 5 tasks 19 to 20.

The consequence is not cosmetic. In OVER, Milestone 3 is Participant Experience covering tasks 11 to 13. In PLAN, Task 11 is publishing checks, which is creator-side work. Anyone taking a task number from OVER and looking it up in PLAN gets a different task.

OVER appears to have been written against an earlier build plan and not updated when the scoring-aligned version added tasks. **Recommendation: PLAN v2 is authoritative and OVER is corrected or retired.**

## D-2 The four-group weighting survives in two documents

**Severity:** Major.

S-4.3 records that the 35/30/20/15 four-group model is superseded. Two artefacts still present it as current.

ARCH Phase 11 states "the default weights discussed were" and lists all four including Evidence Confidence at 15%, with no note that this was later changed. ARCH is a history document so the content is legitimate, but a reader arriving at Phase 11 has no signal that Phase 11 no longer holds.

`tone-and-assurance-testing-proposal.html` displays the four-group model under Suggested scoring model, with Evidence Confidence Score at 15%. This is the stakeholder-facing artefact. Anyone shown that page is being shown superseded numbers.

**Recommendation:** Add a superseded marker to ARCH Phase 11 pointing to SCORE §4. Update the proposal page, or mark it as a dated artefact.

## D-3 The status list has four entries in one document and five in another

**Severity:** Minor.

ARCH Phase 14 lists four recommendation statuses: Recommended for review, Needs revision, Not recommended until revised, Insufficient evidence.

PRD §17 and SCORE §9 list five, adding Recommended with caution.

**Recommendation:** PRD v2 is authoritative at five. Related to Q-7, which is what makes the fifth status implementable.

## D-4 The stated absence of real users contradicts the platform being in operation

**Severity:** Blocker. See Q-10.

## D-5 Two different code delivery methods are described

**Severity:** Minor on its own, but it feeds Q-12.

OVER, in the responsibilities table, assigns the operator "Commit and push code via VS Code".

INST, in the workflow section, states that all code changes are pushed directly to the GitHub repository through MCP.

These describe different hands on the commit. It matters for the harness because it determines whether a human currently sees a diff before it deploys.

## D-6 The PRD filename referenced in the archive no longer exists

**Severity:** Cosmetic, but it is a symptom.

ARCH Phase 17 records the generated PRD as `Studier_Tone_Test_PRD.md`. The file present is `Studier_Tone_Test_PRD_v2_ScoringAligned.md`. PLAN §7, the developer handoff package, correctly names the v2 file.

The pattern across D-1, D-2 and D-6 is the same. The scoring model was revised, some documents were regenerated and others were not, and no document records which version supersedes which. That is the condition `decision-log.md` and this file exist to end.

## D-7 Task 0 is recorded as complete but its acceptance criteria are unevidenced

**Severity:** Major. Recorded as S-8.2.

---

# Part 3. Resolution order

**Done.** Q-10, Q-11, Q-12, Q-13. The four harness-level blockers, resolved 2 August 2026.

**Next, specification work.** Q-2 rating scale, Q-3 Content Score calculation, Q-4 Evidence Confidence thresholds, Q-7 what counts as a strong score. These four together define the entire scoring computation. They interlock, so answering them separately risks producing an inconsistent set.

This is the recommended first substantive task through the harness. The output is a document, the risk is zero, and it exercises the full Planner to Generator to Evaluator loop on something that genuinely needs to exist. It also unblocks more downstream tasks than anything else on the list.

**Then, product judgement calls.** Q-1 which gates are critical, Q-5 Evidence Confidence automation boundary, Q-6 gate coverage when a role is disabled, Q-8 sensitivity level, Q-9 variant deletion, Q-14 gate to role mapping, Q-15 whether Audience answers gates.

Q-1 and Q-6 should be answered together. Q-6 changes what Q-1 means, because a critical gate with no respondent is a different situation from a critical gate that failed.

**Then, document repair.** D-1, D-2, D-3, D-6. Mechanical once the decisions above are settled. D-2 is the most urgent of these, because the stakeholder-facing proposal page currently shows superseded weights.

**Remaining count:** 11 open questions, 5 open conflicts.
