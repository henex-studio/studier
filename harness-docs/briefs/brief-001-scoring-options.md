# Brief 001, scoring model options analysis

**Type:** Conversation-layer input to the execution layer. Written by the operator, read by the Planner. Under H-1.4 a decision reached in conversation has no effect until it exists as a file, and this is that file.
**Status:** Ready for planning.
**Approval mode:** A. Operator confirms the plan before implementation and the result after.
**Risk band:** Low. Documents only, no application code, no database. Complies with H-6.7.

---

## 1. Why this task is first

Four open questions together define the entire Tone Test scoring computation: Q-2 rating scale, Q-3 Content Score calculation, Q-4 Evidence Confidence thresholds, Q-7 what counts as a strong score. They are recorded in `harness-docs/open-questions.md`.

Between them they block build plan tasks 2, 8, 14, 15, 16 and 17. Nothing else outstanding unblocks as much.

They also interlock. The rating scale determines what a group score can be. The group score determines what "strong" means. The confidence thresholds determine when a score should be trusted at all. Answering them separately produces an inconsistent set, which is how the four-group weighting model in S-4.3 came to survive in two documents after being superseded.

---

## 2. What this task is, and what it is not

**It is** an options analysis. For each of the four questions, set out the realistic options, the trade-offs between them, a recommendation with reasoning, and the consequences that follow for the other three.

**It is not** the decision. The rating scale, the thresholds and the definition of a strong score are product decisions. They belong to the operator under H-5.5, and an agent that picks them to keep moving produces work that gets discarded.

**It is not** the final specification either. That is a separate task, written after the operator has chosen. Keeping analysis and specification apart means the specification is written once against settled decisions rather than rewritten each time a choice changes.

This separation is deliberate and is the point of the task. Analysis is work an agent can complete honestly. Deciding is not.

---

## 3. Sources

Authoritative, in order:

1. `harness-docs/decision-log.md`, S-4.1 through S-4.7 for what is already settled about scoring.
2. `docs/tone-test/Tone_Test_Scoring_System_Explanation.md`, the fullest reasoning on the three-layer model.
3. `docs/tone-test/Studier_Tone_Test_PRD_v2_ScoringAligned.md`, sections 11, 14, 16 and 17.
4. `harness-docs/open-questions.md`, Q-2, Q-3, Q-4, Q-7 for the precise gaps.

Note that `Studier_Tone_Test_Development_Archive.md` Phase 11 still presents the superseded four-group weighting as current, recorded as D-2. Do not take weights from it. The correct defaults are Audience Evidence 40, Comms and Policy Assurance 35, Plain Language and Accessibility 25, per S-4.2.

---

## 4. What must be answered

### Q-2, the rating scale

No source document states the number of points, the labels, whether a neutral midpoint exists, or whether a not-applicable option is offered. Every rating question in PRD section 14 is phrased as a statement, which implies agreement scaling, but that is an inference rather than a decision.

Cover: point count, endpoint labels, presence of a midpoint, presence of a not-applicable or prefer-not-to-say option, and whether the scale is identical across all three roles.

Note the mobile constraint. PRD section 23 requires the participant flow to work on mobile, and a seven-point scale with worded labels is materially harder to render on a phone than a five-point one.

Note also that S-2.6 lets creators edit question wording but requires core scoring dimensions to remain. If the scale is part of a question rather than a study-level setting, an edited question could carry a different scale and break comparability.

### Q-3, Content Score computation

Weights across the three groups are settled at 40, 35 and 25. Nothing states how the ratings inside a group become a group score, or how a group score becomes a number on a comparable range.

Cover, at minimum:

1. How a rating maps to a number.
2. How the ratings within a group combine into a group score. Mean, or something else, and whether every question inside a group carries equal weight.
3. Whether group scores are normalised to a common range before weighting, and to what range.
4. How a group with no responses is handled. A variant may collect Audience responses and no Comms responses, and the answer cannot be to treat the missing group as zero, because that would make an unreviewed variant score worse than a badly reviewed one.
5. Whether Content Score is computed per variant per role and then combined, or pooled first. PRD section 16 requires the dashboard to show both Content Score by variant and a breakdown by role, so both levels must be defined and must reconcile.

