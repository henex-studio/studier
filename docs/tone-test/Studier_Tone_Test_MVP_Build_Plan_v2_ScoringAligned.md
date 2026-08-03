# Studier Tone Test MVP Build Plan

## 1. Document purpose

This build plan translates the updated `Studier_Tone_Test_PRD_v2_ScoringAligned.md`, `Studier_Tone_Test_Development_Archive.md`, and `Tone_Test_Scoring_System_Explanation.md` into an implementation sequence for the Tone Test MVP.

This version is aligned with the refined scoring model:

1. Content Score is weighted and configurable at study level.
2. Evidence Confidence is displayed separately as Low, Medium, or High.
3. Risk Gate Status is displayed separately and can override high Content Scores.

The plan is written for incremental development. Each task includes purpose, dependencies, work items, acceptance criteria, and risks. The goal is to add Tone Test as a new Studier study type while preserving the existing Tree Test workflow.

## 2. Build principles

1. Preserve existing Tree Test behaviour.
2. Reuse the current Studier lifecycle where possible: draft, preview, publish, public link, close, clear data, reuse, and export.
3. Keep participants account-free. Participants should open a public link, select a role, complete the flow, and submit.
4. Keep the MVP human-led. AI rewrite suggestions are out of MVP scope.
5. Keep the dashboard simple. The first version should support decision-making and export, not advanced analytics.
6. Keep privacy guidance visible. The tool should not ask for names, contact details, case details, or sensitive personal information.
7. Separate Content Score, Evidence Confidence, and Risk Gate Status.
8. Use risk gates as safeguards. A high Content Score should not override a failed critical risk gate.

## 3. Recommended development sequence

## Task 0. Repository and database discovery

### Purpose

Understand the current Studier codebase, routing, Supabase schema, RLS policies, existing response model, export functions, and shared UI patterns before changing anything.

### Dependencies

None.

### Work items

1. Review current GitHub repository structure.
2. Identify current routes for collection, builder, preview, public runner, dashboard, guide, and auth.
3. Review current Supabase tables, especially `studies`, `study_trees`, `study_tasks`, `study_final_questions`, `task_responses`, `final_responses`, `participant_sessions`, and `profiles`.
4. Review current RLS policies for public submissions and owner or admin access.
5. Review current CSV export implementation.
6. Review current clear data and close test implementation.
7. Identify shared components that can be reused.

### Acceptance criteria

1. Developer can explain how a current Tree Test is created, published, completed, exported, closed, and cleared.
2. Developer has identified all files likely to be touched for Tone Test MVP.
3. Developer has a safe branch or backup before schema changes.
4. Existing Tree Test smoke test passes before Tone Test work begins.

### Risks

1. Existing schema assumptions may be wrong without direct Supabase access.
2. RLS may block public Tone Test submissions if copied incorrectly.
3. Shared components may be tightly coupled to Tree Test logic.

## Task 1. Add study type support

### Purpose

Allow Studier to support more than one study type while keeping the existing Tree Test workflow unchanged.

### Dependencies

Task 0.

### Work items

1. Add or confirm a `study_type` field on `studies`.
2. Define allowed values, such as `tree_test` and `tone_test`.
3. Default existing studies to `tree_test`.
4. Update create study flow so users choose between Tree Test and Tone Test.
5. Route Tree Test studies to the existing builder and Tone Test studies to the new Tone Test Builder.
6. Update collection cards or list view to show study type.
7. Ensure existing Tree Test actions still work.

### Acceptance criteria

1. Existing studies appear as Tree Test studies.
2. User can create a new Tree Test and reach the existing builder.
3. User can create a new Tone Test and reach a placeholder Tone Test Builder.
4. Test collection displays study type clearly.
5. Existing preview, publish, dashboard, close, clear, and delete actions still work for Tree Test.

### Risks

1. Existing code may assume every study has a tree and tasks.
2. Publishing checks may fail for Tone Test unless study-type-specific checks are introduced.
3. Dashboard routing may need study-type-specific logic.

## Task 2. Create Tone Test database schema

### Purpose

Add the minimum database structure required to store Tone Test setup and responses, including the refined scoring model.

### Dependencies

Task 1.

### Work items

