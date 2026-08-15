# Tone Test Scoring Options Analysis

**Date:** 3 August 2026
**Purpose:** Present options, trade-offs and recommendations for four open scoring questions (Q-2, Q-3, Q-4, Q-7) that together define the entire Tone Test scoring computation. This document does not settle any product decision. Each recommendation is offered for the operator to accept, modify or reject.
**Companion documents:** `Work/Harness/projects/studier/harness-docs/open-questions.md`, `Work/Harness/projects/studier/harness-docs/decision-log.md`
**Blocking status:** Q-2 blocks Tasks 2, 14, 15. Q-3 blocks Tasks 15, 16, 17. Q-4 blocks Tasks 8, 15. Q-7 blocks Task 16.

---

## How to read this document

The four questions are interlocked. Q-2 determines the numeric range a rating can take, which is an input to Q-3. Q-3 determines what the Content Score value space looks like, which is an input to Q-7. Q-4 determines when Evidence Confidence is High or Medium, which is also an input to Q-7. The closing section names the additional dependencies on Q-1, Q-5 and Q-6 that the Q-4 and Q-7 recommendations cannot fully resolve without operator answers to those three questions.

Each section presents the viable options in enough detail that two implementers reading independently would produce the same code. A recommendation is given for each; the reasoning states why the alternatives were not preferred rather than simply asserting a preference.

---

## Q-2. Rating Scale

### Background

Every rating question in PRD section 14 is written as an agreement statement. The Audience question "This message is clear" and the Comms question "This message is accurate" both require the participant to indicate their level of agreement with a proposition. The schema field `response_value` in `tone_responses` cannot be typed without knowing the numeric range, and the Content Score computation (Q-3) cannot be written without knowing how those numbers map to a scale.

PRD section 23 adds a mobile constraint: rating labels must be accessible on small screens, which limits the space available for endpoint descriptors and constrains the practical point count. S-2.6 records a comparability risk if question wording is editable at study level rather than locked at platform level. That risk is directly relevant to whether the scale lives in the question template or at study level, as noted below.

### Required attributes

This section covers all five required attributes: point count, endpoint labels, presence of a midpoint, presence of a not-applicable or prefer-not-to-say option, and whether the scale is identical across all three roles.

---

### Attribute 1. Point count

**Option A. Five points.**

A five-point scale (1 to 5) is the most common format for agreement statements of this kind. It provides enough spread to distinguish strong agreement from mild agreement and from mild disagreement, while keeping the cognitive load low for participants who are not research specialists. The scale maps cleanly to whole numbers with a true midpoint at 3.

The main limitation is reduced variance: with five points, a group of ten participants can produce only a narrow range of possible group means. If all responses cluster at 4 or 5, the resulting Content Score separates variants less clearly.

**Option B. Seven points.**

A seven-point scale (1 to 7) is commonly used in validated survey instruments and produces more spread in response distributions. It reduces ceiling effects when most participants rate favourably. The trade-off is slightly higher cognitive load and wider labels that are harder to display on narrow mobile screens.

**Option C. Six points.**

A six-point scale (1 to 6) eliminates the neutral midpoint by making only even-sided choices available. This forces participants to lean one way or another. It is occasionally used in contexts where neutrality is considered uninformative. The disadvantage is that it is less familiar and may confuse participants who expect a centre option.

**Recommendation:** Option A, five points.

A five-point scale is widely familiar, requires no instruction, fits mobile width when the endpoint labels are kept short, and maps naturally to the normalised 0 to 100 Content Score calculation described in Q-3. The reduced variance at the high end is a real limitation, but it is less significant than the cognitive cost of seven points for a mixed audience that includes non-specialist Audience participants alongside experienced reviewers.

---

### Attribute 2. Endpoint labels

**Option A. Strongly disagree / Strongly agree.**

This pairing is standard for Likert-format agreement questions. "Strongly agree" and "Strongly disagree" carry an intuitive meaning for most participants. The word "strongly" anchors the endpoints as expressions of intensity rather than simple binary choices.

**Option B. Disagree / Agree.**

Shorter labels fit narrow screens more easily and eliminate the intensity qualifier. The risk is that participants may interpret the midpoint as "I am not sure" rather than "I feel neither way", which changes the meaning of neutral responses.

**Option C. Does not apply / Applies completely.**

An alternative framing that avoids the agreement construct and instead asks participants to rate applicability. Better suited to objective questions such as "plain language" assessments where the question is not about the participant's feeling but about a quality of the wording. The weakness is that it does not match the intent of the Audience questions, which are explicitly about participant experience.

**Recommendation:** Option A, "Strongly disagree" at 1 and "Strongly agree" at 5.

This matches the agreement statement format of all questions in PRD section 14 and gives participants a conventional framing that requires no explanation. The labels should be abbreviated on mobile to "Strongly disagree" and "Strongly agree" displayed as multi-line if needed, not reduced further, because losing the "strongly" qualifier changes the meaning of the endpoints.

