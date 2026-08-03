# Studier Tone Test PRD

## 1. Product name

Studier Tone Test

## 2. Document status

Updated draft PRD for MVP planning. This version aligns the scoring model with the later scoring system decision: Evidence Confidence is no longer part of the weighted Content Score. It is shown separately as Low, Medium, or High.

## 3. Product context

Studier is currently an internal web application for creating, publishing, running, and analysing tree tests. The existing platform already supports study creation, public test links, participant response capture, preview, publishing, closing, clearing response data, CSV exports, registration, consent, and an in-app Guide.

Tone Test will extend Studier as a new study type. It will reuse Studier's existing study lifecycle and public participant model, while adding a new builder, participant flow, role-based questions, wording variant testing, configurable Content Score weighting, Evidence Confidence, risk gates, and a simplified results dashboard for wording decisions.

## 4. Product summary

Tone Test is a lightweight research tool that helps teams test sensitive wording before publication. It lets a creator add multiple wording variants, invite participants through one public link, ask participants to select a role, show role-specific questions, collect ratings and comments, and summarise results by variant and role.

The tool is designed to support research and content writing. It does not replace formal approval, policy sign-off, legal review, operational assurance, privacy review, comms approval, or accessibility assurance.

## 5. Problem statement

In cross-agency projects, advisors often write content when they are not the policy or publishing owner. They may have a style guide, or they may not. Either way, the final wording still needs judgement from the right people.

Teams often need to choose wording for sensitive service content, such as victim information. A message may feel warm to the public but create unrealistic expectations. Another message may be accurate from an organisational perspective but feel cold, blaming, unclear, or hard to act on.

Without a shared evidence method, the work often becomes a cycle of writing multiple versions, sending them around for feedback, meeting to discuss comments, and revising again. The feedback is useful, but it is hard to compare, hard to trace, and hard to reuse.

Tone Test addresses this by giving teams a structured way to compare wording options with different participant roles and evidence types.

## 6. Goals

1. Let creators create a Tone Test as a new Studier study type.
2. Let creators add two to four wording variants for the same content decision.
3. Let creators choose which participant roles are active for a test.
4. Let public participants open one test link, select an active role, and answer role-specific questions.
5. Let creators choose between single variant random assignment and compare all variants mode.
6. Let creators configure study-level Content Score weights.
7. Let the system collect ratings, open comments, preference responses, and risk gate responses.
8. Let the system show Evidence Confidence separately from Content Score.
9. Let creators view a simple dashboard summary by variant and role.
10. Let creators export response data as CSV.
11. Keep the product lightweight and aligned with Studier's existing privacy-aware approach.

## 7. Non-goals for MVP

1. Tone Test will not include AI rewrite suggestions in MVP.
2. Tone Test will not provide formal content approval workflow.
3. Tone Test will not require participant accounts.
4. Tone Test will not provide reviewer-only authentication in MVP.
5. Tone Test will not include an Other role.
6. Tone Test will not provide complex statistical modelling or advanced charts in MVP.
7. Tone Test will not collect names, contact details, case details, or sensitive personal information.
8. Tone Test will not replace policy, legal, operational, privacy, comms, or accessibility review.
9. Tone Test will not provide a multi-round comparison dashboard in MVP.
10. Evidence Confidence will not be included in the configurable weighted Content Score.

## 8. Primary users

### 8.1 Test creators

Internal users who create Tone Tests, define the wording variants, configure roles, edit question templates, set Content Score weights, publish tests, and review results.

### 8.2 Audience participants

People who represent, or are close to, the intended audience. They answer questions about understanding, trust, respect, support, and next-step clarity.

### 8.3 Comms and Policy reviewers

Internal reviewers who assess whether wording is accurate, publishable, aligned to policy, consistent with operational boundaries, and not overpromising.

### 8.4 Plain Language and Accessibility reviewers

Specialists or informed reviewers who assess clarity, readability, structure, jargon, cognitive load, and basic accessibility-related content quality.

### 8.5 Researchers and analysts

Users who review dashboard summaries, export CSV data, clean responses, and prepare findings or recommendations.

### 8.6 Admins

Internal users with broader access to tests, ownership, and operational controls.

## 9. Study type model

