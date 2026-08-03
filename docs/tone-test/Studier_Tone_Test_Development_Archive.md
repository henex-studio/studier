# Studier Future Extension Development Archive

## Document purpose

This archive summarises the product discussion about extending Studier beyond tree testing. It records the thinking process from early brainstorming through to the confirmed MVP direction for the new Tone Test study type and the generated PRD.

This document is intended as a development history record. It explains what options were discussed, what decisions were made, and why those decisions were made.

## Product baseline

Studier was treated as the baseline platform for this extension work. The current documented platform is Studier v3.07. It already supports tree test creation, Study Builder, public test links, participant response capture, preview, publishing, closing, clearing response data, CSV export, registration, consent, a Guide, version history, and Vercel Analytics support.

The existing product principle is that participants complete tests through public links without accounts, while internal creators manage studies after registration. Studier also already discourages collection of names, contact details, case details, and sensitive personal information.

## Phase 1, Initial brainstorming on expanding Studier

The discussion began with a broad question: what could be added to a tree testing platform to support more user testing methods?

Several possible expansion directions were identified:

1. IA and navigation testing, including card sorting, first click testing, navigation path comparison, and findability benchmarking.
2. Prototype and interface usability testing, including prototype task testing, click heatmaps, five second tests, and preference tests.
3. Content testing, including plain language testing, content comprehension testing, message testing, trust and confidence ratings, and tone testing.
4. Survey and mixed-method testing, including screeners, post-task questions, rating questions, and mixed study types.
5. Research operations features, including participant panels, recruitment links, consent records, quota management, and incentive tracking.
6. Reporting and analysis features, including task success dashboards, path analysis, segment comparison, insight tagging, evidence libraries, and report generation.
7. Governance and collaboration features, including study templates, review and approval workflows, version control, role-based access, and audit logs.

Three larger product positioning options were considered:

1. IA specialist tool, focused on information architecture methods.
2. Government service UX testing platform, focused on content, accessibility, privacy, evidence, and sensitive service experiences.
3. Lightweight research operations platform, focused on end-to-end research management.

The recommended strategic direction was to start from IA-adjacent and content-focused testing rather than jumping to a full research operations platform. This kept the scope close to Studier's current strengths while opening a more distinctive path for government and sensitive service content.

## Phase 2, Tone testing concept explored

Tone testing was then discussed in more detail. The working definition was:

Tone testing is a way to use real user feedback to check whether wording is clear, respectful, supportive, trustworthy, and action-oriented.

The key point was that tone testing is not simply a preference vote. It should test whether wording affects:

1. User understanding.
2. Emotional response.
3. Trust and confidence.
4. Next-step clarity.
5. Risk of blame, confusion, or unrealistic expectation.

The discussion focused especially on sensitive public service content, including victim information. In that context, wording must be clear and supportive, but also accurate, safe, and careful not to promise services or outcomes the organisation cannot deliver.

A basic tone testing workflow was proposed:

1. Define tone attributes.
2. Prepare two to four wording versions.
3. Create a realistic scenario.
4. Collect rating and open-text feedback.
5. Avoid order bias through randomisation or between-subjects testing.
6. Analyse scores, comprehension, risk signals, keywords, and segment differences.

The first possible product implementation was described as a new study type with a creator flow, participant flow, and results dashboard.

## Phase 3, Policy and operational confirmation became central

A key concern was raised: wording must go through policy and operational confirmation. This changed the concept from simple tone testing to a stronger model that combines public feedback with institutional assurance.

The recommended model became a dual validation approach:

1. Public or audience evidence shows whether people understand the wording, trust it, feel respected, and know what to do next.
2. Institutional assurance shows whether the wording is accurate, lawful, operationally realistic, publishable, and not overpromising.

The central principle was:

Public evidence tells us whether people understand, trust, and feel safe using the message. Institutional review tells us whether the message is accurate, lawful, operationally realistic, and publishable. The final result should combine both, with mandatory risk gates.

The scoring model originally proposed used four score groups:

1. Public Experience Score.
2. Institutional Assurance Score.
3. Content Quality Score.
4. Evidence Confidence Score.

It was also agreed that a high score should not automatically select a wording version. Risk gates must be used as mandatory safeguards. If a wording version fails a critical risk gate, it should not be recommended even if its average score is high.

The initial risk gates discussed were:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Harm and blame.
5. Privacy and consent.

This was later refined in the MVP to include accessibility and readability as a fixed gate.

## Phase 4, Three-stream model introduced

The discussion then moved from two participant streams to three streams. The concern was that plain language and accessibility should not be hidden inside comms or policy review.

The three streams became:

1. Audience stream, for intended users or proxy users.
2. Comms and Policy stream, for institutional decision makers and reviewers.
3. Plain Language and Accessibility stream, for content quality, readability, accessibility, and inclusion review.

This decision was made because each group is qualified to answer different questions:

1. Audience participants can speak to understanding, trust, respect, and next-step clarity.
2. Comms and policy reviewers can speak to publishability, policy alignment, operational accuracy, and overpromising.
3. Plain language and accessibility reviewers can speak to readability, structure, jargon, cognitive load, and accessibility-related content quality.

The key principle was that one group should not be asked to answer questions outside its expertise. Audience participants should not judge policy fit. Institutional reviewers should not replace audience evidence. Accessibility and plain language checks should not be treated as a minor subcategory.

## Phase 5, Proposal page created

A web proposal page was created to help explain the concept to stakeholders. The page was named Tone And Assurance Testing Proposal.

The page presented the concept as a lightweight research tool for sensitive service wording. It explained the problem, the three-stream validation model, workflow, risk gates, scoring model, benefits, difference from existing tools, and recommended first pilot.

The proposal page used the working name Tone and Assurance Testing and positioned the method as a practical way to test sensitive service wording with the people who need it, the teams who must publish it, and the specialists who check plain language and accessibility.

The page was later converted into a standalone HTML file named tone-and-assurance-testing-proposal.html.

## Phase 6, Existing market considered

The market comparison showed that similar capabilities exist in separate categories, but not in the same focused combination.

Existing UX research platforms can support methods such as surveys, preference tests, tree testing, card sorting, first click testing, five second testing, prototype testing, and A/B testing.

Plain language and accessibility tools can help with readability, structure, and accessibility checks.

However, the proposed opportunity was different because it combines:

1. Public understanding and trust testing.
2. Comms and policy assurance.
3. Plain language and accessibility review.
4. Risk gates.
5. A decision-oriented summary.
6. A workflow suitable for high-sensitivity government content.

The conclusion was that the opportunity is not to invent user testing from scratch, but to productise a lightweight, government-suitable wording decision workflow inside Studier.

## Phase 7, Return to Studier platform architecture

The discussion then returned to how this should fit into the existing Studier platform.

It was confirmed that the extension should be based on the current Studier platform rather than a separate product. The new function should become a new study type alongside Tree Test.

The proposed internal creator entry was:

1. User logs in.
2. User creates a new test.
3. User chooses a study type.
4. User selects Tree Test or Tone Test.

The participant model remains consistent with Studier:

1. Participants do not need accounts.
2. Participants open one public test link.
3. Participants read the welcome and privacy content.
4. Participants select a role.
5. The selected role determines which question set they see.
6. Responses are saved and summarised in the dashboard.

This decision reused Studier's existing lifecycle model: draft, preview, publish, public link, close, clear data, reuse, and export.

## Phase 8, Naming decision

Several names were discussed:

1. Tone and Assurance Testing.
2. Tone Assurance Test Tool.
3. Content Confidence Testing.
4. Sensitive Content Validation.
5. Tone Test.

The final MVP naming direction was to use the simpler name Tone Test.

The reason was that Tone Test is easier to understand as a study type label in Studier. The assurance concept remains in the workflow, questions, risk gates, and dashboard, but the interface name does not need to sound like a formal approval system.

The recommended product language became:

1. Study type label: Tone Test.
2. Page title: Create a Tone Test.
3. Description: Test wording with audience feedback, assurance review, and plain language checks.
4. Report wording: Tone and assurance summary.

## Phase 9, Role design decisions

The MVP role model was confirmed as three default roles:

1. Audience.
2. Comms and Policy Reviewer.
3. Plain Language and Accessibility Reviewer.

The following role decisions were made:

1. Roles are selected through the public test link, not through separate accounts.
2. There is no Other role in MVP.
3. Creators can enable or disable each default role.
4. At least one role must remain active.
5. Participants can change their role before starting role-specific questions.
6. Once a participant starts answering, the selected role should be locked for that session.

The reason for not adding Other was to keep reporting clean and avoid difficult-to-classify response data.

The reason for allowing role disabling was to keep the tool lightweight. Some tests may only need Audience and Comms, while high-sensitivity victim information testing should usually use all three streams.

## Phase 10, Variant testing decisions

It was agreed that one content decision may have at least three possible wording versions. MVP should therefore support two to four variants.

Two variant modes were confirmed:

1. Single variant random assignment.
2. Compare all variants.

Single variant random assignment means that the system randomly assigns one wording version to a participant session. The participant only sees that one version. This is closer to a real service experience because users usually see one version of a page, not multiple versions side by side.