The test of a sufficient answer is that two people implementing it independently would produce the same number from the same responses.

### Q-4, Evidence Confidence thresholds

PRD section 11.2 describes Low, Medium and High qualitatively. High requires "enough feedback" per variant and "no obvious sample imbalance". None of these are numbers. The project overview already flagged this and said the boundary should be defined before build plan Task 8. It was not.

Cover: minimum responses per variant for Medium and for High, minimum responses per active role, what counts as sample imbalance expressed as a ratio, and whether the thresholds are fixed or configurable per study.

PRD section 28 item 5 lists configurability as an open question in its own right. Treat it as in scope here, because a threshold that might become configurable is designed differently from one that will not.

### Q-7, what counts as a strong score

PRD section 17 gives five recommendation statuses and four rules for producing them. Three terms in those rules are undefined: "strong" Content Score, "mixed" scores, and the dependency in rule 2 that chooses between Insufficient evidence and Recommended with caution. Rule 4 similarly offers two outputs without a rule for choosing between them.

As written, three of the five statuses cannot be produced reliably.

Cover: numeric thresholds for strong and mixed, and a deterministic rule for each paired output, such that the same inputs always produce the same status.

---

## 5. Scope boundary

Out of scope, and to be left alone even if the answer seems obvious:

**Q-5**, whether participant relevance and response quality are automated, manual or dropped. It affects Evidence Confidence but is a separate decision about researcher workload.

**Q-6**, what happens to a risk gate when its only respondent role is disabled.

**Q-1**, which of the six gates are critical.

Q-6 and Q-1 both feed the recommendation status logic in Q-7. Where an answer to Q-7 depends on them, state the dependency explicitly and give the answer conditionally. Do not resolve them. A conditional answer that names its dependency is useful; a confident answer that quietly assumed one is not.

---

## 6. Deliverable

One document at `harness-docs/scoring-options.md`.

Structure it as four sections matching Q-2, Q-3, Q-4 and Q-7. Each section contains the options, the trade-offs, a recommendation with reasoning, and the knock-on effects on the other three questions.

Close with a short section listing the dependencies on Q-1, Q-5 and Q-6, and what changes if each is answered one way rather than another.

Worked examples are more convincing than prose here. A short table showing how a specific set of responses becomes a specific Content Score would demonstrate that the calculation is complete, and would expose a gap faster than any amount of description.

---

## 7. Acceptance criteria

1. `harness-docs/scoring-options.md` exists and has four sections corresponding to Q-2, Q-3, Q-4 and Q-7.
2. Each section gives at least two realistic options, not one option and a straw man.
3. Each section gives a recommendation and states why the alternatives were not preferred.
4. Q-3 includes a worked example in which a stated set of participant responses produces a stated Content Score, with every intermediate step shown.
5. Q-3 explicitly states how a group with no responses is handled, and the answer is not to treat it as zero.
6. Q-4 gives numbers, not adjectives.
7. Q-7 gives a deterministic rule for each of the five statuses, such that no input produces two possible outputs.
8. Dependencies on Q-1, Q-5 and Q-6 are named where they exist, and no answer silently assumes a resolution to any of them.
9. The default weights used anywhere in the document are 40, 35 and 25, never the superseded 35, 30, 20 and 15.
10. No product decision is presented as settled. Every recommendation is framed as a recommendation.
11. No file outside `harness-docs/scoring-options.md` is modified.

---

## 8. Notes for the Planner

This brief asks for one document. Whether that is one task or several is your judgement, but the four questions interlock and splitting them risks producing an inconsistent set, which is the failure this task exists to prevent.

If you conclude that a question cannot be analysed without first resolving Q-1, Q-5 or Q-6, say so and stop rather than planning around it.

The expected outcome is a plan, not a document. Write it to `artifacts/plans/` and stop for approval.