---

### Attribute 3. Presence of a midpoint

**Option A. Include a midpoint (scale point 3, labelled "Neither agree nor disagree").**

With five points, the midpoint at 3 allows participants to express genuine neutrality. This is particularly relevant for Audience participants who may simply not have a strong reaction to a question such as "This message feels supportive." Forcing them to lean to one side when they have no view introduces response bias.

**Option B. Omit the midpoint (use an even-numbered scale such as six or four points).**

Forcing choice produces distributions with less clustering at the centre. However, it introduces acquiescence bias and is less familiar to participants.

**Recommendation:** Option A, include a midpoint at point 3.

The questions are largely experiential or evaluative, and genuine neutrality is a meaningful response in context. Removing the midpoint is a research design choice that should belong to the study creator rather than be fixed by the platform. Combined with the recommendation to use five points, this means point 3 is the centre.

---

### Attribute 4. Not-applicable or prefer-not-to-say option

**Option A. Include a separate not-applicable option, coded as null.**

Some rating questions may not be answerable by all participants in all contexts. A Plain Language reviewer being asked about a concept they are not familiar with, or an Audience participant who did not engage with a particular aspect of the wording, may have no genuine basis to rate. Providing a null option prevents forced response on an irrelevant dimension and avoids introducing noise into group scores.

The implementation consequence is significant. A null response must be excluded from the group mean calculation rather than treated as 0 or as the midpoint. If the group score calculation (Q-3) treats null as zero, every question with one null response would pull the group mean toward the scale floor. This is the same problem as treating a missing role as zero, which Q-3 is required to handle correctly. The Q-3 recommendation below requires that null values be excluded from the denominator as well as the numerator.

**Option B. Omit not-applicable and require a rating on every question.**

Making all rating questions required eliminates the null case from the Content Score calculation, simplifying the arithmetic. The cost is that participants who genuinely cannot evaluate a question are forced to choose a number that has no meaning, which is a validity risk.

**Option C. Make all questions optional, with no label.**

Allowing any question to be skipped without a designated option creates the same null handling requirement as Option A without the user experience signal that tells the participant why they are skipping.

**Recommendation:** Option A, include a "Not applicable" option coded as null.

The participant experience benefit is material, particularly for non-specialist Audience participants who may encounter questions such as "This message does not make me feel blamed" in contexts where the concept is not salient to them. The null handling must be built into the Content Score calculation from the start; retrofitting it later would require recalculating stored scores. The Q-3 recommendation below accounts for this.

---

### Attribute 5. Scale consistency across roles

**Option A. The same scale applies to all three roles.**

All rating questions across Audience, Comms and Policy Reviewer, and Plain Language and Accessibility Reviewer use the same point count, labels and midpoint. This makes response values directly comparable in the database and simplifies the Content Score calculation.

**Option B. Role-specific scales.**

Different roles might use different point counts, for example a seven-point scale for specialist reviewers and a five-point scale for Audience. This could capture the greater discrimination that experienced reviewers can apply. The implementation cost is significant: each rating must be normalised before any cross-role calculation, and the schema must carry the scale metadata alongside each response.

**Recommendation:** Option A, one uniform scale for all roles.

Cross-role score aggregation becomes arithmetically fragile when scales differ, particularly when a role has only two or three respondents. A consistent scale means the normalised score range in Q-3 is the same for every question regardless of role. S-2.6 notes the comparability risk if question wording is editable at study level; a second dimension of variability in the scale itself would compound that risk.

**PRD section 23 mobile constraint note.** The five-point scale with "Strongly disagree" to "Strongly agree" endpoints is achievable on mobile using a horizontal button group or segmented control with abbreviated numerical labels (1 to 5) and the full endpoint labels displayed above or below the control. PRD section 23 requires that rating labels be accessible, not that they be identical in layout across screen sizes. The implementation must ensure the labels are programmatically associated with each control point.

**S-2.6 comparability risk note.** S-2.6 records that creators may edit question wording, and PLAN Task 6 Risk 1 flags that this is guidance rather than a constraint. If question wording changes substantially, comparison of response values across studies becomes unreliable. The comparability risk is reduced, not eliminated, by locking the scale at the platform level. The recommendation is that scale definition (point count, labels, midpoint presence, not-applicable handling) is platform-level configuration and is not editable by creators, even if question wording is. This keeps `response_value` directly comparable across studies that share the same question intent.

---

## Q-3. Content Score Computation

### Background

S-4.2 gives the group weights: Audience Evidence 40%, Comms and Policy Assurance 35%, Plain Language and Accessibility 25%. Nothing in any source document states how individual ratings within a group combine into a group score, whether scores are normalised before weighting, or how a variant with responses from only one or two roles is handled. PRD section 16 requires the dashboard to show both Content Score by variant and score breakdown by role; the calculation must therefore be defined at both levels and must reconcile between them.