1. Create `tone_test_settings`.
2. Create `tone_variants`.
3. Create `tone_questions`.
4. Create `tone_risk_gates` or use a fixed config table plus per-study settings.
5. Create `tone_responses`.
6. Create `tone_gate_responses`.
7. Extend `participant_sessions` to support Tone Test role and assigned variant, or create a compatible Tone Test session layer.
8. Add `content_score_weights_json` to store study-level Content Score weights.
9. Add optional `evidence_confidence_settings_json` for later configuration or thresholds.
10. Add indexes for `study_id`, `participant_session_id`, `selected_role`, and `variant_id`.
11. Add timestamps and owner-safe audit fields where needed.

### Acceptance criteria

1. Tone Test settings can be saved for a study.
2. Two to four variants can be saved and retrieved in display order.
3. Role-specific questions can be saved and retrieved.
4. Study-level Content Score weights can be saved and retrieved.
5. Evidence Confidence can be calculated or displayed from available response data.
6. Participant session can store selected role and assigned variant.
7. Rating, open text, preference, and gate responses can be stored.
8. Schema supports both single variant random assignment and compare all variants mode.

### Risks

1. Too many new tables may increase implementation complexity.
2. Reusing existing `final_responses` may seem simpler but could make dashboard logic confusing.
3. Missing indexes may make dashboard queries slow later.
4. Storing Evidence Confidence as a static field too early may create stale results if more responses arrive.

## Task 3. Add Supabase RLS policies

### Purpose

Allow safe public submission for published Tone Tests while protecting setup and results from anonymous access.

### Dependencies

Task 2.

### Work items

1. Add public read access for published Tone Test setup needed by the participant runner.
2. Add public insert access for participant sessions for published Tone Tests.
3. Add public insert access for Tone Test responses and gate responses for published Tone Tests.
4. Prevent anonymous update or delete of setup and results.
5. Allow owners and admins to read setup and results for authorised studies.
6. Allow owners and admins to clear response data under existing Studier rules.
7. Test policies with anon and authenticated users.

### Acceptance criteria

1. Anonymous participant can load a published Tone Test link.
2. Anonymous participant cannot load unpublished, draft, closed, or expired Tone Tests.
3. Anonymous participant can submit responses to a published Tone Test.
4. Anonymous participant cannot view dashboard data.
5. Owner can view dashboard results.
6. Owner or admin can clear Tone Test response data according to existing rules.
7. Existing Tree Test RLS behaviour is not broken.

### Risks

1. Public policies may accidentally expose setup or response data.
2. Policies may block valid public submissions.
3. Existing RLS helpers may need updates for `study_type`.

## Task 4. Build Tone Test Builder foundation

### Purpose

Create the main creator interface for configuring a Tone Test.

### Dependencies

Tasks 1, 2, and 3.

### Work items

1. Create Tone Test Builder route.
2. Add sections for title, welcome message, privacy message, end message, scenario, content goal, sensitivity level, and optional closing time.
3. Add save behaviour consistent with existing Study Builder.
4. Add loading, saving, validation, and error states.
5. Add navigation back to collection.
6. Add basic draft state handling.

### Acceptance criteria

1. Creator can open a Tone Test draft.
2. Creator can edit and save basic setup fields.
3. Creator can return to collection without losing saved changes.
4. Closing time works consistently with Tree Test lifecycle behaviour.
5. Builder does not show IA tree upload or tree task setup for Tone Test.

### Risks

1. Reusing Tree Test Builder components may create confusing IA-specific labels.
2. Autosave or manual save behaviour may differ from current Studier patterns.
3. Builder validation may become too strict too early.

## Task 5. Build wording variant management

### Purpose

Allow creators to add and manage two to four wording variants.

### Dependencies

Task 4.

### Work items

1. Add variant list section.
2. Add variant card editor with label, variant text, and optional internal note.
3. Add add, edit, delete, and reorder controls.
4. Enforce minimum two variants before publish.
5. Enforce maximum four variants.
6. Store `variant_source` as `manual` by default.
7. Add empty state and validation messages.

### Acceptance criteria

1. Creator can add two to four variants.
2. Creator cannot add a fifth variant.
3. Creator cannot publish with fewer than two variants.
4. Variant order is saved.
5. Variant text is shown correctly in preview and runner.

### Risks

1. Long variant text may make cards difficult to scan.
2. Deleting a variant with existing responses should be blocked or handled carefully after publish.
3. Reordering variants should not break response mapping.

