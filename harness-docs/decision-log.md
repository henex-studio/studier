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
