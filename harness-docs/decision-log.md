# Studier Tone Test Decision Log

**Scope:** Product, scope and delivery decisions for the Tone Test feature. Harness-level decisions live in `harness-core/docs/decision-log.md` under H numbering.
**Numbering:** S-x.y. S-1 scope and positioning, S-2 roles, S-3 variants, S-4 scoring, S-5 risk gates, S-6 data and lifecycle, S-7 privacy and safety, S-8 delivery.
**Status values:** Active, Superseded, Contested, Open.
**Created:** 2 August 2026, by extraction from six source documents.

---

## How this document was produced

Every entry below was extracted from an existing document, not invented. Each carries its source. This exists because of H-1.4: a decision that lives only in a chat thread or a narrative document cannot be read by the Planner, and a decision the Planner cannot read becomes an open question that stops the run.

Where two sources disagree, the entry is marked **Contested** and the conflict is stated rather than silently resolved. Where a decision is referred to but never actually made, it is not recorded here. Those are in `open-questions.md`.

**Source abbreviations**

| Key | Document |
|---|---|
| PRD | `Studier_Tone_Test_PRD_v2_ScoringAligned.md` |
| SCORE | `Tone_Test_Scoring_System_Explanation.md` |
| ARCH | `Studier_Tone_Test_Development_Archive.md` |
| PLAN | `Studier_Tone_Test_MVP_Build_Plan_v2_ScoringAligned.md` |
| OVER | `Studier_Tone_Test_MVP_Project_Plan_Overview.md` |
| INST | `Studier_Project_Instructions.md` |
| PROP | `tone-and-assurance-testing-proposal.html` |

---

## S-1 Scope and positioning

### S-1.1 Tone Test is a new study type inside Studier, not a separate product
**Status:** Active
**Source:** ARCH Phase 7, PRD §9
**Decision:** Tone Test is added alongside Tree Test as a second study type. Existing Tree Test behaviour remains unchanged.
**Reasoning:** Studier already provides the study lifecycle, public link model and response capture. Forcing tone testing into the IA testing model would distort both. A separate product would duplicate the platform.

### S-1.2 The tool supports judgement and does not replace approval
**Status:** Active
**Source:** PRD §4, §7.8, SCORE §2, ARCH Phase 3
**Decision:** Tone Test does not replace policy, legal, operational, privacy, comms or accessibility approval. This must be stated in the Builder, the dashboard and the Guide.
**Reasoning:** The scoring output looks authoritative. Without repeated explicit framing, teams will treat a Content Score as a sign-off. PRD Risk 2 and Risk 8 both turn on this.

### S-1.3 Product name is Tone Test
**Status:** Active
**Source:** ARCH Phase 8
**Decision:** Study type label is Tone Test. Page title is Create a Tone Test. Report wording is Tone and assurance summary.
**Reasoning:** Five names were considered. The assurance concept stays in the workflow, questions, gates and dashboard, so the interface label does not need to carry it. Tone and Assurance Testing remains the working name in the stakeholder proposal.

### S-1.4 MVP inclusions and exclusions are fixed
**Status:** Active
**Source:** ARCH Phase 16, PRD §7
**Decision:** Twenty-one MVP inclusions and nine exclusions are listed in ARCH Phase 16. The exclusions are AI rewrite, formal approval workflow, reviewer-only authentication, participant accounts, an Other role, complex statistical modelling, advanced charts, multi-round comparison dashboard, and collection of personal or case information.
**Reasoning:** The exclusion list is the scope control. Anything appearing in a plan that is on this list is scope creep and should be refused.

### S-1.5 AI features are excluded from MVP
**Status:** Active
**Source:** ARCH Phase 15, PRD §7.1, §27
**Decision:** No AI rewrite, no AI risk review, no AI comment summarisation in MVP. Listed as future enhancement only.
**Reasoning:** The blocker was not token cost, which was assessed as very low. It was privacy, governance, data handling and the risk of over-reliance on generated wording. Any future version must carry privacy warnings, human review, source labelling and controls preventing personal information reaching external services.

---

## S-2 Roles and participants