## Task 6. Build role configuration and default question templates

### Purpose

Allow creators to configure which roles are active and edit role-specific questions.

### Dependencies

Tasks 4 and 5.

### Work items

1. Add three default roles: Audience, Comms and Policy Reviewer, Plain Language and Accessibility Reviewer.
2. Add role enable and disable controls.
3. Require at least one active role.
4. Add default role descriptions for participant role selection.
5. Add default question templates by role.
6. Allow creators to edit question wording.
7. Keep core scoring dimensions available for reporting consistency.
8. Add warning if a role is disabled and Content Score weights need redistribution.

### Acceptance criteria

1. Creator can enable or disable each default role.
2. Creator cannot disable all roles.
3. No Other role is available.
4. Role-specific questions are created by default for a new Tone Test.
5. Creator can edit question wording.
6. Edited questions appear in preview and runner.

### Risks

1. Allowing too much question editing may break dashboard scoring.
2. Disabled roles may still appear in participant runner if filtering is missed.
3. Role names may need refinement for non-government users later.

## Task 7. Build Content Score setup

### Purpose

Allow creators to set study-level Content Score weights and require valid totals before publishing.

### Dependencies

Task 6.

### Work items

1. Add Content Score setup section in Builder.
2. Provide default weights: Audience Evidence 40%, Comms and Policy Assurance 35%, Plain Language and Accessibility 25%.
3. Allow creators to edit weights.
4. Require active weights to total 100%.
5. When a role is disabled, require redistribution of related weights.
6. Add clear warning that Content Score supports research judgement and does not replace formal approval.
7. Store weights in `content_score_weights_json`.
8. Remove Evidence Confidence from the adjustable weighting UI.

### Acceptance criteria

1. Creator can edit Content Score weights.
2. System shows live total.
3. System blocks publish if active weights do not total 100%.
4. Disabling a role triggers a weight redistribution warning.
5. Same Content Score model applies to all variants in the study.
6. Evidence Confidence is not shown as a configurable score weight.

### Risks

1. Users may expect Evidence Confidence to still be in the weighting model from earlier documents.
2. Users may over-trust Content Score unless guidance is visible.
3. Decimal or rounding issues may block publish incorrectly.

## Task 8. Build Evidence Confidence logic and display rules

### Purpose

Show Evidence Confidence separately from Content Score so users understand how reliable the result is.

### Dependencies

Tasks 2, 6, and 7.

### Work items

1. Define MVP Evidence Confidence labels: Low, Medium, High.
2. Define display logic based on role coverage, response volume, participant relevance, and response quality.
3. Automate what can be automated in MVP, such as role coverage and response volume.
4. Add optional researcher note or manual override only if easy to implement without scope creep.
5. Ensure Evidence Confidence is shown in dashboard, not mixed into Content Score.
6. Add plain language explanation in Builder, Dashboard, and Guide.

### Acceptance criteria

1. Dashboard displays Evidence Confidence as Low, Medium, or High.
2. Evidence Confidence is visually separate from Content Score.
3. Evidence Confidence does not change Content Score calculations.
4. Evidence Confidence can identify missing active roles or very low response volume.
5. Guidance explains that Evidence Confidence shows result reliability, not wording quality.

### Risks

1. Fully automated confidence may be misleading if participant relevance cannot be known by the system.
2. Manual overrides may complicate MVP.
3. Users may misunderstand Low confidence as meaning the wording is poor rather than the evidence is weak.

## Task 9. Build risk gate configuration and defaults

### Purpose

Add fixed MVP risk gates and ensure the system can capture Pass, Concern, and Fail responses.

### Dependencies

Tasks 6, 7, and 8.

### Work items

1. Add six fixed gates: Policy accuracy, Operational promise, Safety risk, Harm blame and stigma, Privacy and consent, Accessibility and readability.
2. Mark gates as critical where needed.
3. Map relevant gates to reviewer role question templates.
4. Store gate metadata.
5. Add Builder display explaining that failed critical gates override high Content Scores.

### Acceptance criteria

1. Six gates exist for every Tone Test.
2. Gate labels match MVP terminology.
3. Gate responses support Pass, Concern, and Fail.
4. Gate status can be summarised by variant in dashboard.
5. Critical gate failure can produce Not recommended until revised status.

