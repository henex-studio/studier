# Tone Test Scoring System Explanation

## 1. Document purpose

This document explains the rationale behind the Tone Test scoring system. It combines the earlier weighting discussion with the later clarification about Evidence Confidence. The goal is to make the scoring model easier to explain to stakeholders, developers, researchers, and agency reviewers.

Tone Test is designed as a lightweight Studier study type for sensitive wording decisions. It supports human judgement by collecting structured feedback from different roles. It does not replace formal policy, legal, operational, privacy, comms, or accessibility approval.

## 2. Why Tone Test needs a scoring model

Tone Test compares two to four wording variants. The team needs a way to understand which wording option is clearer, safer, more publishable, and better suited to the content goal.

A scoring model helps by turning role-based feedback into a structured summary. It does not remove the need for human judgement. Instead, it helps the team make the judgement more transparent and easier to explain.

The scoring model is needed because sensitive wording decisions usually involve several questions at the same time:

1. Does the intended audience understand the message?
2. Does the audience know what to do next?
3. Does the wording feel respectful and supportive?
4. Does the wording fit the agency tone and policy position?
5. Does the wording avoid overpromising what the agency can deliver?
6. Is the wording plain, readable, accessible, and suitable for digital content?
7. Is there enough evidence to trust the result?
8. Did any wording option fail a critical risk gate?

These questions are related, but they are not the same. Tone Test therefore separates content performance, evidence confidence, and risk gate status.

## 3. Original scoring model discussed

The first proposed model used four weighted groups:

1. Audience Evidence Score, 35%.
2. Comms and Policy Assurance Score, 30%.
3. Plain Language and Accessibility Score, 20%.
4. Evidence Confidence Score, 15%.

This model was useful as an early concept because it made all four important factors visible. It also showed that the tool should not only ask whether users like a message. It should also consider agency assurance, plain language, accessibility, and the strength of the evidence.

However, the later discussion identified one issue: Evidence Confidence is different from the other three groups. Audience, agency, and accessibility scores evaluate the wording itself. Evidence Confidence evaluates whether the test result is strong enough to rely on.

For that reason, the recommended model was refined.

## 4. Recommended MVP scoring model

The recommended MVP model separates the scoring system into three layers:

1. Content Score.
2. Evidence Confidence.
3. Risk Gate Status.

This separation makes the dashboard easier to explain.

Content Score tells the team how the wording performed.

Evidence Confidence tells the team how much they can trust the result.

Risk Gate Status tells the team whether the wording is safe to recommend.

## 5. Content Score

Content Score should be the main weighted score in MVP. It evaluates how well each wording variant performs across the active review perspectives.

The recommended default Content Score weighting is:

1. Audience Evidence, 40%.
2. Comms and Policy Assurance, 35%.
3. Plain Language and Accessibility, 25%.

These weights total 100%.

### 5.1 Why Audience Evidence is weighted at 40%

Audience Evidence receives the largest default weight because the content must work for the people who need to use it. If a message is accurate but users do not understand it, trust it, or know what to do next, it has not worked as service content.

For sensitive content such as victim information, audience understanding is especially important. The wording must be clear, respectful, supportive, and actionable. The user may be stressed, uncertain, or looking for urgent help. The content must reduce confusion, not increase it.

Audience Evidence should usually measure:

1. Clarity.
2. Next-step understanding.
3. Trust.
4. Respect.
5. Supportiveness.
6. Whether the wording avoids blame.
7. Open comments about helpful, unclear, or uncomfortable wording.

The reason it is not weighted higher than 40% is that audience preference cannot override policy, safety, or operational limits. A version may feel reassuring to users but still promise more than the agency can deliver. Therefore, Audience Evidence is the largest group, but it does not dominate the whole model.

### 5.2 Why Comms and Policy Assurance is weighted at 35%

Comms and Policy Assurance receives a high weight because government wording must be publishable and responsible. A message needs to fit the agency tone, current policy position, operational reality, and service boundaries.

This is especially important when advisors are writing content for an agency they do not belong to. The advisor may understand the user need, but the agency is still responsible for policy accuracy, tone, operational commitments, and publication risk.

Comms and Policy Assurance should usually measure:

1. Agency tone fit.
2. Policy fit.
3. Operational accuracy.
4. Whether the wording overpromises.
5. Whether the wording is suitable for publication review.
6. Whether the wording supports the content goal.
7. Reviewer comments explaining what must change and why.

The reason it is weighted slightly below Audience Evidence is that Tone Test is a research support tool, not a formal approval workflow. Agency assurance is essential, but the purpose of the tool is to combine agency judgement with audience evidence and content quality evidence.

### 5.3 Why Plain Language and Accessibility is weighted at 25%

Plain Language and Accessibility receives 25% because wording must be easy to find, understand, scan, and use. This is not only a writing preference. It is part of making digital content usable for people with different literacy levels, cognitive needs, devices, and access needs.

This score group should usually measure:

1. Plain language.
2. Short and clear wording.
3. Logical structure.
4. Scanability.
5. Avoidance of unnecessary jargon.
6. Cognitive load.
7. Suitability for mobile and assistive technology contexts.
8. Accessibility and readability concerns.

The reason it is weighted at 25% is that plain language and accessibility are essential, but they are not the only decision factors. A message can be very clear but still create policy or safety risk. Likewise, a message can be policy accurate but too hard for users to understand. The 25% weighting ensures this review stream has meaningful influence without replacing audience and agency review.

## 6. Why weights should be configurable

The default Content Score weighting gives teams a starting point:

1. Audience Evidence, 40%.
2. Comms and Policy Assurance, 35%.
3. Plain Language and Accessibility, 25%.

However, Tone Test should allow creators to adjust these weights at study level.

Study-level scoring means the creator sets one scoring model for the whole Tone Test. The same model is then applied to every wording variant in that study. This makes comparison fair because Version A, Version B, and Version C are evaluated using the same weighting logic.

Weights should be configurable because different studies have different risk profiles. For example:

1. A high-sensitivity victim information test may give more weight to Comms and Policy Assurance.
2. A plain language rewrite test may give more weight to Plain Language and Accessibility.
3. An early audience comprehension test may give more weight to Audience Evidence.

If a role is disabled, the creator must redistribute the weights so the total remains 100%. For example, if Plain Language and Accessibility is disabled, its 25% cannot remain in the score. The creator must move that weight to the remaining active score groups.

The tool should show a live total and prevent publishing unless the active weights total 100%.

## 7. Evidence Confidence

Evidence Confidence should be shown separately from Content Score in the MVP.

Evidence Confidence does not evaluate the wording itself. It evaluates whether the evidence collected in the test is strong enough to support a recommendation.

This distinction is important. A wording variant may receive a high Content Score, but if only two people responded, or if a key reviewer role is missing, the result should not be treated as strong evidence.

Evidence Confidence answers a different question:

How reliable is this result?

### 7.1 Why Evidence Confidence was originally set at 15%

The earlier model gave Evidence Confidence a default weight of 15%. This was a reasonable early estimate because evidence quality is important but should not dominate the scoring model.

The logic behind 15% was:

1. Evidence quality must be visible.
2. Weak evidence should reduce confidence in the recommendation.
3. Evidence quality should not be treated as the same thing as wording quality.
4. The tool should stay lightweight and not become a complex research validation system.

A lower value such as 5% would make evidence quality too easy to ignore. A higher value such as 20% or more could make the scoring model feel too research-heavy for an MVP.

However, after reviewing the logic, the stronger recommendation is to remove Evidence Confidence from the weighted Content Score and display it as a separate label.

### 7.2 Recommended Evidence Confidence model

The MVP should display Evidence Confidence as:

1. Low.
2. Medium.
3. High.

This is clearer than mixing it into the Content Score.

Suggested interpretation:

High confidence means:

1. All active roles have responses.
2. Each wording variant has enough feedback.
3. Key reviewers participated.
4. Open comments include useful explanations.
5. There is no obvious sample imbalance.

Medium confidence means:

1. Most active roles have responses.
2. Some variants may have fewer responses.
3. Some open comments are useful.
4. The result can support an initial judgement, but should be used with caution.

Low confidence means:

1. A key role is missing.
2. Response numbers are very low.
3. Feedback quality is thin.
4. The result should be treated as an early signal, not a recommendation.