### S-2.1 Three default roles, no Other role
**Status:** Active
**Source:** ARCH Phase 9, PRD §10.4, §10.6, §13.4
**Decision:** Audience, Comms and Policy Reviewer, Plain Language and Accessibility Reviewer. No Other role in MVP.
**Reasoning:** Each group is qualified for different questions and should not be asked outside its expertise. An Other category would produce response data that is difficult to classify and would degrade dashboard clarity.

### S-2.2 Roles are selected through the public link, not through accounts
**Status:** Active
**Source:** ARCH Phase 9, PRD §10.2, §10.3
**Decision:** Participants do not register. They open one public link and select a role. This matches the existing Studier participant model.

### S-2.3 Roles can be disabled, at least one must remain active
**Status:** Active
**Source:** ARCH Phase 9, PRD §13.4
**Decision:** Creators enable or disable each default role. The system requires at least one active role.
**Reasoning:** The tool must stay lightweight. Simple tests may need only Audience and Comms. High-sensitivity content should use all three.
**Unresolved consequence:** See Q-6. Disabling a role removes the only respondent for some risk gates, and no source document addresses this.

### S-2.4 Role locks once questions begin
**Status:** Active
**Source:** ARCH Phase 9, PRD §10.9, §15.6, §15.7
**Decision:** A participant may change role before starting role-specific questions. Once answering begins, the role is locked for that session.
**Reasoning:** Protects data quality. PRD Risk 1 notes the countervailing cost, that a participant who misread the role description is stuck.

### S-2.5 Default question sets are confirmed as written
**Status:** Active
**Source:** OVER Decision 1, PRD §14
**Decision:** The rating and open question sets for all three roles in PRD §14 are reviewed and confirmed for use as written.
**Reasoning:** Recorded in OVER as one of two pre-development decisions that had to be resolved before build could start. Both are marked resolved.

### S-2.6 Creators may edit question wording but not remove scoring dimensions
**Status:** Active
**Source:** ARCH Phase 13, PRD §10.8, §13.5
**Decision:** Question wording is editable. Core scoring dimensions must remain available so the dashboard can produce consistent summaries.
**Reasoning:** Without fixed dimensions, cross-variant and cross-study comparison breaks.
**Weakness:** PRD §13.5 words this as creators "should not be encouraged to" remove dimensions, which is guidance rather than a constraint. PLAN Task 6 Risk 1 flags the same gap. Whether this is enforced or advisory is undecided.

---

## S-3 Wording variants

### S-3.1 Two to four variants per test
**Status:** Active
**Source:** ARCH Phase 10, PRD §10.10, §13.2
**Decision:** Minimum two, maximum four. Publishing is blocked outside this range.

### S-3.2 Two variant modes
**Status:** Active
**Source:** ARCH Phase 10, PRD §10.11, §13.3
**Decision:** Single variant random assignment, and compare all variants.
**Reasoning:** Single variant assignment is closer to the real service experience because users normally see one version of a page. Compare all variants suits smaller samples and direct comparison but behaves more like a preference test. Supporting both gives flexibility without turning Studier into a survey platform.

### S-3.3 Assigned variant must be stable across a session
**Status:** Active
**Source:** PLAN Task 13
**Decision:** In single variant mode the assigned variant ID is persisted so a page refresh does not reassign.

### S-3.4 Compare all variants randomises order and asks a preference question
**Status:** Active
**Source:** ARCH Phase 10, PRD §10.12, §10.13, §14.4
**Decision:** Display order is randomised per session and stored. A final question asks which version best supports the content goal, with a required explanation.
**Reasoning:** Order bias mitigation, recorded as PRD Risk 7.

### S-3.5 Variant fields
**Status:** Active
**Source:** PRD §13.2, §19.3
**Decision:** Label, variant text, optional internal note, display order, and `variant_source` defaulting to Manual.
**Note:** `variant_source` exists to support a future AI-generated variant path. It has no MVP behaviour.

---

## S-4 Scoring