### Risks

1. Gate logic may be too rigid for all content types.
2. Reviewers may treat gates as formal approval unless guidance is clear.
3. Gate responses may be incomplete if optional.

## Task 10. Add Tone Test preview by role

### Purpose

Let creators test the participant experience before publishing without saving responses.

### Dependencies

Tasks 4 to 9.

### Work items

1. Add Preview button for Tone Test Builder.
2. Ask creator to choose a preview role.
3. Show role-specific flow.
4. Support both variant modes in preview.
5. Add return links to Builder and collection.
6. Ensure preview responses are never saved.

### Acceptance criteria

1. Creator can preview as Audience.
2. Creator can preview as Comms and Policy Reviewer if active.
3. Creator can preview as Plain Language and Accessibility Reviewer if active.
4. Preview respects disabled roles.
5. Preview respects variant mode.
6. No preview response is saved to database.

### Risks

1. Preview and public runner may diverge if implemented separately.
2. Preview may accidentally create participant sessions.
3. Variant randomisation in preview may confuse creators unless labelled clearly.

## Task 11. Implement publishing checks

### Purpose

Prevent incomplete or invalid Tone Tests from being published.

### Dependencies

Tasks 4 to 10.

### Work items

1. Add study-type-specific publish validation.
2. Check welcome and privacy content.
3. Check scenario and content goal.
4. Check two to four variants.
5. Check at least one active role.
6. Check required role questions.
7. Check Content Score weights total 100%.
8. Check closing time is not in the past.
9. Show clear validation messages.
10. Keep existing Tree Test publishing checks unchanged.

### Acceptance criteria

1. Invalid Tone Test cannot be published.
2. Valid Tone Test can be published.
3. Validation messages tell creator exactly what to fix.
4. Existing Tree Test publish validation still works.
5. Published Tone Test creates or exposes a public test link.
6. Evidence Confidence is not required before publishing because it depends on collected responses.

### Risks

1. Shared publishing code may accidentally apply Tree Test rules to Tone Test.
2. Validation may miss disabled-role edge cases.
3. Public link may route incorrectly if study type is not checked.

## Task 12. Build participant role selection flow

### Purpose

Allow public participants to open one link, select an active role, and enter the matching question flow.

### Dependencies

Tasks 3 and 11.

### Work items

1. Update public runner to detect study type.
2. For Tone Test, show welcome and privacy content first.
3. Show only active role options.
4. Provide short descriptions for each role.
5. Allow participant to change role before starting.
6. Lock selected role after role-specific questions begin.
7. Store selected role in participant session.
8. Show closed or expired page when needed.

### Acceptance criteria

1. Public participant can open a published Tone Test link without login.
2. Participant sees only active roles.
3. Participant can change role before starting questions.
4. Participant cannot change role after starting questions.
5. Selected role is saved correctly.
6. Closed or expired Tone Test does not accept new responses.

### Risks

1. Participants may choose the wrong role.
2. Role locking can frustrate users if they misread role descriptions.
3. Anonymous session handling may conflict with existing participant session logic.

## Task 13. Implement variant assignment and display logic

### Purpose

Show the correct variant experience for the selected study mode.

### Dependencies

Task 12.

### Work items

1. In single variant random assignment mode, randomly assign one active variant to the participant session.
2. Persist assigned variant ID so refreshes do not change it.
3. Show only assigned variant to participant.
4. In compare all variants mode, generate random variant display order per session.
5. Persist variant display order.
6. Show all variants in the saved order.
7. Add final preference question in compare all variants mode.

### Acceptance criteria

1. Single variant mode shows only one variant.
2. Assigned variant remains stable after page refresh.
3. Compare all variants mode shows all variants.
4. Compare all variants mode randomises order per session.
5. Variant display order is stored.
6. Preference selection and explanation are captured.

### Risks

1. Poor randomisation may create uneven sample distribution.
2. Refreshing the page may accidentally reassign variants if persistence is not handled.
3. Compare all variants mode may be too long on mobile if variant text is lengthy.

## Task 14. Build role-specific question runner and submission

### Purpose

Collect rating, open-text, gate, and preference responses from participants.

### Dependencies

Tasks 12 and 13.

### Work items