This section presents a complete computation procedure, states how missing groups are handled, includes a worked example, and considers the per-variant and per-role views.

---

### Core computation question

**Option A. Mean of ratings within each group, normalised to 0-100, then weighted and summed.**

For each role group, compute the mean of all non-null rating responses submitted for that group. Because ratings use a 1 to 5 scale, normalise each group mean to a 0 to 100 range using the formula:

    group_score = (mean_rating - 1) / (max_rating - 1) * 100

where max_rating is 5. This converts a mean rating of 1.0 to a group score of 0 and a mean rating of 5.0 to a group score of 100, with the midpoint mean of 3.0 mapping to 50.

The Content Score for a variant is then:

    content_score = sum over active groups of (group_score * group_weight / 100)

This produces a Content Score in the range 0 to 100.

This approach treats every rating question within a group as equally weighted. It is simple to explain, simple to audit and produces a number in a familiar range.

The main limitation is that equal within-group weighting may not reflect the relative importance of different questions. For example, within the Audience group, "This message is clear" and "I trust this information" carry the same weight. If the study creator views clarity as more important than trust, the computation does not reflect this.

**Option B. Configurable per-question weights within each group.**

Each question carries its own weight within its group. The group score is a weighted mean rather than a simple mean. This gives creators more control and produces a more granular result.

The costs are significant for an MVP. The Builder must expose per-question weight configuration, which is additional UI surface. The weight-to-100 constraint applies at the group level as well as the study level, multiplying the redistribution complexity described in S-4.7. The number of parameters requiring operator input grows substantially. PRD section 7.6 lists complex statistical modelling as a non-goal.

**Option C. Ordinal position mapping (e.g. 1=0, 2=25, 3=50, 4=75, 5=100) rather than linear normalisation.**

Assigning fixed percentages to each scale point rather than using linear normalisation avoids the (n - 1) / (max - 1) formula. The result is numerically equivalent to Option A for all five points on a five-point scale. This form is more explicit but does not change the computation.

**Recommendation:** Option A, mean of non-null ratings normalised linearly to 0-100, then weighted and summed.

Option B introduces builder complexity that PRD section 7.6 explicitly excludes. Option C is equivalent to Option A and adds no benefit. Option A is the minimum viable computation that satisfies the requirements in PRD sections 11, 16 and the weights in S-4.2.

---

### Missing group handling

**Option A. Exclude groups with no responses from the Content Score calculation, and redistribute the computation proportionally.**

If a variant receives no responses from a role group, exclude that group from the weighted sum and redistribute its weight proportionally across the remaining groups. The redistribution uses:

    adjusted_weight(group_i) = group_weight(group_i) / sum_of_active_group_weights

This means a variant with only Audience and Comms responses uses effective weights of 40/(40+35) and 35/(40+35), which is approximately 53.3% and 46.7%.

The resulting Content Score is still in the 0 to 100 range and reflects the evidence that exists rather than penalising the variant for missing evidence. The missing group is separately flagged in Evidence Confidence (Q-4), which is the correct layer for signalling incomplete coverage.

This is the **required handling** under Q-3. Treating the missing group as zero is explicitly excluded from this recommendation. A zero-group would pull every Content Score down proportionally to the configured weight of the absent group, meaning a variant with no Plain Language responses would systematically score up to 25 points below its actual performance on the evidence available. This misrepresents the wording quality of the variant and confounds the content evaluation with the evidence quality signal that belongs in Q-4.

**Option B. Treat a missing group as a group score of zero.**

This is excluded. It compounds Content Score and Evidence Confidence in the way that S-4.3 and S-4.4 explicitly sought to separate. It would make Content Score partly a function of who showed up rather than how they rated the wording.

**Option C. Block the Content Score calculation entirely when any active role group has no responses.**

This would produce no score at all until every active role has at least one response. In practice, responses from different role groups may arrive at very different rates. Blocking the score entirely removes a useful early signal for the study creator.

**Recommendation:** Option A, proportional redistribution of missing group weights, with the missing group flagged in Evidence Confidence.

This is the only option that keeps Content Score and Evidence Confidence as separate, non-redundant layers, which is the settled design principle from S-4.4.

---

### Per-variant and per-role levels

PRD section 16 requires the dashboard to show both Content Score by variant and score breakdown by role. These two views must be derived from the same underlying calculation.

The per-variant Content Score is computed as described above: group score for each role, normalised and weighted.

The per-role breakdown that the dashboard displays is the group score itself (the 0 to 100 value before weighting). This is the same number that enters the weighted sum. Displaying it as the role breakdown means the two views are consistent: the per-variant score is exactly the weighted sum of the displayed per-role scores, so a creator who understands the weight configuration can manually verify the arithmetic from the dashboard.

This requires that the dashboard display both the group score (0 to 100, one number per role per variant) and the group weight (the configured percentage) so that the relationship between the two is transparent.

---

### Worked example

This example shows every intermediate step. Assume:

- Variant A, three active roles, weights as per default: Audience Evidence 40%, Comms and Policy Assurance 35%, Plain Language and Accessibility 25%.
- Audience responses: six participants, ratings on six questions.
- Comms responses: two participants, ratings on five questions.
- Plain Language responses: no responses.
- Rating scale: 1 to 5.

**Step 1. Collect Audience ratings.**

The six questions per participant times six participants yields 36 possible rating slots. Suppose two participants used the "Not applicable" option on one question each; those two responses are null. Total non-null ratings: 34.

Suppose the sum of the 34 non-null ratings is 131.

Audience mean rating = 131 / 34 = 3.853 (rounded to three decimal places for this working).

**Step 2. Normalise Audience mean to group score.**

    Audience group score = (3.853 - 1) / (5 - 1) * 100 = (2.853 / 4) * 100 = 71.3

**Step 3. Collect Comms ratings.**

Two participants, five questions each, ten possible ratings. Suppose all ten are non-null.

Sum = 37.

Comms mean rating = 37 / 10 = 3.7.

**Step 4. Normalise Comms mean to group score.**

    Comms group score = (3.7 - 1) / 4 * 100 = (2.7 / 4) * 100 = 67.5

**Step 5. Handle missing Plain Language group.**

Plain Language has no responses. Exclude it. Redistribute its weight (25%) proportionally to the active groups.

Total active weight = 40 + 35 = 75.

Adjusted Audience weight = 40 / 75 = 53.33%.
Adjusted Comms weight = 35 / 75 = 46.67%.

**Step 6. Compute Content Score.**

    Content Score = (71.3 * 53.33 / 100) + (67.5 * 46.67 / 100)
                  = 38.02 + 31.50
                  = 69.5 (rounded to one decimal place)

**Step 7. Dashboard display of per-role breakdown.**

The dashboard shows:

| Role | Group Score | Configured Weight | Effective Weight |
|---|---|---|---|
| Audience Evidence | 71.3 | 40% | 53.3% |
| Comms and Policy Assurance | 67.5 | 35% | 46.7% |
| Plain Language and Accessibility | No responses | 25% | Excluded |

Content Score: 69.5

The effective weights are displayed to show why the score is not simply 71.3 * 0.4 + 67.5 * 0.35. This transparency is important because study creators will notice the discrepancy if the display does not explain it.

**Verification check.** The per-variant Content Score of 69.5 equals the weighted sum of the displayed per-role group scores using the effective weights. The two views reconcile.

---

### Effect of scale choice on this computation

If the Q-2 recommendation (five-point scale) is not adopted and a seven-point scale is used instead, the normalisation formula changes to:

    group_score = (mean_rating - 1) / (7 - 1) * 100

The rest of the computation is unchanged. The max_rating parameter in the formula must be derived from the configured scale rather than hardcoded. This is a design requirement regardless of which point count is chosen.

---

## Q-4. Evidence Confidence Thresholds

### Background

S-4.4 settles that Evidence Confidence is displayed separately as Low, Medium or High. S-4.5 settles that it is based on four factors: role coverage, participant relevance, response volume and response quality. S-6.4 settles that it is calculated at viewing time, not stored as a frozen value.

What is missing is any number. PRD section 11.2 and SCORE section 7.2 describe the three levels qualitatively. Q-4 in open-questions.md identifies specifically what is needed: minimum responses per variant for Medium and for High, minimum responses per active role, a sample imbalance ratio, and a stated position on whether thresholds are fixed or configurable.

This section provides those numbers as a recommendation. All proposed numbers are subject to operator decision. The recommendation also names where the Q-5 resolution (automation versus manual versus dropped) affects the calculation.

---

### Computable factors (role coverage, response volume)

Role coverage and response volume can be computed from stored data regardless of how Q-5 is resolved. These two factors form the basis of the Evidence Confidence calculation in all options.

**Option A. Threshold set 1 (more permissive).**

- High confidence: 5 or more non-null responses per active variant per role group, all active role groups have at least 3 responses, and no role group has fewer than half the responses of the group with the most responses.
- Medium confidence: 3 or more non-null responses per active variant in at least one role group, at least one active role group has any responses.
- Low confidence: fewer than 3 responses per variant across all groups, or only one role group has any responses when two or more are active.

Under this threshold set, a study with 5 Audience responses and 3 Comms responses and 5 Plain Language responses on each variant would achieve High confidence. A study with 3 Audience responses, 1 Comms response and 5 Plain Language responses would fall to Medium because the Comms group is below the per-role minimum, even though volume overall is reasonable.

Sample imbalance ratio: the ratio of the group with the fewest responses to the group with the most responses. High confidence requires this ratio to be 0.5 or greater across all active role groups. In the last example, 1/5 = 0.2, which is below 0.5, so the imbalance check fails.

**Option B. Threshold set 2 (more conservative).**