### S-4.1 Three separate layers, not one total
**Status:** Active
**Source:** SCORE §4, PRD §11, OVER Decision 2
**Decision:** Content Score, Evidence Confidence and Risk Gate Status are three separate layers. They are not combined into a single number.
**Reasoning:** They answer different questions. Content Score is how the wording performed. Evidence Confidence is how far the result can be trusted. Risk Gate Status is whether the wording is safe to recommend. Merging them hides the distinction that makes the output explainable.

### S-4.2 Content Score default weights are 40, 35, 25
**Status:** Active
**Source:** SCORE §5, §11, PRD §11.1, §13.6, OVER Decision 2
**Decision:** Audience Evidence 40%, Comms and Policy Assurance 35%, Plain Language and Accessibility 25%.
**Reasoning:** Audience takes the largest share because content that is accurate but not understood has not worked. It is capped at 40% because audience preference cannot override policy, safety or operational limits. Comms and Policy sits just below at 35% because government wording must be publishable, but Tone Test is a research support tool rather than an approval workflow. Plain Language and Accessibility at 25% keeps that review stream materially influential without allowing it to replace the other two.
**Supersedes:** S-4.3.

### S-4.3 The four-group model with Evidence Confidence at 15% is superseded
**Status:** Superseded by S-4.2 and S-4.4
**Source of the superseded model:** ARCH Phase 11, SCORE §3, PROP
**Superseded decision:** Audience Evidence 35%, Comms and Policy Assurance 30%, Plain Language and Accessibility 20%, Evidence Confidence 15%.
**Reasoning for supersession:** Evidence Confidence is categorically different from the other three. The first three evaluate the wording. Evidence Confidence evaluates whether the test result is strong enough to rely on. Mixing them produces a number that cannot be explained.
**Contamination warning:** ARCH Phase 11 still presents the four-group model as a decision without a superseded marker, and `tone-and-assurance-testing-proposal.html` still displays 35/30/20/15 to stakeholders. Both need correcting. See D-2 in `open-questions.md`.

### S-4.4 Evidence Confidence is displayed separately as Low, Medium or High
**Status:** Active
**Source:** SCORE §7, §12, PRD §11.2, §7.10
**Decision:** Evidence Confidence is removed from the weighted Content Score and displayed as a separate three-level label.
**Reasoning:** As S-4.3. PRD Risk 5 records the failure mode being avoided, which is Evidence Confidence being read as a judgement on wording quality.

### S-4.5 Evidence Confidence is based on four factors
**Status:** Active
**Source:** SCORE §7.3, PRD §11.2
**Decision:** Role coverage, participant relevance, response volume, response quality.
**Unresolved:** Only role coverage and response volume are computable from stored data. See Q-4 and Q-5.

### S-4.6 Weights are set at study level and apply to every variant
**Status:** Active
**Source:** ARCH Phase 11, SCORE §6, PRD §11.1
**Decision:** One scoring model per study, applied to all variants in that study.
**Reasoning:** Comparison between Version A, B and C is only fair if the same weighting logic applies to each.

### S-4.7 Active weights must total 100% before publishing
**Status:** Active
**Source:** SCORE §6, PRD §10.15, §13.6, §21.8
**Decision:** The Builder shows a live total and blocks publishing unless active weights total exactly 100%. Disabling a role requires the creator to redistribute its weight.
**Reasoning:** PRD Risk 4. A disabled role leaving orphaned weight would silently distort every score in the study.
**Note:** PLAN Task 7 Risk 3 flags decimal and rounding handling as an implementation risk on the exact-100 rule.

---

## S-5 Risk gates

### S-5.1 Six fixed gates in MVP
**Status:** Active
**Source:** ARCH Phase 12, SCORE §8, PRD §11.3, §13.8
**Decision:** Policy accuracy, Operational promise, Safety risk, Harm blame and stigma, Privacy and consent, Accessibility and readability. Fixed for MVP, not configurable.
**History:** The first five were agreed in ARCH Phase 3. Accessibility and readability was added as a fixed gate during MVP definition.

### S-5.2 Gates use Pass, Concern, Fail
**Status:** Active
**Source:** ARCH Phase 12, PRD §11.3