1. Render role-specific rating questions.
2. Render role-specific open questions.
3. Render gate questions for reviewer roles.
4. Render preference question in compare all variants mode.
5. Validate required answers.
6. Save responses to `tone_responses` and `tone_gate_responses`.
7. Mark participant session as completed.
8. Show completion message.

### Acceptance criteria

1. Participant can complete Audience flow.
2. Participant can complete Comms and Policy Reviewer flow.
3. Participant can complete Plain Language and Accessibility Reviewer flow.
4. Responses are saved with study ID, participant session ID, selected role, variant ID or display order, question ID, response value, and timestamp.
5. Gate responses are saved with variant ID and gate status.
6. Completion message appears after successful submission.

### Risks

1. Long forms may cause abandonment.
2. Required fields may be too strict for lightweight testing.
3. Gate responses may need variant-level handling in compare all variants mode.

## Task 15. Build Tone Test dashboard summary

### Purpose

Provide a simple creator dashboard for reviewing Tone Test results with Content Score, Evidence Confidence, and Risk Gate Status shown separately.

### Dependencies

Tasks 2, 3, 8, 9, and 14.

### Work items

1. Add Tone Test dashboard route.
2. Show total response count.
3. Show response count by role.
4. Show response count by variant.
5. Show Content Score by variant.
6. Show score breakdown by role.
7. Show Evidence Confidence as Low, Medium, or High.
8. Show risk gate summary by variant.
9. Show preference result in compare all variants mode.
10. Show open comments grouped by role and variant.
11. Show recommendation status for each variant.
12. Add empty states for no responses.
13. Keep layout simple and mobile-aware.

### Acceptance criteria

1. Owner can open Tone Test dashboard.
2. Dashboard does not show for unauthorised users.
3. Counts match database responses.
4. Content Scores calculate correctly based on active Content Score weights.
5. Evidence Confidence appears separately and does not change Content Score.
6. Gate failures show Not recommended until revised.
7. Compare all variants mode shows preference result.
8. Open comments are grouped clearly.
9. Dashboard works with no responses, partial responses, and completed responses.

### Risks

1. Content Score can be misunderstood as final approval.
2. Evidence Confidence can be misunderstood as wording quality.
3. Calculation rules may be complex if not documented clearly.
4. Open comments may become hard to scan without tagging.

## Task 16. Implement final recommendation status logic

### Purpose

Generate recommendation statuses from Content Score, Evidence Confidence, and Risk Gate Status without presenting the tool as an approval engine.

### Dependencies

Task 15.

### Work items

1. Add statuses: Recommended for review, Recommended with caution, Needs revision, Not recommended until revised, Insufficient evidence.
2. If any critical risk gate is Fail, show Not recommended until revised.
3. If Evidence Confidence is Low, show Insufficient evidence or Recommended with caution depending on score and gate status.
4. If Content Score is strong, Evidence Confidence is Medium or High, and no gate failed, show Recommended for review.
5. If scores are mixed or gates show Concern, show Needs revision or Recommended with caution.
6. Add explanatory text that final publication decisions remain with the responsible team.

### Acceptance criteria

1. Status logic uses all three layers.
2. Failed critical gate overrides high Content Score.
3. Low Evidence Confidence prevents overconfident recommendation language.
4. Final status is clear and not framed as formal approval.

### Risks

1. Status logic may feel too deterministic for nuanced content decisions.
2. Teams may still treat Recommended for review as approved.
3. Thresholds may need tuning after pilot use.

## Task 17. Implement CSV export

### Purpose

Allow deeper analysis outside the app and preserve Studier's export-oriented workflow.

### Dependencies

Tasks 15 and 16.

### Work items

1. Add export button for Tone Test responses.
2. Include study ID and title.
3. Include participant session ID.
4. Include selected role.
5. Include variant mode.
6. Include assigned variant ID or variant display order.
7. Include question ID, question text, question type, scoring dimension, response value, and timestamp.
8. Include gate status and comments where applicable.
9. Include preference selection and explanation where applicable.
10. Include Content Score fields if useful.
11. Include Evidence Confidence fields or label if useful.
12. Ensure CSV escaping works for long text and commas.

### Acceptance criteria

1. Owner can export Tone Test CSV.
2. CSV opens correctly in Excel.
3. Export includes all required response fields.
4. Export identifies scoring dimension for rating questions.
5. Export handles long text safely.
6. Existing Tree Test exports still work.