Tone Test will be added as a new study type alongside the existing Tree Test.

When creating a new study, the creator should choose one of the available study types:

1. Tree Test.
2. Tone Test.

Existing Tree Test behaviour should remain unchanged.

## 10. Key product decisions confirmed for MVP

1. Tone Test is a new Studier study type.
2. The public test link model remains unchanged. Participants do not need accounts.
3. Participants select their role after opening the public link.
4. MVP has three default roles: Audience, Comms and Policy Reviewer, and Plain Language and Accessibility Reviewer.
5. Creators can enable or disable default roles for each study.
6. MVP will not include an Other role.
7. Role-specific question templates are provided by default.
8. Creators can edit question wording, but core scoring dimensions should remain available for reporting consistency.
9. Participants can change role before starting role-specific questions. Once they start answering, the role should be locked for that session.
10. The test supports two to four wording variants.
11. The test supports two variant modes: single variant random assignment and compare all variants.
12. Compare all variants mode should randomise variant order.
13. Compare all variants mode should include a final preference question.
14. Content Score weights are set at study level and apply to all variants in that study.
15. If an active role is disabled, the creator must redistribute Content Score weights so the total remains 100%.
16. Evidence Confidence is shown separately as Low, Medium, or High.
17. Risk gates are fixed for MVP.
18. The first dashboard remains simple and export-focused.
19. AI rewrite suggestions are excluded from MVP and listed as a future enhancement.

## 11. Scoring model

Tone Test uses three separate layers:

1. Content Score.
2. Evidence Confidence.
3. Risk Gate Status.

Content Score tells the team how the wording performed.

Evidence Confidence tells the team how much they can trust the result.

Risk Gate Status tells the team whether the wording is safe to recommend.

### 11.1 Content Score

Content Score is the main weighted score in MVP. It evaluates how well each wording variant performs across the active review perspectives.

The recommended default Content Score weighting is:

1. Audience Evidence, 40%.
2. Comms and Policy Assurance, 35%.
3. Plain Language and Accessibility, 25%.

These weights total 100%.

Creators can adjust these weights at study level. Study-level scoring means the creator sets one scoring model for the whole Tone Test. The same model is then applied to every wording variant in that study. This makes comparison fair because Version A, Version B, and Version C are evaluated using the same weighting logic.

If a role is disabled, the creator must redistribute the related weight. For example, if Plain Language and Accessibility Reviewer is disabled, its 25% cannot remain in the score. The creator must redistribute the total across the remaining active score groups until the total equals 100%.

Scores support research judgement. They do not replace formal approval.

### 11.2 Evidence Confidence

Evidence Confidence is not part of the weighted Content Score in MVP.

Evidence Confidence evaluates whether the evidence collected in the test is strong enough to support a recommendation. It does not evaluate the wording itself.

Evidence Confidence should be shown as:

1. Low.
2. Medium.
3. High.

Evidence Confidence should consider:

1. Role coverage.
2. Participant relevance.
3. Response volume.
4. Response quality.

Suggested interpretation:

High confidence means all active roles have responses, each wording variant has enough feedback, key reviewers participated, open comments include useful explanations, and there is no obvious sample imbalance.

Medium confidence means most active roles have responses, some variants may have fewer responses, some open comments are useful, and the result can support an initial judgement with caution.

Low confidence means a key role is missing, response numbers are very low, feedback quality is thin, or the result should be treated as an early signal rather than a recommendation.

### 11.3 Risk Gate Status

Risk Gate Status is separate from Content Score and Evidence Confidence.

Risk gates are safeguards. They prevent a high-scoring wording version from being recommended if it creates unacceptable risk.

The MVP risk gates are:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Harm, blame, and stigma.
5. Privacy and consent.
6. Accessibility and readability.

Each gate uses:

1. Pass.
2. Concern.
3. Fail.

If a critical risk gate is marked Fail for a wording variant, the variant should be shown as Not recommended until revised, even if its Content Score is high.

## 12. Core user journeys

### Journey 1, Create a Tone Test

1. Creator logs in to Studier.
2. Creator opens the study collection.
3. Creator selects Create new test.
4. System asks the creator to choose a study type.
5. Creator selects Tone Test.
6. System creates a draft Tone Test.
7. Creator is taken to the Tone Test Builder.