### S-5.3 A failed critical gate overrides a high Content Score
**Status:** Active
**Source:** ARCH Phase 12, SCORE §8, PRD §11.3, §17
**Decision:** If a critical gate is marked Fail for a variant, that variant shows as Not recommended until revised regardless of Content Score.
**Reasoning:** A version can perform well with an audience and still be unsafe, inaccurate or unpublishable. This is the safeguard that stops the score becoming the decision.
**Blocking gap:** Which of the six gates are critical is never stated in any source document. PLAN Task 9 defers it with "mark gates as critical where needed". See Q-1. This rule cannot be implemented until it is answered.

### S-5.4 Gates are assigned to reviewer roles, not to Audience
**Status:** Active
**Source:** PRD §14.2, §14.3
**Decision:** Comms and Policy Reviewer answers Policy accuracy, Operational promise, Safety risk, Privacy and consent. Plain Language and Accessibility Reviewer answers Accessibility and readability, Harm blame and stigma, Privacy and consent. Audience answers no gates.
**Observation:** Harm, blame and stigma sits only with the accessibility reviewer, which is an unusual placement for a gate about harm. Whether deliberate is unconfirmed. See Q-14.

---

## S-6 Data and lifecycle

### S-6.1 New tables rather than reuse of Tree Test response tables
**Status:** Active
**Source:** PRD §19, PLAN Task 2
**Decision:** `tone_test_settings`, `tone_variants`, `tone_questions`, `tone_risk_gates`, `tone_responses`, `tone_gate_responses`. `studies` gains `study_type`. `participant_sessions` is extended or paralleled.
**Reasoning:** PLAN Task 2 Risk 2 states the trade directly. Reusing `final_responses` looks simpler but makes dashboard logic confusing.

### S-6.2 Existing studies default to tree_test
**Status:** Active
**Source:** PLAN Task 1
**Decision:** `study_type` takes `tree_test` and `tone_test`. All existing rows default to `tree_test`.

### S-6.3 Lifecycle reuses the existing Studier model
**Status:** Active
**Source:** ARCH Phase 7, PRD §12 Journey 7, PLAN Task 18
**Decision:** Draft, preview, publish, public link, close, clear data, reuse, export. Clearing removes responses and participant sessions but preserves setup, variants, questions, gates and weights.

### S-6.4 Evidence Confidence is calculated, not stored as a static value
**Status:** Active
**Source:** PLAN Task 2 Risk 4, Task 17 Risk 4
**Decision:** Evidence Confidence must reflect current response data at the time of viewing or export, not a value frozen at an earlier point.
**Reasoning:** Responses continue to arrive. A stored value goes stale and would contradict the dashboard.

### S-6.5 CSV export field list is defined
**Status:** Active
**Source:** PRD §18, PLAN Task 17
**Decision:** Fifteen fields listed in PRD §18, from study ID through submission timestamp.
**Implementation notes from PLAN Task 17:** CSV escaping must handle long text and commas. Formula injection should be considered for text beginning with formula characters.

---

## S-7 Privacy and safety

### S-7.1 No personal, contact, case or sensitive personal information
**Status:** Active
**Source:** ARCH product baseline, PRD §7.7, §20.6, §22
**Decision:** The tool does not collect names, contact details, case details or sensitive personal information. Welcome and privacy content warns participants. Default questions avoid asking for lived experience or personal harm.
**Reasoning:** Carried forward from the existing Studier principle rather than introduced for Tone Test.

### S-7.2 Victim information testing uses hypothetical scenarios or proxy participants
**Status:** Active
**Source:** PRD §22.4

### S-7.3 The tool must not become a case reporting or support channel
**Status:** Active
**Source:** PRD §22.5

### S-7.4 RLS protects setup and response data
**Status:** Active
**Source:** PRD §20.8, PLAN Task 3
**Decision:** Anonymous users may submit to published Tone Tests only. They cannot read dashboard data, cannot load unpublished, draft, closed or expired tests, and cannot update or delete. Owners and admins read and clear according to existing Studier rules.
**Risk carried from PLAN Task 3 and OVER Risk 1:** RLS defects commonly surface only in the deployed environment.