### Risks

1. Export may become too wide if every field is included.
2. Open comments may contain personal information despite warnings.
3. CSV formula injection should be considered if users enter text starting with formula characters.
4. Exported Evidence Confidence may become stale if exported as a static value rather than calculated at export time.

## Task 18. Add close, clear data, and reuse support for Tone Test

### Purpose

Align Tone Test with existing Studier lifecycle controls.

### Dependencies

Tasks 2, 3, 11, 14, 15, 16, and 17.

### Work items

1. Ensure Tone Test can be closed manually.
2. Ensure closing prevents new submissions but keeps existing data.
3. Ensure expired Tone Test links show closed message.
4. Add clear response data support for Tone Test response tables.
5. Add clear data and publish support if existing Studier pattern allows.
6. Require confirmation before clearing data.
7. Preserve setup content when clearing responses.

### Acceptance criteria

1. Published Tone Test can be closed.
2. Closed Tone Test no longer accepts new public responses.
3. Existing responses remain after close.
4. Owner or admin can clear Tone Test response data.
5. Clearing removes participant sessions and Tone Test response data for the study.
6. Setup data, variants, questions, gates, Content Score weights, and Evidence Confidence settings remain.
7. Existing Tree Test clear and close behaviour is unaffected.

### Risks

1. Clear data may miss one response table.
2. Clear data may accidentally remove setup data.
3. Reuse without formal testing rounds can mix old and new data if not cleared properly.

## Task 19. Update Guide and in-app help

### Purpose

Help creators understand when and how to use Tone Test safely, including the refined scoring model.

### Dependencies

Tasks 4 to 18.

### Work items

1. Add Guide section: What is a Tone Test.
2. Add Guide section: When to use Tone Test.
3. Add Guide section: Roles and what each role should answer.
4. Add Guide section: Variant modes.
5. Add Guide section: Content Score weights.
6. Add Guide section: Evidence Confidence.
7. Add Guide section: Risk gates.
8. Add privacy warning: do not collect names, contact details, case details, or sensitive personal information.
9. Add high-sensitivity content guidance.
10. Add CSV export explanation.
11. Add release note and version history entry.

### Acceptance criteria

1. Guide explains Tone Test in plain language.
2. Guide explains Content Score, Evidence Confidence, and Risk Gate Status separately.
3. Guide includes privacy and safety warnings.
4. Guide explains that Tone Test supports research judgement and does not replace formal approval.
5. Version history includes the Tone Test MVP release note.
6. Users can reach Guide from current navigation.

### Risks

1. Users may treat Tone Test as an approval system without clear guidance.
2. Guide may become outdated if feature behaviour changes.
3. High-sensitivity testing guidance may need policy review before wide use.

## Task 20. Full QA and regression testing

### Purpose

Confirm Tone Test works end to end and does not break Tree Test.

### Dependencies

All development tasks.

### Work items

1. Run Tree Test regression tests.
2. Run Tone Test creator flow tests.
3. Run Tone Test participant flow tests for all roles.
4. Test both variant modes.
5. Test Content Score weights and publish validation.
6. Test Evidence Confidence display logic.
7. Test disabled role cases.
8. Test gate failure status logic.
9. Test recommendation status logic.
10. Test CSV export.
11. Test close, expired, clear, and reuse behaviour.
12. Test RLS with anonymous participant, owner, admin, and unauthorised user.
13. Test mobile layout.
14. Test keyboard navigation.
15. Test screen reader labels for main form controls where possible.

### Acceptance criteria

1. Existing Tree Test flow still works.
2. Tone Test can be created, configured, previewed, published, completed, reviewed, exported, closed, cleared, and reused.
3. Anonymous participants can submit only to published Tone Tests.
4. Unauthorised users cannot access results.
5. Role selection and role locking work.
6. Single variant assignment is stable.
7. Compare all variants randomises display order and stores preference.
8. Publishing checks prevent invalid tests.
9. Content Score, Evidence Confidence, and Risk Gate Status display separately.
10. Dashboard numbers match exported CSV where applicable.
11. No known critical accessibility blockers remain.

### Risks