- High confidence: 8 or more non-null responses per active variant per role group, all active role groups have at least 5 responses, and the imbalance ratio is 0.6 or greater.
- Medium confidence: 4 or more non-null responses per active variant in each active role group that has responses, at least two active role groups have any responses.
- Low confidence: below Medium on any count, or only one active role group has any responses when two or more are configured.

Under this threshold set, a study needs a minimum of 8 participants per role to reach High. This is a stricter target that better suits studies being used to inform publication decisions.

**Option C. Threshold set 3 (per variant, not per role group).**

- High confidence: 12 or more total non-null responses per variant across all active role groups combined, with all active role groups contributing at least one response, and the per-role imbalance ratio at 0.5 or greater.
- Medium confidence: 6 or more total responses per variant, at least one active role group has responses.
- Low confidence: below 6 total responses per variant, or all responses come from a single role group when multiple are active.

This option simplifies the threshold to a total per-variant count rather than a per-role count. It is easier to communicate to study creators but less sensitive to role-specific gaps. A study with 11 Audience responses and 1 Comms response per variant would pass the total count for Medium but would clearly have an imbalanced evidence base. The imbalance ratio check partially mitigates this, but the total-count approach is a weaker signal of role coverage than the per-role count.

**Recommendation:** Option A, threshold set 1.

Option A is achievable for the lightweight studies Tone Test is designed for, while still requiring meaningful representation from each active role. Option B requires 8 per role and may be appropriate for high-sensitivity tests but risks Low confidence being the chronic state for most MVP studies, which would make Evidence Confidence uninformative. Option C conflates role coverage with response volume in a way that partially reinstates the problem S-4.4 was designed to solve.

The proposed numeric thresholds from Option A, stated explicitly for implementation:

- **High confidence:** minimum 5 non-null responses per active role group per variant, imbalance ratio (minimum role group responses / maximum role group responses) of 0.5 or greater.
- **Medium confidence:** minimum 3 non-null responses in at least one active role group per variant; at least one active role group has responses for this variant.
- **Low confidence:** anything not meeting Medium. Specifically: fewer than 3 responses in every active role group, or zero responses for the variant entirely.

**Minimum responses per active role (dashboard display):** The system should display a warning when any active role group has fewer than 3 responses per variant. This does not block the dashboard but informs the creator.

**Sample imbalance ratio:** Defined as the count of the active role group with the fewest responses divided by the count of the active role group with the most responses for a given variant. A ratio below 0.5 downgrades High to Medium. A ratio below 0.2 downgrades Medium to Low.

---

### Whether thresholds are fixed or configurable (PRD section 28, item 5)

PRD section 28 item 5 explicitly lists this as an open question: "Should minimum response thresholds be configurable by study?"

**Option A. Fixed thresholds, not configurable per study.**

Simpler to implement and more consistent in how Evidence Confidence is communicated to creators. A creator cannot lower the threshold to achieve an easier High rating on a thin sample.

**Option B. Configurable per study, defaulting to the fixed values.**

Gives researchers who understand sampling the ability to raise thresholds for high-stakes studies. Requires a configuration field in `tone_test_settings` and UI in the Builder for setting custom thresholds. It also requires the Evidence Confidence calculation to read the per-study thresholds rather than constants, which adds query complexity.

**Recommendation on thresholds configurability:** This is an operator decision that PRD section 28 leaves explicitly open. The recommendation is that thresholds are fixed in MVP. The `evidence_confidence_settings_json` column in `tone_test_settings` (PRD section 19.2) provides a migration path if configurability is added later. A fixed MVP implementation should write the thresholds as named constants rather than literals so they can be made configurable in a later task without schema changes.

---

### Dependency on Q-5

Q-5 asks whether participant relevance and response quality are automated, manual or dropped. These are factors 2 and 4 from S-4.5. The recommendation above uses only factors 1 (role coverage) and 3 (response volume), because factors 2 and 4 are not computable from stored data.

Three cases:

1. If Q-5 resolves to "automate the two computable factors and drop the others", the thresholds above are complete as stated.
2. If Q-5 resolves to "add a researcher override with a required note", the Evidence Confidence calculation adds a manual adjustment layer on top of the automated score. The automated result becomes a floor, and the researcher can raise or lower it with a recorded justification. The threshold values above remain unchanged for the automated component.
3. If Q-5 resolves to "make Evidence Confidence entirely manual with the system showing supporting counts", the threshold values above become display-only guidance rather than automation rules. The stored Evidence Confidence value would be a researcher-entered field rather than a computed one, which changes S-6.4.

The implementation cannot be completed for factors 2 and 4 until Q-5 is answered. The recommendation is to implement factors 1 and 3 as described, make the Q-5 dependency explicit in code comments, and hold the factor 2 and 4 implementation until Q-5 is resolved.

---

## Q-7. Recommendation Statuses

### Background

PRD section 17 lists five recommendation statuses and four suggested rules. Three of the five statuses cannot currently be produced reliably because "strong" Content Score is undefined, and rules 2 and 4 each offer two possible outputs without a rule for choosing between them.