### S-7.5 Accessibility requirements are specified
**Status:** Active
**Source:** PRD §23
**Decision:** Keyboard-accessible role selection, clear variant headings and reading order, accessible rating labels, programmatically associated errors, no reliance on colour alone for gate status or Evidence Confidence, mobile support, plain language in instructions.

---

## S-8 Delivery

### S-8.1 Existing Tree Test behaviour must be preserved
**Status:** Active
**Source:** PLAN §2.1, Task 1, Task 20
**Decision:** Every task must leave Tree Test create, publish, complete, export, close and clear working. Full regression testing is a named task.
**Harness consequence:** This is the product-side statement of H-6.2 and H-6.6. See `codebase-survey.md` Section 3.1 for why the file structure makes it harder than it looks.

### S-8.2 Task 0 discovery is recorded as complete
**Status:** Contested
**Source:** OVER, current status section
**Claim:** Task 0, repository and database discovery, is complete and all pre-development decisions are resolved.
**Conflict:** PLAN §6 lists nine items still needed before the plan is implementation-ready, including schema SQL, RLS policies, route map, export implementation and deployment setup. PLAN Task 0 acceptance criterion 3 requires a safe branch or backup before schema changes, and criterion 4 requires a passing Tree Test smoke test. Neither is evidenced anywhere.
**Position:** Treat Task 0 as not complete for harness purposes. The survey in `codebase-survey.md` is a partial redo and is itself incomplete, as its Section 6 records.

### S-8.3 The existing working method conflicts with the harness
**Status:** Resolved 2 August 2026 by H-6.12. The existing method is retired in full. Local development environment, task branches, `dev` integration, Supabase development branch and local verification replace it. `Studier_Project_Instructions.md` becomes background; its rules, roles, tech stack and code conventions carry into the project `CLAUDE.md`, its Workflow section does not.
**Original status:** Contested
**Source:** INST, Workflow section
**Existing method:** No local development environment in active use. All database changes applied directly to the live Supabase project through MCP. All code pushed directly to the GitHub repository through MCP. Vercel auto-deploys. Review by opening the live URL.
**Conflict:** This contradicts H-3.5 branch model, H-6.5 Supabase development branch, H-6.8 local execution layer, and the deterministic verification in architecture Section 11, which needs a local build.
**Position:** These cannot both operate. See Q-12. This is the largest single decision outstanding and it blocks setup Stage 3 onward.

### S-8.4 Effort estimate
**Status:** Active
**Source:** OVER, time estimate
**Estimate:** 25 to 36 sessions across five milestones, being 8 to 14 weeks at two to three sessions per week. Milestone 2, creator setup, is the largest at 10 to 14 sessions and is flagged as not to be rushed.
**Note:** This estimate predates the harness. It assumes the direct-push method in S-8.3 and does not include harness setup, Playwright regression scaffolding, or the branch and migration work in Q-12 and Q-13.

---

## S-9 Verification

### S-9.1 The smoke test runs against the production database
**Status:** Active
**Decided:** 7 September 2026, by Cafe.
**Decision:** The critical path smoke test (`scripts/smoke/smoke.mjs`, `npm run smoke`) creates, publishes, answers, reads and deletes real studies in the production Supabase database. It does not wait for a separate development database.

**Why.** There is no Supabase development branch, and every environment shares one database (audit finding A7). Two ways out were priced. A real branch costs about USD 9.70 a month per branch and almost certainly requires the Pro plan at about USD 25 a month, because the `henex` organisation is on the free plan. A second free Supabase project costs nothing but has no migration tooling, so every schema change would have to be applied twice by hand, and free projects pause after seven days idle. Against that, the platform has no active users and is classified internal, so a stray row costs almost nothing. Waiting was judged the more expensive option.

**What it obliges.** Every object the script creates is named with the `SMOKE` prefix. Cleanup deletes by that prefix from a `finally` block, so a failed run still tidies up, and it sweeps before it starts as well as after it finishes, because a hard kill skips `finally`. `npm run smoke:clean` sweeps without testing. Cleanup goes through the application's own delete path, not SQL, so no database credentials enter the script or the repository, per CLAUDE.md section 2.

**What reverses it.** Any real study with external participants. At that point the classification changes, and a separate development database is required before this script runs again. A7 stays open for that reason and now has two dependants rather than one.