### Journey 2, Configure Tone Test content

1. Creator edits the test title.
2. Creator edits welcome, privacy, and end messages.
3. Creator adds the scenario.
4. Creator adds the content goal.
5. Creator selects a sensitivity level.
6. Creator adds two to four wording variants.
7. Creator chooses the variant mode.
8. Creator enables or disables participant roles.
9. Creator reviews and edits role-specific question templates.
10. Creator reviews fixed risk gates.
11. Creator configures study-level Content Score weights.
12. Creator reviews Evidence Confidence guidance.
13. Creator sets an optional closing time.

### Journey 3, Preview by role

1. Creator selects Preview.
2. System asks the creator to choose a preview role.
3. Creator previews the selected role flow.
4. Creator can return to the builder.
5. Preview responses are not saved.

### Journey 4, Publish and share

1. Creator selects Publish.
2. System checks required setup fields.
3. System checks that at least two wording variants exist.
4. System checks that at least one role is active.
5. System checks that Content Score weights total 100%.
6. System checks that the closing time is not in the past.
7. If checks pass, the study status changes to Published.
8. Creator copies the public test link and shares it with participants or reviewers.

### Journey 5, Complete a Tone Test

1. Participant opens the public test link.
2. Participant reads welcome and privacy content.
3. Participant selects one of the active roles.
4. Participant confirms role selection and starts the test.
5. System locks the selected role for the session.
6. Participant views one wording variant or all wording variants, depending on the variant mode.
7. Participant answers role-specific rating and open questions.
8. In compare all variants mode, participant answers the final preference question.
9. Participant submits the response.
10. Participant sees the completion message.

### Journey 6, View results

1. Creator opens the dashboard.
2. Creator sees response count by role.
3. Creator sees scores by wording variant.
4. Creator sees scores by role.
5. Creator sees Evidence Confidence.
6. Creator sees risk gate status by variant.
7. Creator sees open comments grouped by role and variant.
8. Creator sees a recommendation status for each variant.
9. Creator exports response data as CSV.

### Journey 7, Close, clear, and reuse

1. Creator closes a published Tone Test when data collection is complete.
2. Closing prevents new responses but keeps existing data.
3. Creator can export data before clearing.
4. Creator can clear response data for a closed or draft Tone Test.
5. Creator can clear data and publish again to reuse the same test.

## 13. Tone Test Builder requirements

### 13.1 Study setup

The system shall allow creators to edit:

1. Test title.
2. Welcome message.
3. Privacy message.
4. End message.
5. Scenario.
6. Content goal.
7. Sensitivity level.
8. Optional closing time.

### 13.2 Wording variants

The system shall allow creators to add, edit, reorder, and delete wording variants.

The system shall require a minimum of two variants and allow a maximum of four variants.

Each variant shall include:

1. Variant label.
2. Variant text.
3. Optional internal note.
4. Variant source, defaulting to Manual.

### 13.3 Variant mode

The system shall support two modes:

1. Single variant random assignment.
2. Compare all variants.

In single variant random assignment mode, the system shall assign one variant to each participant session. The participant shall only see the assigned variant.

In compare all variants mode, the participant shall see all variants. The system shall randomise the display order for each participant session.

### 13.4 Role configuration

The system shall provide three default roles:

1. Audience.
2. Comms and Policy Reviewer.
3. Plain Language and Accessibility Reviewer.

The system shall allow creators to enable or disable each role.

The system shall require at least one active role.

The system shall not provide an Other role in MVP.

### 13.5 Role question templates

The system shall provide default question templates for each role.

Creators shall be able to edit question wording.

Creators should not be encouraged to remove core scoring dimensions, because the dashboard depends on consistent score groups.

### 13.6 Content Score setup

The system shall provide a Content Score setup section.

The system shall allow creators to configure study-level Content Score weights.

The system shall ensure that active Content Score weights total 100% before publishing.

Default weights shall be:

1. Audience Evidence, 40%.
2. Comms and Policy Assurance, 35%.
3. Plain Language and Accessibility, 25%.

If a role is disabled, the system shall require the creator to redistribute its weighting.

The system shall display a warning that scores support research judgement and do not replace formal approval.