Compare all variants means that each participant sees all wording versions. This is useful for smaller samples and direct comparison, but it behaves more like a preference test.

It was decided that compare all variants mode should randomise variant display order to reduce order bias.

It was also decided that compare all variants mode should include a final preference question:

Which version best supports the content goal?

Participants should also explain why they selected that version.

## Phase 11, Scoring and weighting decisions

The scoring model became a study-level scoring setup. This means the creator sets one scoring model for the whole Tone Test, and that same model is applied to every wording variant.

This was chosen so that Version A, Version B, and Version C are compared using the same scoring logic.

The default score groups were:

1. Audience Evidence Score.
2. Comms and Policy Assurance Score.
3. Plain Language and Accessibility Score.
4. Evidence Confidence Score.

The default weights discussed were:

1. Audience Evidence Score, 35%.
2. Comms and Policy Assurance Score, 30%.
3. Plain Language and Accessibility Score, 20%.
4. Evidence Confidence Score, 15%.

It was decided that researchers must be able to adjust weights in the Builder. The total must equal 100% before publishing.

If a role is disabled, the creator must redistribute the weight. For example, if Plain Language and Accessibility Reviewer is turned off, its 20% cannot remain in the scoring setup.

The reason for configurable weighting was that different studies may have different risk profiles. A high-sensitivity victim information test may need stronger institutional and accessibility weighting than a lower-risk content test.

It was also agreed that scores support research judgement. They do not replace formal approval.

## Phase 12, Risk gate decisions

The MVP uses six fixed risk gates:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Harm, blame, and stigma.
5. Privacy and consent.
6. Accessibility and readability.

Each gate uses three states:

1. Pass.
2. Concern.
3. Fail.

The core decision rule is:

If any critical risk gate is marked Fail for a variant, that variant should be shown as Not recommended until revised.

This was chosen because high-sensitivity content cannot be selected only by average score. A version may score well with an audience but still create safety, policy, privacy, or operational risks.

## Phase 13, Question template decisions

It was agreed that role-specific question templates should be provided by default.

Creators can edit the wording of questions. However, the core scoring dimensions should remain available so the dashboard can still produce consistent summaries.

The MVP default question areas are:

### Audience

1. Clarity.
2. Next-step understanding.
3. Respect.
4. Support.
5. Trust.
6. Not feeling blamed.
7. Open feedback on meaning, helpful wording, unclear wording, and likely next action.

### Comms and Policy Reviewer

1. Accuracy.
2. Suitability for publication review.
3. Policy or service position alignment.
4. Avoiding overpromising.
5. Support for the content goal.
6. Risk gate checks for policy accuracy, operational promise, safety risk, and privacy and consent.
7. Open comments on policy, operational, publication concerns, wording changes, and supporting evidence.

### Plain Language and Accessibility Reviewer

1. Plain language.
2. Scanability.
3. Avoiding unnecessary jargon.
4. Helpful structure.
5. Suitability for different literacy, cognitive, device, or accessibility needs.
6. Risk gate checks for accessibility and readability, harm, blame and stigma, and privacy and consent.
7. Open comments on readability, accessibility, and clearer wording.

## Phase 14, Dashboard and export decisions

The first dashboard should stay simple. Complex charts were explicitly excluded from MVP.

The MVP dashboard should show:

1. Total response count.
2. Response count by role.
3. Response count by variant.
4. Average score by variant.
5. Average score by role.
6. Risk gate summary by variant.
7. Preference result in compare all variants mode.
8. Open comments grouped by role and variant.
9. Recommendation status for each variant.
10. CSV export actions.

The dashboard should provide recommendation statuses, not final decisions. Suggested statuses are:

1. Recommended for review.
2. Needs revision.
3. Not recommended until revised.
4. Insufficient evidence.

The reason for this wording is that the tool supports content decisions but does not replace formal approval.

CSV export remains important because Studier's current strength includes exportable data for deeper analysis.

## Phase 15, AI rewrite feature discussed and deferred

AI automatic rewriting was discussed as a possible future enhancement.

Three levels were considered:

1. Level 1, AI rewrite helper.
2. Level 2, AI assisted risk review.
3. Level 3, AI rewrite plus scoring recommendation.

Level 1 would allow a creator to input source wording, choose a rewrite goal, and generate draft wording options such as more plain language, more supportive, more direct, or more cautious.

The estimated API token cost for small-scale Level 1 use was very low. The larger concerns were not direct cost, but privacy, governance, data handling, and risk of over-reliance on AI-generated wording.

The confirmed MVP decision was:

AI is not included in MVP.

AI rewrite suggestions should be listed as a future enhancement only. Any future AI feature must include privacy warnings, human review, source labelling, and controls to prevent names, contact details, case details, or sensitive personal information from being submitted to external AI services.

