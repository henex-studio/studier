# Studier Tone Test MVP — Project Plan Overview

## Scope

Tone Test is a new study type being added to the existing Studier platform. It requires a new builder, participant flow, scoring model, risk gate logic, and results dashboard. The work spans database design, access control, creator tools, participant experience, and results reporting.

The build plan has 18 development tasks organised into 5 milestones. Task 0 (repository and database discovery) is complete.

## Pre-development decisions

Two product decisions were required before development could begin. Both are now resolved.

### Decision 1: Default role question text

The three default roles (Audience, Comms and Policy Reviewer, Plain Language and Accessibility Reviewer) each have a set of default questions defined in the PRD. These have been reviewed and confirmed for use as written.

### Decision 2: Scoring model and Evidence Confidence

The scoring model uses three separate layers, not a single weighted total.

1. Content Score evaluates how well each wording variant performed. It is weighted across three groups: Audience Evidence (40%), Comms and Policy Assurance (35%), Plain Language and Accessibility (25%). Creators can adjust these weights at study level. Active weights must total 100% before publishing.

2. Evidence Confidence evaluates how reliable the result is. It is shown separately as Low, Medium, or High. It is not part of the weighted Content Score. It is based on role coverage, response volume, participant relevance, and response quality.

3. Risk Gate Status evaluates whether the wording is safe to recommend. Six fixed gates use Pass, Concern, or Fail. A critical gate failure overrides a high Content Score.

This three-layer model is confirmed and documented in the PRD v2 and Scoring System Explanation.

---

## Milestone 1: Platform Foundation

**What happens:** The database gets new tables for Tone Test data. Studier learns that more than one study type exists. The create new test flow asks creators to choose between Tree Test and Tone Test.

**Tasks:** 1, 2, 3

**Your effort:** Run SQL in the Supabase dashboard. Confirm the updated create flow works in the browser.

**Estimated sessions:** 3 to 4

---

## Milestone 2: Creator Setup

**What happens:** The Tone Test Builder is built from scratch. This is the largest milestone. It covers the main configuration screen, wording variant management, role enable and disable controls, default question templates, Content Score weight setup, Evidence Confidence guidance, risk gate configuration, role-based preview, and publishing checks.

**Tasks:** 4, 5, 6, 7, 8, 9, 10

**Your effort:** Test each section as it is built. Give feedback on layout and wording. Content decisions (default question text, role descriptions) are already confirmed.

**Estimated sessions:** 10 to 14

**Note:** This milestone has the most moving parts. The builder logic affects everything downstream.

---

## Milestone 3: Participant Experience

**What happens:** The public test link detects the study type and routes participants into the Tone Test flow. Participants select a role, see the correct variant or variants, answer role-specific questions including risk gates, and submit.

**Tasks:** 11, 12, 13

**Your effort:** Test the flow as a participant in different roles. Confirm variant assignment works. Confirm submissions save correctly.

**Estimated sessions:** 5 to 7

---

## Milestone 4: Results and Lifecycle

**What happens:** The creator dashboard shows three separate layers: Content Score by variant and role, Evidence Confidence as Low, Medium, or High, and Risk Gate Status by variant. Open comments, preference results, recommendation status labels, and CSV export are included. Close, clear, and reuse behaviour aligns with existing Tree Test lifecycle.

**Tasks:** 14, 15, 16

**Your effort:** Check that dashboard numbers match submitted data. Check that the three scoring layers display separately. Test the export in Excel.

**Estimated sessions:** 4 to 6

---

## Milestone 5: Guide and Release Readiness

**What happens:** The in-app Guide is updated with Tone Test documentation, including the three-layer scoring model explanation. Full regression testing covers both Tree Test and Tone Test.

**Tasks:** 17, 18

**Your effort:** Review Guide content. Run the test scenarios listed in the build plan. Report anything that does not work as expected.

**Estimated sessions:** 3 to 5

---

## Time estimate

| Milestone | Sessions |
|---|---|
| 1. Platform Foundation | 3 to 4 |
| 2. Creator Setup | 10 to 14 |
| 3. Participant Experience | 5 to 7 |
| 4. Results and Lifecycle | 4 to 6 |
| 5. Guide and Release | 3 to 5 |
| **Total** | **25 to 36** |

A session is one focused conversation, typically covering one task or part of a task. At two to three sessions per week, the project takes 8 to 14 weeks. At a faster pace, 6 to 10 weeks is realistic. Milestone 2 should not be rushed.

---

## Responsibilities

| You | AI |
|---|---|
| Make product and content decisions | Write all code |
| Run SQL in Supabase dashboard | Design database schema and RLS policies |
| Test in the browser as creator and participant | Diagnose bugs from your descriptions |
| Commit and push code via VS Code | Provide complete files ready to paste |
| Review outputs and flag problems | Fix problems when found |

You do not need to read or interpret code. You need to follow step-by-step instructions accurately and report what you see.

---

## Risks

1. **RLS issues.** Access control bugs often only appear in deployed environments. Allow extra time in Milestones 3 and 4.
2. **Builder complexity.** Milestone 2 has the most parts. If scoring weight logic or question templates need rethinking after build, that adds time.
3. **Dashboard scoring calculation.** Content Score, Evidence Confidence, and Risk Gate Status must display as three separate layers. If the separation is not clean in the data model, the dashboard will need rework.
4. **Evidence Confidence automation.** Some factors (role coverage, response volume) can be calculated automatically. Others (participant relevance, response quality) may need researcher judgement. The boundary should be defined before Task 8.

---

## Current status

Task 0 complete. All pre-development decisions resolved. Ready to begin Milestone 1, Task 1.