This section provides a deterministic rule for each of the five statuses such that no single input set can produce two different statuses.

The five statuses are: Recommended for review, Recommended with caution, Needs revision, Not recommended until revised, and Insufficient evidence.

The three inputs to the recommendation logic are:
- Content Score (0 to 100, or absent if no responses)
- Evidence Confidence (Low, Medium, High)
- Risk Gate Status for each gate (Pass, Concern, Fail), with a critical/non-critical designation per Q-1

The recommendation is computed per variant.

---

### Defining "strong" Content Score

This is the central gap in PRD section 17. Two options are presented.

**Option A. Fixed thresholds: strong is 70 or above, mixed is 50 to 69.9, weak is below 50.**

This three-band approach maps to the five statuses as follows. A Content Score of 70 or above is considered strong because it corresponds to a mean rating above 3.8 on the five-point scale, meaning the average response is meaningfully above neutral. A score of 50 corresponds exactly to the midpoint mean of 3.0, which is genuinely neutral. Between 50 and 70 the wording is performing above neutral but not clearly well. Below 50 the wording is on average below neutral.

These numbers are proposed rather than derived from validated research into Content Score interpretation. They are a reasonable starting point for a MVP tool.

**Option B. Creator-configurable threshold.**

The "strong" threshold is set per study by the creator, defaulting to 70. This mirrors the configurable weights in S-4.7. The advantage is flexibility; a high-sensitivity test might raise the threshold to 80. The disadvantage is that the recommendation status becomes incomparable across studies.

**Recommendation:** Option A, fixed thresholds (strong: 70 or above; mixed: 50 to 69.9; weak: below 50) as the MVP default.

The threshold configurability question is structurally similar to Q-4's threshold configurability question, and the same reasoning applies. Fixed thresholds in MVP, with named constants in the code to allow configurability later. This is an operator decision; these numbers are a recommendation.

---

### Deterministic rules for all five statuses

The following rules are evaluated in priority order. The first rule whose conditions are met produces the status. No input set reaches two rules.

**Rule 1. Not recommended until revised.**

Condition: any critical gate has a status of Fail for this variant.

Note: this rule depends on Q-1 (which gates are critical). Until Q-1 is answered, this rule cannot be implemented. If Q-1 is not answered before implementation begins, this status cannot be produced, and the dashboard must not claim to evaluate it.

If all six gates are non-critical, this status is never produced. If only some gates are critical, the rule fires only on those. The Q-7 logic itself is independent of which specific gates are critical; the gate criticality configuration is the Q-1 dependency.

**Rule 2. Insufficient evidence.**

Condition: Evidence Confidence is Low AND no critical gate has failed (which would have triggered Rule 1).

This is the status that says "we cannot draw a conclusion". It takes precedence over all positive statuses because recommending any wording when the evidence is thin creates the misleading appearance of support that S-1.2 is designed to prevent.

**Rule 3. Recommended for review.**

Condition: Content Score is 70 or above AND Evidence Confidence is Medium or High AND no gate has a status of Fail (critical or non-critical).

This is the strongest positive status. It is withheld if any gate failed, even a non-critical one, because a non-critical Fail still signals a concern that the team should address before publication. Whether non-critical Fail gates block this status is a specific operator decision embedded in this rule; the alternative is to allow Recommended for review when only non-critical gates fail.

**Rule 4. Recommended with caution.**

Condition: Content Score is 50 or above AND Evidence Confidence is Medium or High AND at least one gate has a status of Concern (but no gate has a status of Fail).

This status signals that the wording is performing reasonably well and the evidence base is adequate, but one or more gates carry concerns that require attention. It is distinct from Needs revision because the content score is in the positive range and the evidence is sufficient.

**Rule 5. Needs revision.**

Condition: Content Score is below 70 AND Evidence Confidence is Medium or High AND no gate has a status of Fail (which would have triggered Rule 1).

This includes the case where Content Score is mixed (50 to 69.9) with no gate concerns, where Content Score is weak (below 50) with no gate concerns, and where Content Score is in any range with one or more gates showing Concern but not Fail while Evidence Confidence is sufficient.

There is an overlap risk between Rule 4 and Rule 5 when a gate shows Concern. The priority order resolves it: a variant with Content Score 55 and one gate at Concern would match Rule 4 (score above 50, Evidence Confidence medium or high, concern but not fail) before reaching Rule 5. A variant with Content Score 45 and one gate at Concern does not match Rule 4 (score below 50) and falls to Rule 5. This is the intended distinction: a mixed score with a concern gets "recommended with caution" if it is in the upper half, and "needs revision" if it is in the lower half.

**Completeness check.** Every combination of inputs maps to exactly one rule.