### S-9.2 Coverage is the full critical path, not the participant path alone
**Status:** Active
**Decided:** 7 September 2026, by Cafe.
**Decision:** The smoke test covers create, fill, save, publish, participate, dashboard, export and delete, for both study types, rather than the narrower participant-only path.
**Trade-off accepted.** Wider coverage means more selectors, and selectors are what broke the screenshot script three times in two days. The mitigation is that every selector lives in one `UI` block at the top of the script and each step carries a name, so a failure reports what the script was trying to do rather than only which locator timed out. The most fragile step is setting a tree task's target path, which requires clicking a node inside the tree widget because no path can be typed directly.
**Trigger.** Run before merging to `dev`. Automating it in CI was deferred: it needs credentials that cannot live in the repository.

### S-9.3 The smoke test deleted a real study on its first run
**Status:** Resolved 7 September 2026, recorded so the reasoning is not repeated.
**What happened.** The first version of `scripts/smoke/smoke.mjs` swept leftover fixtures by matching the substring `SMOKE` with Playwright's `hasText`. That matcher is case-insensitive, so it matched a real study titled "Smoke test, shopping menu" and deleted it on the first run. The delete cascaded to every child row, and the `henex` organisation is on the free plan, which has no point-in-time recovery. The study is unrecoverable.

**Cause.** The sweep was written against a description of what it should match, and the description was never tested against what it would actually match. The comment in the script said "by prefix" and the code said "case-insensitive substring anywhere in the card", and nothing forced those two to agree. The `removed > 20` ceiling did not help, because one deletion is already too many.

**Fix.** Cleanup now reads each card's title and tests it in JavaScript against `/^SMOKE \d{13} (tree|tone)$/`, anchored at both ends and case-sensitive, rather than delegating the match to a locator whose defaults can widen it. The ceiling dropped from 20 to 6. The pattern was checked against a table of real and near-miss titles before the script ran again.

**The general lesson, which is the reason this is in the decision log rather than only in a commit message.** A destructive rule must be verified against the data it will run on before it runs, not reasoned about. This is the same failure as the A2 correction on 6 September, where a recommendation about revoking database permissions was written from a description of the policies rather than from the policies themselves. That one was caught because a baseline query was run first. This one was not, because no equivalent check existed. Any future step in this repository that deletes, revokes or overwrites states what it will match, and that statement is tested against current data, before it is allowed to run.

### S-9.4 Cleanup reported success while leaving studies behind
**Status:** Resolved 7 September 2026.
**What happened.** The first fully passing run of the smoke test reported fourteen steps passed and "Cleanup removed 1 study". Two published tree tests were still in the production database, one from that run and one from the failed run before it. Step 01, the pre-run sweep, reported PASS both times without deleting anything.

**Cause.** Deleting a study calls `loadStudies()`, which raises a loading flag, and the grid renders only when that flag is down. The list therefore unmounts completely while it reloads. The sweep waited for `.study-card, .card`, which the "new test" card at the top of the page satisfies before any study has loaded, then counted cards, found none, and concluded there was nothing to delete. The same race hit again immediately after each deletion.

**Why it matters more than an ordinary bug.** The sweep is the only control standing between this script and the production database, and it failed silently in the direction of leaving data behind while reporting success. A destructive-adjacent step that cannot fail visibly is worth very little.

**Fix.** A `waitForList` helper waits for the grid or an explicit empty message, which is the difference between "the page has something on it" and "the list has finished". It runs after navigation and after every deletion. The sweep then re-reads the page and throws if anything matching the fixture pattern survives, so an under-delete now fails loudly instead of passing quietly.

**The general lesson.** This is the third instance in three days of the same shape: A2 on 6 September, the sweep matching in S-9.3, and this. Each time a check was written to a description of what should happen and never confirmed against what did happen. Verification steps in this repository assert their own result. A cleanup step that does not re-read the world afterwards is not a cleanup step.

### S-9.5 The smoke test cannot see anonymous-only faults
**Status:** Active limitation, recorded 7 September 2026.