### 13.7 Evidence Confidence guidance

The system shall explain Evidence Confidence in the Builder or Guide.

The system shall make clear that Evidence Confidence is not part of the weighted Content Score.

The system should calculate or display Evidence Confidence in the dashboard using role coverage, participant relevance, response volume, and response quality.

### 13.8 Risk gates

The system shall include the following fixed risk gates for MVP:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Harm, blame, and stigma.
5. Privacy and consent.
6. Accessibility and readability.

Risk gate responses shall use:

1. Pass.
2. Concern.
3. Fail.

If any critical gate is marked Fail for a variant, the variant shall be shown as Not recommended until revised.

## 14. Default role questions

### 14.1 Audience questions

Rating questions:

1. This message is clear.
2. I understand what I can do next.
3. This message feels respectful.
4. This message feels supportive.
5. I trust this information.
6. This message does not make me feel blamed.

Open questions:

1. What do you think this message is asking you to do?
2. What words or phrases felt helpful?
3. What words or phrases felt unclear or uncomfortable?
4. What would you do next after reading this?

### 14.2 Comms and Policy Reviewer questions

Rating questions:

1. This message is accurate.
2. This message is suitable for publication review.
3. This message aligns with current policy or service position.
4. This message does not promise more than the organisation can deliver.
5. This message supports the intended content goal.

Risk gate questions:

1. Policy accuracy.
2. Operational promise.
3. Safety risk.
4. Privacy and consent.

Open questions:

1. What policy, operational, or publication concerns do you see?
2. What wording must change before this could be used?
3. What evidence or reference supports your view?

### 14.3 Plain Language and Accessibility Reviewer questions

Rating questions:

1. This message uses plain language.
2. The message is easy to scan.
3. The message avoids unnecessary jargon.
4. The message is structured in a helpful order.
5. The message is suitable for users with different literacy, cognitive, device, or accessibility needs.

Risk gate questions:

1. Accessibility and readability.
2. Harm, blame, and stigma.
3. Privacy and consent.

Open questions:

1. What words, phrases, or structure may make this harder to understand?
2. What accessibility or readability concerns do you see?
3. What wording changes would make this clearer or easier to act on?

### 14.4 Compare all variants preference question

In compare all variants mode, the system shall ask:

Which version best supports the content goal?

The system shall require a short explanation:

Please explain why you selected this version.

## 15. Participant runner requirements

1. The system shall allow public participants to open published Tone Test links without logging in.
2. The system shall show a closed message if the test is closed or expired.
3. The system shall show welcome and privacy content before role selection.
4. The system shall show only active roles.
5. The system shall show role descriptions before selection.
6. The system shall allow participants to change role before starting role-specific questions.
7. The system shall lock the selected role once the participant starts answering.
8. The system shall show role-specific instructions.
9. The system shall show one assigned variant in single variant random assignment mode.
10. The system shall show all variants in random order in compare all variants mode.
11. The system shall save rating responses, open text responses, preference responses, risk gate responses, selected role, assigned variant, variant order, and submission time.
12. The system shall show the completion message after submission.

## 16. Dashboard requirements

The first dashboard should remain simple and decision-oriented.

The dashboard shall show:

1. Total response count.
2. Response count by role.
3. Response count by variant.
4. Content Score by variant.
5. Score breakdown by role.
6. Evidence Confidence, shown as Low, Medium, or High.
7. Risk gate summary by variant.
8. Preference result in compare all variants mode.
9. Open comments grouped by role and variant.
10. Recommendation status for each variant.
11. CSV export actions.

The dashboard shall not include complex charts in MVP.

The dashboard should explain:

Content Score shows how each wording version performed across audience evidence, agency assurance, and plain language and accessibility review.

Evidence Confidence shows how reliable the result is, based on role coverage, response volume, participant relevance, and response quality.

Risk Gates show whether a wording version has policy, safety, privacy, operational, or accessibility concerns that must be addressed before it can be recommended.

## 17. Recommendation status logic

The system shall provide a recommendation status, not an automatic final decision.

Suggested status labels:

1. Recommended for review.
2. Recommended with caution.
3. Needs revision.
4. Not recommended until revised.
5. Insufficient evidence.