| Content Score | Evidence | Gate status | Status produced |
|---|---|---|---|
| Any | Any | Any critical Fail | Not recommended until revised (Rule 1) |
| Any | Low | No critical Fail | Insufficient evidence (Rule 2) |
| 70+ | Medium or High | No Fail, no Concern | Recommended for review (Rule 3) |
| 70+ | Medium or High | Concern, no Fail | Recommended with caution (Rule 4) |
| 50-69.9 | Medium or High | No Fail, no Concern | Needs revision (Rule 5) |
| 50-69.9 | Medium or High | Concern, no Fail | Recommended with caution (Rule 4) |
| Below 50 | Medium or High | No Fail, any gate state | Needs revision (Rule 5) |
| No responses | N/A | N/A | Insufficient evidence (Rule 2, Evidence treated as Low) |

The "No responses" row requires clarification: if a variant has no responses at all, Evidence Confidence is Low by the Q-4 rules, which triggers Rule 2 before any content question arises.

**One remaining gap.** Rule 3 states "no gate has a status of Fail (critical or non-critical)." This means a non-critical Fail also prevents "Recommended for review". Whether this is intended, or whether non-critical Fail should allow a lower positive status while critical Fail produces Rule 1, is an operator decision. The rule as stated is conservative and explicit. An alternative formulation is given below if the operator prefers:

Alternative Rule 3: Condition is Content Score 70 or above AND Evidence Confidence Medium or High AND no critical gate has Fail (non-critical Fail is allowed).

Alternative Rule 4: Condition is Content Score 50 or above AND Evidence Confidence Medium or High AND no critical gate has Fail AND at least one gate has Concern or non-critical Fail.

Alternative Rule 5: Condition is any Content Score AND Evidence Confidence Medium or High AND no critical gate has Fail AND Content Score is below 70 with no Concern or non-critical Fail, or Content Score below 50 in any gate state without critical Fail.

Either formulation is deterministic. The operator should choose one before implementation.

---

### Dependency on Q-1

The "Not recommended until revised" status (Rule 1) cannot be produced until Q-1 designates at least one gate as critical. If Q-1 is not answered and all gates are treated as non-critical, Rule 1 never fires. This is not an implementation error; it is the correct consequence of an unanswered product question. The implementation should read the `critical` field from `tone_risk_gates` rather than hardcoding any gate as critical, so that Q-1 can be answered in a migration rather than a code change.

### Dependency on Q-6

Q-6 asks what happens when a gate's only respondent role is disabled. If a role is disabled and its associated gates have no respondents, the gate status is neither Pass nor Concern nor Fail; it is absent. The recommendation logic above does not handle the absent gate state. An absent critical gate is ambiguous: it may mean the gate was evaluated (by someone) and implicitly passed, or it may mean it was never evaluated. These produce different recommendation statuses.

Until Q-6 is answered, the implementation should treat an absent gate as a distinct state (for example, "no data") and display it in the dashboard without converting it to Pass, Concern or Fail. The recommendation status engine should treat a variant with any absent gate as "Insufficient evidence" or display a warning alongside its status. The operator should specify the exact behaviour when answering Q-6.

---

## Closing section. Dependencies on Q-1, Q-5 and Q-6

### Q-1. Which gates are critical?

Q-1 is a blocker for Rule 1 of the recommendation logic. The effect on Q-4 and Q-7 of answering Q-1 one way rather than another:

If all six gates are critical, any single Fail from any single reviewer triggers "Not recommended until revised" for that variant. This is the strictest possible interpretation. With two reviewers in the Comms role and one strong dissenter, one Fail on Policy accuracy would block a variant regardless of how all other reviewers rated it. The practical effect may be that "Not recommended until revised" becomes the default state for any variant that has a reviewer who disagrees with any aspect, which could make the tool overly conservative for exploratory testing.

If only two or three gates are critical, the remaining gates produce Concern or Fail without triggering Rule 1. Those non-critical Fails would feed into Rule 3 or Rule 4 as described above, producing "Recommended with caution" or "Needs revision" rather than the hard block. This is a more graduated response but requires the operator to accept that some failed gates are not blocking.

If Q-1 specifies that zero gates are critical, Rule 1 never fires and "Not recommended until revised" is never produced. The five statuses effectively collapse to four.

The Q-4 recommendation is unaffected by Q-1, since Evidence Confidence evaluates response quality and volume, not gate outcomes.

### Q-5. Participant relevance and response quality

Q-5 determines which of the four S-4.5 Evidence Confidence factors are automated. The effect on the Q-4 recommendation:

If Q-5 resolves to factors 1 and 3 only (role coverage and response volume automated, other two dropped), the thresholds in the Q-4 recommendation are complete as stated and the Evidence Confidence calculation is fully deterministic.

If Q-5 resolves to a researcher override, the automated Evidence Confidence calculation becomes a floor. A researcher can raise a Low result to Medium or High with a recorded justification. This introduces a manual step before the recommendation status engine runs. The thresholds in Q-4 remain unchanged for the automated component but the final Evidence Confidence value fed into Q-7 may differ from the automated result.