### 7.3 What Evidence Confidence should assess

Evidence Confidence can be based on four factors:

1. Role coverage.
2. Participant relevance.
3. Response volume.
4. Response quality.

Role coverage checks whether the active roles have participated. If the study enables Audience, Comms and Policy, and Plain Language and Accessibility, but only Audience responses are collected, confidence should be lower.

Participant relevance checks whether the participants match the role they selected. For example, an agency reviewer should be someone who can reasonably comment on tone, policy, or operational boundaries.

Response volume checks whether enough people responded to each variant. If one version has many responses and another has very few, comparison is weaker.

Response quality checks whether participants gave useful comments, not just ratings. Tone Test relies on comments to explain why wording is helpful, unclear, risky, or uncomfortable.

Some parts can be calculated automatically, such as response count and role coverage. Other parts may need researcher judgement, such as whether reviewers were the right people.

## 8. Risk Gate Status

Risk Gate Status should also be separate from Content Score.

Risk gates are safeguards. They prevent a high-scoring wording version from being recommended if it creates unacceptable risk.

The MVP risk gates are:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Harm, blame, and stigma.
5. Privacy and consent.
6. Accessibility and readability.

Each gate should use:

1. Pass.
2. Concern.
3. Fail.

If a critical risk gate is marked Fail for a wording variant, the variant should be shown as Not recommended until revised, even if its Content Score is high.

This is important because a version can perform well with users but still be unsafe or unpublishable. For example, a version may make users feel reassured by saying the agency will keep them safe, but that wording may overpromise what the agency can guarantee.

## 9. Final recommendation logic

The final dashboard should not simply show a winner. It should combine three pieces of information:

1. Content Score.
2. Evidence Confidence.
3. Risk Gate Status.

Recommended wording:

1. Recommended for review.
2. Recommended with caution.
3. Needs revision.
4. Not recommended until revised.
5. Insufficient evidence.

Suggested logic:

If any critical risk gate fails, the status should be Not recommended until revised.

If Evidence Confidence is Low, the status should be Insufficient evidence or Recommended with caution, depending on the risk gate result and content score.

If Content Score is strong, Evidence Confidence is Medium or High, and no critical gate fails, the status can be Recommended for review.

If scores are mixed or one or more gates show Concern, the status should be Needs revision or Recommended with caution.

This keeps the tool aligned with human decision-making. The tool helps the team understand the evidence. It does not make the final publication decision.

## 10. Recommended MVP dashboard language

The dashboard should explain the scoring system in plain language.

Suggested dashboard explanation:

Content Score shows how each wording version performed across audience evidence, agency assurance, and plain language and accessibility review.

Evidence Confidence shows how reliable the result is, based on role coverage, response volume, participant relevance, and response quality.

Risk Gates show whether a wording version has policy, safety, privacy, operational, or accessibility concerns that must be addressed before it can be recommended.

Scores support research judgement. They do not replace formal approval.

## 11. Summary of the recommended scoring system

The recommended MVP scoring system is:

### Content Score

Weighted and configurable at study level.

Default weights:

1. Audience Evidence, 40%.
2. Comms and Policy Assurance, 35%.
3. Plain Language and Accessibility, 25%.

### Evidence Confidence

Shown separately as Low, Medium, or High.

Based on:

1. Role coverage.
2. Participant relevance.
3. Response volume.
4. Response quality.

### Risk Gate Status

Shown separately as Pass, Concern, or Fail.

Critical gate failure overrides high scores.

### Final recommendation

Generated from Content Score, Evidence Confidence, and Risk Gate Status.

The aim is not to automate approval. The aim is to help the team explain which wording version is clearer, safer, more publishable, and why.

## 12. Recommended PRD update

The current PRD should be updated to reflect this refined model.

Recommended change:

Evidence Confidence should not be part of the weighted Content Score in MVP. It should be shown separately as Low, Medium, or High. The configurable study-level weighting should apply only to the three Content Score groups: Audience Evidence, Comms and Policy Assurance, and Plain Language and Accessibility.

This update will make the scoring model easier to explain and less likely to be misunderstood by stakeholders or developers.