Suggested MVP logic:

1. If any critical risk gate is Fail, status is Not recommended until revised.
2. If Evidence Confidence is Low, status is Insufficient evidence or Recommended with caution, depending on Content Score and gate status.
3. If Content Score is strong, Evidence Confidence is Medium or High, and no critical gate has failed, status is Recommended for review.
4. If scores are mixed or one or more gates show Concern, status is Needs revision or Recommended with caution.

The system shall display that final publication decisions remain with the responsible team.

## 18. CSV export requirements

The system shall allow creators to export Tone Test responses.

The export should include:

1. Study ID.
2. Study title.
3. Participant session ID.
4. Selected role.
5. Variant mode.
6. Assigned variant ID, if applicable.
7. Variant display order, if applicable.
8. Question ID.
9. Question text.
10. Question type.
11. Scoring dimension.
12. Response value.
13. Risk gate status, if applicable.
14. Preference selection, if applicable.
15. Submission timestamp.

## 19. Data requirements

Tone Test can reuse existing Studier entities where practical, but the following new or extended entities are recommended.

### 19.1 studies

Add or use:

1. study_type, with values tree_test and tone_test.
2. title.
3. status.
4. welcome text.
5. privacy text.
6. end text.
7. owner.
8. expires_at.
9. data collection settings.

### 19.2 tone_test_settings

Stores Tone Test specific setup:

1. study_id.
2. scenario.
3. content_goal.
4. sensitivity_level.
5. variant_mode.
6. content_score_weights_json.
7. active_roles_json.
8. evidence_confidence_settings_json, optional.

### 19.3 tone_variants

Stores wording variants:

1. variant_id.
2. study_id.
3. label.
4. variant_text.
5. internal_note.
6. display_order.
7. variant_source.
8. created_at.
9. updated_at.

### 19.4 tone_questions

Stores role-specific questions:

1. question_id.
2. study_id.
3. role_key.
4. question_text.
5. question_type.
6. scoring_dimension.
7. required.
8. display_order.

### 19.5 tone_risk_gates

Stores fixed gate configuration and per-study settings if needed:

1. gate_id.
2. study_id.
3. gate_key.
4. gate_label.
5. critical.
6. active.

### 19.6 tone_responses

Stores participant responses:

1. response_id.
2. study_id.
3. participant_session_id.
4. selected_role.
5. variant_mode.
6. variant_id.
7. variant_display_order_json.
8. question_id.
9. response_value.
10. submitted_at.

### 19.7 tone_gate_responses

Stores gate responses:

1. gate_response_id.
2. study_id.
3. participant_session_id.
4. selected_role.
5. variant_id.
6. gate_key.
7. gate_status.
8. comment.
9. submitted_at.

### 19.8 participant_sessions

Extend or reuse existing participant sessions:

1. participant_session_id.
2. study_id.
3. selected_role.
4. assigned_variant_id.
5. started_at.
6. completed_at.
7. completion_status.

## 20. Permissions and security requirements

1. Public participants shall be able to submit responses only for published Tone Tests.
2. Public participants shall not be able to view dashboard results.
3. Anonymous users shall not be able to administer tests.
4. Owners and admins shall be able to view and export data for authorised tests.
5. Owners and admins shall be able to clear response data according to existing Studier rules.
6. The system shall continue to discourage collection of names, contact details, case details, or sensitive personal information.
7. The privacy note and Guide shall clearly tell creators not to ask for personal or case-specific information.
8. Supabase Row Level Security policies shall protect Tone Test setup and response data.

## 21. Publishing checks

The system shall prevent publishing if:

1. Required welcome or privacy content is missing.
2. Scenario is missing.
3. Content goal is missing.
4. Fewer than two variants exist.
5. More than four variants exist.
6. No role is active.
7. Required role questions are missing.
8. Study-level Content Score weights do not total 100%.
9. Closing time is already in the past.

## 22. Privacy and safety requirements

Tone Test should follow Studier's existing privacy-aware approach.

1. The tool should not ask for names, contact details, case details, or sensitive personal information.
2. The welcome and privacy content should warn participants not to provide personal or case-specific details.
3. The default question templates should avoid asking participants to disclose lived experience or personal harm.
4. Victim information testing should use hypothetical scenarios or carefully designed proxy participation where appropriate.
5. The system should support sensitive content review without turning the tool into a case reporting or support request channel.