If Q-5 resolves to fully manual Evidence Confidence, the automated thresholds in Q-4 become guidance rather than rules. The Q-7 recommendation logic still accepts Low, Medium and High as its inputs, but the source of those values is human rather than computed. This changes S-6.4, which requires Evidence Confidence to reflect current response data at the time of viewing. A manually-set value would need a timestamp and a refresh prompt to remain consistent with S-6.4.

### Q-6. Gate coverage when a role is disabled

Q-6 affects Q-7 most directly. If a role is disabled and its gates have no respondents, the absent gate state described above must be handled. The effect of each possible resolution:

If Q-6 resolves to "an absent gate is treated as Pass", then disabling a role implicitly passes its gates. This means Rule 1 can never fire for those gates, and the variant may receive "Recommended for review" despite having no evaluation of those risk dimensions. This is the most permissive resolution and the one most likely to produce misleading dashboard results.

If Q-6 resolves to "an absent gate produces Insufficient evidence status", then disabling a role with critical gates associated triggers Rule 2, and the variant cannot receive any positive status. This is the most conservative resolution and may make single-role studies (which S-2.3 permits) produce only "Insufficient evidence" indefinitely.

If Q-6 resolves to "a warning is shown but the gate is excluded from the logic", the recommendation status engine operates on only the gates that have responses. This is behaviourally similar to the proportional redistribution in Q-3, where a missing group is excluded from the weighted sum. It is the most consistent approach with the broader design but requires a clear definition of whether the absent gate exclusion applies only to non-critical gates or also to critical gates.

The Q-7 implementation cannot be made safe until Q-6 is answered. The interim implementation should surface the absent gate state visibly rather than silently converting it.

---

## Glossary

**Content Score.** The weighted composite score (0 to 100) that combines group scores from each active reviewer role. It evaluates how well a wording variant performed across audience evidence, policy assurance and plain language perspectives. It does not include Evidence Confidence.

**Evidence Confidence.** A three-level label (Low, Medium, High) that indicates how much the test result can be trusted. It is based on role coverage, response volume, participant relevance and response quality. It is displayed separately from Content Score and is not part of the weighted computation.

**Risk Gate Status.** A Pass, Concern or Fail designation for each of the six fixed gates, answered by specific reviewer roles. A failed critical gate overrides a positive Content Score and produces the "Not recommended until revised" status.

**Group score.** The normalised 0 to 100 score for a single reviewer role group on a single variant, computed from the mean of non-null ratings before weighting. The Content Score is the weighted sum of group scores.

**Imbalance ratio.** For a given variant, the ratio of the active role group with the fewest responses to the active role group with the most responses. A ratio of 0.5 means the smallest group has half as many responses as the largest.

**Recommendation status.** One of five labels produced by the dashboard for each variant: Recommended for review, Recommended with caution, Needs revision, Not recommended until revised, or Insufficient evidence. Produced by evaluating Content Score, Evidence Confidence and Risk Gate Status in a defined priority order.

**Critical gate.** A risk gate designated as blocking, such that a Fail on that gate produces "Not recommended until revised" regardless of Content Score or Evidence Confidence. Which gates are critical is Q-1 in open-questions.md and is not decided.

**Absent gate.** A gate whose respondent role is disabled, meaning no participant answered it. Distinct from a gate that was answered and passed. How absent gates are treated is Q-6 in open-questions.md and is not decided.

**Normalisation.** The conversion of a mean rating on a 1 to 5 scale to a 0 to 100 range using the formula (mean - 1) / (max - 1) * 100. Allows ratings from different scale points to be compared and combined consistently.

**Likert scale.** A rating scale format that presents a statement and asks the respondent to indicate their level of agreement, typically from Strongly disagree to Strongly agree. All rating questions in PRD section 14 follow this format.

**Proportional redistribution.** The adjustment applied when one or more active role groups have no responses for a variant. The absent group's configured weight is distributed proportionally across the groups that do have responses, preserving the relative weighting among those groups.

**Role coverage.** Whether each active reviewer role has at least some responses for a given variant. A factor in Evidence Confidence. Full role coverage means all active roles have responses; partial coverage means at least one active role has no responses.

**Response volume.** The count of non-null rating responses submitted for a variant, either in total or per role group. A factor in Evidence Confidence, tracked separately from role coverage because a role group may have responses without having enough responses to support a confident result.

**Not-applicable response.** A participant's choice to indicate that a question does not apply to them, coded as null in the response record. Excluded from both the numerator and the denominator of the group mean calculation so that it does not pull the mean toward any end of the scale.

**Q-1, Q-2, Q-3, Q-4, Q-5, Q-6, Q-7.** Open questions numbered in harness-docs/open-questions.md (in the `Work/Harness/projects/studier` folder). Q-1 through Q-7 are referenced in this document as unresolved product decisions requiring operator input before the corresponding code can be written.