**What was found.** A tone test participant saw "No wording is available for this test yet." above a full list of questions about wording they could not read. The runner asked for `select("*")` on `tone_variants` and `tone_test_settings`. `anon` is granted select on those tables one column at a time, deliberately withholding `internal_note`, `content_score_weights_json`, `evidence_confidence_settings_json` and `blame_flag_threshold`. Asking for every column asked for those too, so PostgREST refused the whole request with 42501 and the page received nothing. Live since the feature shipped.

**Why nothing caught it.** Both the operator opening their own link and the smoke test run as `authenticated`, which holds table-level select and can read every column. The fault only exists when signed out. This is exactly what CLAUDE.md section 5 says about verification: a session carrying authentication masks the failure. The section was right, and the smoke test was built without honouring it.

**The gap this leaves.** The smoke test signs in once and drives everything from that one signed-in browser context, including the steps labelled as the participant path. Those steps prove the participant screens render and submit, but they prove nothing about whether an anonymous visitor can use them. Every access fault that only affects `anon` is invisible to it, which is the category most likely to reach an outside participant.

**What would close it.** Run the participant steps in a separate browser context with no session, while the operator steps keep the signed-in one. Playwright supports this directly. Recorded rather than done, because it changes the shape of the script and should be its own task with its own verification.

**The general lesson, again.** Three times this week the same shape: a check written to describe an intent rather than to observe the thing it claims to check. Here the intent was "exercise the participant path" and what was actually exercised was "the participant screens, as an administrator".

### S-9.6 One person takes part in a tone test once
**Status:** Active
**Decided:** 7 September 2026, by Cafe, after finding it by testing the three role links one after another in one browser.

**Decision.** The current behaviour stands. A participant identifier is stored per study, not per role, so a browser that has completed a tone test as one role cannot answer another role's link. Nothing in the code changes.

**Why.** The three roles carry different weights in the Content Score. One person answering as all three would move the result on their own, and the result is the thing the product exists to produce. The alternative, keying the identifier by study and role together, makes that possible again.

**What it costs.** Someone who genuinely holds two roles, a communications reviewer who is also in the audience, cannot answer twice. Accepted.

**What was fixed rather than changed.** The page said nothing about any of this. It showed the ordinary "You have completed the test", which to a person sent an Agency link reads as though the Agency test were already finished. It now names the role already answered, says the link just opened cannot be answered, and says what to do. Only when the link names a different role than the finished session; an ordinary returning participant sees the ordinary thank you.

**Where the operator checks all three roles.** Preview, which walks the same screens, switches roles freely and records nothing. Written into the tone test guide, since the absence of that sentence is what sent the operator to the published links in the first place.

### S-9.7 decision-log.md is no longer protected
**Status:** Active
**Decided:** 7 September 2026, by Cafe.

This file was on the absolute deny list. The intent was that the party being recorded should not be able to rewrite the record. In practice it meant a decision reached in conversation could not be written down at the moment it was made, and the entry above is the one that ran into it. The operator judged that worse than the risk it guarded against.

`agents/` and `briefs/` stay protected. They define how the work is done rather than record what was decided, and nothing in a conversation needs to change them.

Recorded partly because this file was written to four times on 7 September while it was still on the deny list, before anyone noticed. Nothing enforces these lists in the current way of working; they hold only as far as they are honoured.

### S-9.8 An administrator sees management data and nothing else
**Status:** Active
**Decided:** 8 September 2026, by Cafe.

**Decision.** An administrator can no longer read another account's tests or the answers given to them. The test collection now has two regions: the tests the administrator owns, shown exactly as any owner sees their own, and every other account's tests as a read-only list of management data. Owner, type, status, a short reference, participant counts and dates. No title, no wording, no questions, no answers.

**Why.** A tone test exists to check sensitive wording before it is published. The wording under test is the most confidential thing on the platform, and an administrator had no reason to see any of it. The old arrangement was not an oversight, it was stated openly in the privacy policy, but stating a bad default plainly does not make it a good one.