## 23. Accessibility requirements

1. Role selection must be keyboard accessible.
2. Variant cards must have clear headings and reading order.
3. Rating questions must have accessible labels.
4. Error messages must be programmatically associated with fields where possible.
5. Colour must not be the only way to communicate gate status or Evidence Confidence.
6. The participant flow must work on mobile devices.
7. Plain language should be used in default instructions and help text.

## 24. Success metrics

1. Creators can create and publish a valid Tone Test without developer support.
2. Participants can complete a Tone Test without login.
3. Participants can select a role and see the correct question set.
4. Single variant random assignment records assigned variants correctly.
5. Compare all variants mode records randomised display order and preference responses correctly.
6. Creators can configure Content Score weights and publish only when the total is 100%.
7. Evidence Confidence is shown separately from Content Score.
8. Risk gate responses are captured and shown in the dashboard.
9. Creators can export Tone Test responses as CSV.
10. The dashboard helps the team explain which wording version is clearer, safer, more publishable, and why.

## 25. Risks and mitigations

### Risk 1, Participants choose the wrong role

Mitigation: Provide short role descriptions and allow role changes before role-specific questions start. Lock the role after answers begin to protect data quality.

### Risk 2, Scores are treated as formal approval

Mitigation: Display clear guidance that scores support research judgement and do not replace formal content approval.

### Risk 3, High-scoring wording creates operational or safety risk

Mitigation: Use fixed critical risk gates. If a critical gate fails, mark the variant as Not recommended until revised.

### Risk 4, Disabled role weights are forgotten

Mitigation: Require Content Score weights to be redistributed whenever a role is disabled. Prevent publishing unless active weights total 100%.

### Risk 5, Evidence Confidence is misunderstood as wording quality

Mitigation: Display Evidence Confidence separately from Content Score and explain that it shows result reliability, not wording quality.

### Risk 6, Participants provide sensitive personal information

Mitigation: Use privacy warnings, default question wording that avoids personal disclosure, and Guide content that tells creators not to ask for personal or case details.

### Risk 7, Compare all variants mode creates order bias

Mitigation: Randomise variant order for each participant session.

### Risk 8, The dashboard becomes too complex for MVP

Mitigation: Limit MVP dashboard to summaries, status labels, grouped comments, Evidence Confidence, risk gates, and CSV export.

## 26. Future enhancements

1. AI assisted rewrite suggestions.
2. Participant invite tokens for stricter response control.
3. Reviewer-specific invite links.
4. Formal testing rounds instead of clearing data between rounds.
5. Multi-round comparison dashboard.
6. Richer charts and visualisations.
7. Built-in comment tagging and theme clustering.
8. AI assisted comment summarisation, subject to privacy and governance review.
9. Exportable decision brief.
10. Built-in guide templates for high sensitivity content testing.
11. More advanced Evidence Confidence rules.

## 27. AI future enhancement note

AI rewrite suggestions are not part of MVP.

A later version may support AI assisted rewrite suggestions for draft wording variants. This feature must include privacy warnings, human review, source labelling, and controls to prevent names, contact details, case details, or sensitive personal information from being submitted to external AI services.

AI generated wording must not be treated as policy, legal, operational, accessibility, or safety assurance.

## 28. Open questions for later phases

1. Should Tone Test support formal testing rounds in the same way future Studier roadmap suggests for tree tests?
2. Should reviewer-only links be added after MVP?
3. Should the dashboard generate an exportable decision brief?
4. Should role question templates be locked for certain high sensitivity test types?
5. Should minimum response thresholds be configurable by study?
6. Should AI rewrite suggestions be limited to non-sensitive or sanitised text only?
7. Should Evidence Confidence be fully automated, manually set by the researcher, or hybrid?

## 29. MVP release note draft

Tone Test adds a new Studier study type for testing sensitive wording with role-based feedback. Creators can add multiple wording variants, enable or disable reviewer roles, choose between random single-variant testing and compare-all-variants testing, configure Content Score weights, collect risk gate responses, view Evidence Confidence separately, and review a simple results summary with CSV export.