AI output must not be treated as policy, legal, operational, accessibility, or safety assurance.

## Phase 16, MVP scope confirmed

The confirmed MVP scope includes:

1. Tone Test as a new Studier study type.
2. Study type selection when creating a test.
3. Tone Test Builder.
4. Welcome, privacy, scenario, content goal, sensitivity level, and end message setup.
5. Two to four wording variants.
6. Two variant modes: single variant random assignment and compare all variants.
7. Three default roles.
8. Ability to enable or disable roles.
9. No Other role.
10. Role-specific question templates.
11. Editable question wording.
12. Study-level scoring weights.
13. Required weight redistribution when roles are disabled.
14. Six fixed risk gates.
15. Public test link with role selection.
16. Role lock after questions start.
17. Preview by role.
18. Publishing checks.
19. Simple dashboard.
20. CSV export.
21. Close, clear data, and reuse behaviour aligned with existing Studier patterns.

The confirmed MVP exclusions include:

1. AI rewrite suggestions.
2. Formal approval workflow.
3. Reviewer-only authentication.
4. Participant accounts.
5. Other role.
6. Complex statistical modelling.
7. Advanced charts.
8. Multi-round comparison dashboard.
9. Collection of personal, contact, case, or sensitive personal information.

## Phase 17, PRD generated

A PRD was generated with the filename:

Studier_Tone_Test_PRD.md

The PRD covers:

1. Product context.
2. Product summary.
3. Problem statement.
4. Goals and non-goals.
5. Primary users.
6. Study type model.
7. Confirmed MVP decisions.
8. Study-level scoring explanation.
9. Core user journeys.
10. Tone Test Builder requirements.
11. Default role questions.
12. Participant runner requirements.
13. Dashboard requirements.
14. Recommendation status logic.
15. CSV export requirements.
16. Data requirements.
17. Permissions and security requirements.
18. Publishing checks.
19. Privacy and safety requirements.
20. Accessibility requirements.
21. Success metrics.
22. Risks and mitigations.
23. Future enhancements.
24. AI future enhancement note.
25. Open questions for later phases.
26. MVP release note draft.

## Key product rationale summary

### Why a new study type

A new study type preserves the existing Tree Test workflow and avoids forcing tone testing logic into an IA testing model. Studier already supports study lifecycle and public response patterns, so the new feature can reuse the platform while keeping workflows clear.

### Why public link plus role selection

This follows Studier's existing participant model. Participants do not need accounts. The same public link can be shared with different groups, and the selected role controls the questions shown.

### Why three default roles

Sensitive content decisions require different evidence types. Audience evidence, institutional assurance, and plain language/accessibility review answer different questions and should not be merged too early.

### Why allow roles to be disabled

The tool needs to stay lightweight. Some tests may not need all three streams. High-sensitivity content should use all three, but simpler tests can reduce setup and review effort.

### Why no Other role

Other would make analysis harder and reduce dashboard clarity. For MVP, controlled role categories are better.

### Why support two variant modes

Single variant random assignment gives a more natural reading experience. Compare all variants supports smaller samples and direct comparison. Supporting both gives research flexibility without turning the tool into a full survey platform.

### Why configurable scoring weights

Different content decisions have different risk profiles. A fixed score model would be too rigid. Study-level weighting gives researchers control while preserving fair comparison across variants.

### Why risk gates

Scores alone are not safe enough for high-sensitivity content. A wording version can be popular but still unsafe, inaccurate, or unrealistic. Risk gates create non-negotiable safeguards.

### Why AI is excluded from MVP

AI rewrite support may be useful later, but it introduces privacy, governance, and accountability risks. The MVP should first prove the human-led testing workflow.

## Recommended next phase

The next recommended phase is to create an MVP build plan from the PRD. That plan should break the work into:

1. Database changes.
2. RLS policy changes.
3. Study type selection.
4. Tone Test Builder.
5. Public participant runner.
6. Role selection and role locking.
7. Variant assignment logic.
8. Scoring setup and publishing checks.
9. Dashboard summary.
10. CSV export.
11. Guide updates.
12. Testing checklist.

The build plan should preserve existing Tree Test functionality and minimise disruption to the current Studier v3.07 codebase.

## Files generated during this discussion

1. tone-and-assurance-testing-proposal.html
2. Studier_Tone_Test_PRD.md
3. Studier_Tone_Test_Development_Archive.md

## Final status

The brainstorming has been narrowed into a confirmed MVP direction: Studier should add Tone Test as a second study type. The MVP is human-led, lightweight, role-based, risk-aware, and designed to support sensitive wording decisions without replacing formal approval.