1. RLS bugs may only appear in deployed environment.
2. Random assignment may be hard to test manually without test utilities.
3. CSV export and dashboard may use different calculations if logic is duplicated.
4. Evidence Confidence may need tuning after first pilot use.

## 4. Suggested implementation milestones

### Milestone 1. Platform foundation

Includes Tasks 0 to 3.

Outcome: Studier can recognise Tone Test as a new study type, and the database and RLS foundations exist.

### Milestone 2. Creator setup

Includes Tasks 4 to 11.

Outcome: Creator can create and configure a valid Tone Test, preview it by role, and publish it.

### Milestone 3. Participant experience

Includes Tasks 12 to 14.

Outcome: Participants can open a public link, select role, see correct variants and questions, and submit responses.

### Milestone 4. Results and lifecycle

Includes Tasks 15 to 18.

Outcome: Creator can review Content Score, Evidence Confidence, Risk Gate Status, recommendation status, export CSV, close tests, clear responses, and reuse the setup.

### Milestone 5. Guide and release readiness

Includes Tasks 19 to 20.

Outcome: Tone Test is documented, tested, and ready for internal MVP use.

## 5. Minimum test scenarios

### Scenario 1. Create and publish a basic Tone Test

1. Create Tone Test.
2. Add scenario and content goal.
3. Add three variants.
4. Keep all three roles active.
5. Use default Content Score weights.
6. Publish.

Expected result: Public link is available.

### Scenario 2. Disable one role and redistribute weights

1. Disable Plain Language and Accessibility Reviewer.
2. Try to publish without redistributing weight.
3. Redistribute Content Score weights to total 100%.
4. Publish.

Expected result: Publish is blocked until Content Score weight total is valid.

### Scenario 3. Evidence Confidence with missing role

1. Publish Tone Test with all three roles active.
2. Collect only Audience responses.
3. Open dashboard.

Expected result: Evidence Confidence is lower because active role coverage is incomplete.

### Scenario 4. Single variant random assignment

1. Publish Tone Test in single variant mode.
2. Complete several participant sessions.
3. Refresh during one session.

Expected result: Each session sees one stable assigned variant.

### Scenario 5. Compare all variants

1. Publish Tone Test in compare all variants mode.
2. Complete participant session.
3. Select preferred version and explain why.

Expected result: Variant order and preference are stored.

### Scenario 6. Risk gate fail

1. Submit reviewer response with a critical gate marked Fail.
2. Open dashboard.

Expected result: Affected variant shows Not recommended until revised, regardless of Content Score.

### Scenario 7. RLS public submission

1. Open published test while logged out.
2. Submit response.
3. Try to open dashboard while logged out.

Expected result: Submission succeeds, dashboard access fails.

### Scenario 8. Close and clear

1. Close published Tone Test.
2. Try to submit new response.
3. Export existing results.
4. Clear response data.

Expected result: Closed test blocks new submissions. Clearing removes responses but keeps setup.

## 6. Information needed before implementation

To make this build plan implementation-ready, the following current Studier files or access details are needed:

1. GitHub repository or ZIP of the current codebase.
2. Current Supabase schema SQL or database export.
3. Current RLS policies.
4. Current environment variable names, without sharing secret values.
5. Current route map or file structure for collection, builder, runner, dashboard, guide, and auth.
6. Current CSV export implementation.
7. Current clear data and publish logic.
8. Current user role model for owner and admin access.
9. Current deployment setup, such as Vercel project configuration.

Secrets should not be shared in chat. API keys, database passwords, service role keys, and private tokens should be kept out of documentation and code shared here.

## 7. Recommended first developer handoff package

1. `Studier_Tone_Test_PRD_v2_ScoringAligned.md`.
2. `Studier_Tone_Test_Development_Archive.md`.
3. `Tone_Test_Scoring_System_Explanation.md`.
4. This build plan.
5. Current database schema.
6. Current RLS policies.
7. Current repository structure.
8. A short note identifying the latest stable Studier version or branch.

## 8. Release note draft

Tone Test MVP adds a new Studier study type for testing sensitive wording with role-based feedback. Creators can add wording variants, enable or disable reviewer roles, choose single-variant random assignment or compare-all-variants mode, configure Content Score weights, collect risk gate responses, view Evidence Confidence separately, review a simple dashboard summary, export CSV data, and use existing Studier lifecycle controls for preview, publish, close, clear, and reuse.