**What was actually changed.** Migration 022 removes the `private.is_admin()` branch from 25 policies across 12 tables, five of which were `FOR ALL`. The two policies on `profiles` stay, because that table is how accounts are managed and how an owner's name is put on the list. The migration rewrites each policy by removing the administrator term rather than by writing a new expression, and aborts if `is_admin` survives anywhere in the result, so a policy of an unexpected shape stops the migration instead of being silently mangled.

**Measured before and after, on production, by impersonating the administrator against another account's study.** Before: the study row, its tree, 10 tasks, 3 questions, 251 answers, 25 sessions. After: 0 study rows, 0 answers, 0 sessions. The owner still reads all of their own. A draft owned by another account returns nothing at all.

**What replaces the access.** `admin_study_overview()`, a `security definer` function returning management data for studies the caller does not own, and only to an administrator. It deliberately returns neither the title nor the slug. The slug matters as much as the title: it is the public link, so an administrator holding it could read the whole test through the participant page, and the change would be theatre.

**The one exposure this does not close, which is not an administrator privilege.** A published study's tree, tasks and questions are readable by anyone holding the study id, because that is the policy that lets a participant take part without an account. Proven by querying as `anon`. Drafts are invisible. This is the cost of anonymous participation and is now stated in the privacy policy rather than left to be discovered.

**Privacy policy.** Both copies moved to version 2026-09-08. The administrator paragraph is rewritten, the Security section says the database restriction has no exception for administrators, and a paragraph records the date of the change and what was true before it, because anything tested before 8 September was visible under the old arrangement. Existing accounts keep the version string they agreed to; no re-consent flow exists and none was asked for.

**A paragraph dating the change was written into the policy and then removed, the same day, by Cafe.** It said that before 8 September an administrator could read every test and every response, and that anything tested before that date was visible under the old arrangement. The operator's position is that a privacy policy states what is true now, and that a running account of how the software was built does not belong in a document written for the people using it. The record of what changed, when and why is this entry. The version string on the policy is what tells a reader the wording moved, and the Changes section already says a material change brings a fresh request to agree.

### S-9.9 Microsoft Clarity, with all text masked
**Status:** Active
**Decided:** 9 September 2026, by Cafe, after being shown what the default would have sent.

**Decision.** Clarity runs on every page, operator and participant alike, in Strict masking mode, with `data-clarity-mask="True"` written onto the application root in `index.html` as well.

**Why both.** Strict is a setting in Microsoft's dashboard. Anyone with access to that dashboard can change it in one click, the change is silent, and nothing in this repository would record that it mattered. The attribute in the code cannot be changed from the dashboard, cannot be forgotten when a new page is added, and carries the reasoning next to it. Neither is redundant.

**What was nearly shipped.** The snippet as supplied uses Clarity's default Balanced mode, which masks only numbers and email addresses. Everything else on the page uploads to Microsoft and is readable in session replay. On most sites that is unremarkable. Here the page text is the product: the wording a tone test exists to check before publication, the task text, the navigation tree, the study titles, and on the administrator's own list the names and email addresses of other account holders. That is the same content removed from the administrator's reach the previous day in migration 022, and the privacy policy states it is readable by nobody but its owner. Balanced mode would have made both statements false, through a third party, with no database policy in the way.

**What is not at risk either way.** Clarity masks the contents of input boxes and drop-downs in every mode and does not allow that to be unmasked, so a participant's free text answers never leave the browser.

**What is given up.** Session replays show layout and behaviour, not words, which makes them harder to follow. Everything Clarity is actually installed for survives: clicks, scroll depth, rage clicks, dead clicks, drop-off and heatmaps. If the operator later wants navigation and button labels legible in replay, those specific elements can be unmasked without touching any test content. Offered, not done.

**Privacy policy.** Version 2026-09-09. A fifth service provider, holding data in the United States. Account holders and participants are each told, in their own section, what is recorded and that all text is masked before it is sent. Clarity does not receive the participant identifier and cannot connect what it sees to any account.

**Outstanding, for the operator.** The policy's own Changes section says a change affecting what is done with your information brings a fresh request to agree. Adding a third party recorder is that kind of change. There is no re-consent flow, and the accounts affected can be counted on one hand, so this is a decision to make rather than a mechanism to build. Recorded here so it is not lost.
