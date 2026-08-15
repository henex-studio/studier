# Tone Test Handover

**Written:** 3 August 2026, at the end of the setup phase.
**Purpose:** Everything worth carrying forward, in one place. Read this first.
**Status:** Product definition complete enough to build. No application code written yet.

---

## 1. What happened, in one paragraph

A day was spent on two things. Roughly a fifth of it produced the product definition below, which did not exist before and which blocked development. The rest built a governance system called the harness, which worked, was proven end to end, and has been shelved as disproportionate to a feature of this size. Section 6 records what it was, what it taught, and when it would be worth using again.

---

## 2. What Tone Test is

A second study type inside Studier, alongside Tree Test. It helps a team decide which of two to four wordings to publish, for content where getting it wrong causes harm.

The tool supports the decision. It does not make it and does not replace policy, legal, privacy, comms or accessibility approval.

### 2.1 Three parties, and why each is present

Each is present because they hold something the others cannot obtain.

| Party | Holds | Contributes | Can block? |
|---|---|---|---|
| **Audience** | They actually read it and reacted | Evidence | No |
| **Agency** | Knows the policy, the operational limits, what can be promised. Owns the content | Judgement | Yes |
| **Editor** | Knows what the content was trying to do and why it reads as it does | Diagnosis | No |

The Agency decides, because the content and the accountability are theirs.

**Weight and authority are separate.** The Audience carries the largest share of the score because content must first work for the people it is for. The Agency holds the only veto because the content is theirs. A variant can score well and still be blocked, which is the most common real situation.

**Who fills the Editor role.** A content professional who did not write the variants. A peer writer, a plain language specialist, an accessibility specialist. Defined by perspective, not job title, so it stays usable in a small team and can be switched off when nobody suitable exists.

### 2.2 What each party is asked

**Audience is asked what happened to them, not what should happen.** Did they understand it, do they know what to do next, do they trust it, did they feel respected or blamed. Open questions matter more than ratings here. "What do you think this message wants you to do" reveals more than five rating questions, because if most readers answer wrongly the wording has not worked.

They are not asked whether the policy is right, whether it can be published, or whether it is well written.

**Agency is asked whether they can stand behind it.** Accuracy against current policy, whether anything is promised that cannot be delivered, whether it survives publication review, safety, privacy, harm, and whether it serves the communication goal.

**Editor is asked to diagnose.** Whether the version achieves the content goal, whether the information is ordered so it can be followed, whether anything is redundant or unnecessarily technical, whether it works on a phone and across a range of reading abilities.

The Audience reports the symptom, "I could not follow this". The Editor supplies the cause, "because the second paragraph mixes the conditions with the exceptions".

### 2.3 Wording variants

Two to four per study. Each has a label, the wording itself, and an optional internal note.

Two modes:

**Single variant, randomly assigned.** Each participant sees one version. Closer to the real experience, since users normally see one version of a page. The assignment is fixed for the session, so a refresh does not change it.

**Compare all variants.** Each participant sees every version, in a random order that is recorded. Ends with a preference question and a required explanation. Suits smaller samples but behaves more like a preference test.

### 2.4 Rating scale

Five points, "Strongly disagree" at 1 through "Strongly agree" at 5. A midpoint at 3 is included, because genuine neutrality is a real answer and removing it manufactures a preference. A "Not applicable" option is available and excluded from all calculations, because some questions do not apply to some content.

The same scale applies to every question and every role. Different scales across roles make cross-role aggregation unstable, especially where a role has few respondents.

### 2.5 Scoring, three separate layers

They answer different questions and are never combined into one number.

**Content Score** says how the wording performed.
**Evidence Confidence** says how far the result can be trusted.
**Risk Gate Status** says whether it is safe to recommend.

#### Content Score

Three weighted groups, adjustable per study, and publishing is blocked unless the active weights total exactly 100.

| Group | Default |
|---|---|
| Audience Evidence | 40 |
| Agency Assurance | 35 |
| Content Quality | 25 |

Calculation: within each group take the mean of all non-null ratings, normalise it to a 0 to 100 range with `(mean − 1) ÷ 4 × 100`, then apply the weights and sum.

**When a group has no responses**, its weight is removed and the remaining weights scale up proportionally to total 100. It is never treated as zero. Treating it as zero would score an unreviewed variant below a badly reviewed one, and would fold evidence quality back into Content Score, which is exactly what the three-layer split exists to prevent. The absence shows up in Evidence Confidence instead.

Worked example, verified independently: 34 Audience ratings summing to 131 give a mean of 3.853 and a group score of 71.3. Ten Agency ratings summing to 37 give 3.7 and 67.5. With Content Quality absent, the weights become 53.33 and 46.67, and the Content Score is 69.5.

#### Evidence Confidence

Shown as Low, Medium or High. Not part of Content Score.

**High.** At least 5 non-null responses per active role group per variant, and an imbalance ratio of 0.5 or better.
**Medium.** At least 3 non-null responses in at least one active role group for that variant.
**Low.** Anything below Medium, including no responses at all.

The imbalance ratio is the smallest active role group's response count divided by the largest, for that variant. Below 0.5 downgrades High to Medium. Below 0.2 downgrades Medium to Low.

A warning appears when any active role group has fewer than 3 responses for a variant. It blocks nothing.

Thresholds are fixed and do not appear in the Builder. They should be written as named constants so they can be made configurable later without a schema change.

#### Risk gates

Six, fixed. Four are critical, meaning a Fail produces "Not recommended until revised" regardless of score.

| Gate | Critical | Answered by |
|---|---|---|
| Policy accuracy | Yes | Agency |
| Safety risk | Yes | Agency |
| Privacy and consent | Yes | Agency |
| Harm, blame and stigma | Yes | Agency |
| Operational promise | No | Agency |
| Accessibility and readability | No | Editor |

Each is answered Pass, Concern or Fail.

**Harm, blame and stigma is critical because harm to a vulnerable reader is not reversible.** A policy inaccuracy misleads and can be corrected. A sentence that makes someone feel blamed does its damage at the moment it is read.

**Accessibility and readability is not critical**, even though New Zealand government accessibility requirements are mandatory. The standards govern page properties such as contrast, semantic markup and assistive technology compatibility, verified by automated scanning. This gate reviews copy readability, which no standard constrains. Marking it critical would imply a compliance judgement it does not make. The Editor's instructions must say so explicitly, since silence would mislead.

**The Audience answers no gates.** A gate is a judgement that something should not be published, and the Audience supplies evidence rather than judgement. Their signal is preserved differently: when the average score on "This message does not make me feel blamed" falls below a threshold, the system flags the Harm, blame and stigma gate for Agency attention. The Agency still judges.

**Disabling a role does not block the study**, but shows a warning naming the gates that will have no respondent and marking which are critical. The creator confirms. The dashboard marks those gates "Not covered", never "Pass".

**The Agency answers five of six gates and all four critical ones.** This is what "the agency decides" means once written into a mechanism. It also makes this the role the process can least afford to lose, which the interface should reflect.

#### Recommendation status

Five labels, produced by evaluating rules in priority order. The first match wins.

Content Score bands: strong at 70 and above, mixed 50 to 69.9, weak below 50.

1. **Not recommended until revised.** Any critical gate is Fail.
2. **Insufficient evidence.** Evidence Confidence is Low and no critical gate failed.
3. **Recommended for review.** Score 70+, Evidence Medium or High, and no gate is Fail at all.
4. **Recommended with caution.** Score 50+, Evidence Medium or High, at least one gate at Concern, none at Fail.
5. **Needs revision.** Score below 70, Evidence Medium or High, no gate at Fail.

Rule 3 withholds the top status when any gate fails, including a non-critical one. A reviewer who marks Fail believes there is a real problem, and a status that ignores it tells the team the Fail can be disregarded. The consequence is that this tool is deliberately conservative, and the threshold reviewers apply when choosing Fail over Concern will shape results. Watch this during the first real study.

### 2.6 Lifecycle

Reuses the existing Studier model: draft, preview, publish, public link, close, clear data, reuse, export.

Participants need no account. They open one public link, read the welcome and privacy content, choose an active role, and answer. They may change role before answering; once answering starts the role is locked for that session.

Clearing responses removes participant sessions and response data, and preserves setup, variants, questions, gates and weights.

### 2.7 Publishing checks

Blocked if welcome or privacy content is missing, scenario or content goal is missing, there are fewer than two or more than four variants, no role is active, required role questions are missing, active Content Score weights do not total 100, or the closing time is in the past.

### 2.8 Privacy

No names, contact details, case details or sensitive personal information. Welcome and privacy content warns participants. Default questions avoid asking for lived experience or personal harm. Victim information testing uses hypothetical scenarios or carefully designed proxy participation. The tool must not become a case reporting channel.

Public participants may submit only to published studies, cannot read dashboard data, and cannot load unpublished, draft, closed or expired studies. Owners and admins read and clear under existing Studier rules.

### 2.9 Not in scope

AI rewriting. Formal approval workflow. Reviewer authentication. Participant accounts. An "Other" role. Complex statistics or advanced charts. Multi-round comparison. Collection of personal information.

---

## 3. What is still undecided

Three, none of which block a start.

**What "sensitivity level" does.** The field appears in the original specification with no stated values and no effect on anything. Either define it or drop it. A stored field that does nothing will attract behaviour later.

**Whether a variant can be deleted after publishing when responses exist.** Deleting one orphans its responses. Block it, or define what happens to the data.

**How participant relevance and response quality feed Evidence Confidence.** The original design named four factors; only two are computable and only those two are used. Whether to add researcher judgement can wait until a real study has run.

### Document conflicts not yet repaired

The development archive still presents the superseded four-group weighting of 35, 30, 20 and 15 as current, and still uses the previous role names. It is history and should get a header note rather than an edit.

The role rename to Audience, Agency and Editor has not been propagated to the PRD, the build plan, the scoring explanation or the scoring options analysis. Until it is, those documents use the old names.

Two documents were retired to `docs/tone-test/archive/`: the stakeholder proposal page, which carried the superseded weights, and the project plan overview, whose task numbering did not match the build plan.

---

## 4. The Studier codebase, as found

React with Vite. Supabase for data, authentication and access control. Vercel hosting. Around 35 real files.

```text
src/App.jsx                     routing
src/pages/StudyBuilderPage.jsx  Tree Test builder, the largest file
src/pages/StudyListPage.jsx     study collection
src/pages/TestRunnerPage.jsx    public participant runner
src/pages/PreviewRunnerPage.jsx creator preview
src/pages/DashboardPage.jsx     results
src/pages/GuidePage.jsx         in-app guide
src/pages/{Consent,Register,Login,TreeView}
src/lib/{supabase,csvExport,matching,participantId,treeParser}.js
src/style.css                   all styling, one file
supabase/*.sql                  seven loose files, no migration framework
```

**No per-feature directories.** Each route is one large page component and Tree Test logic is not separated from platform logic. Tone Test will need to touch `App.jsx`, `StudyListPage`, `StudyBuilderPage`, `TestRunnerPage`, `PreviewRunnerPage`, `DashboardPage`, `GuidePage`, `csvExport.js` and `style.css`. Keep those edits to dispatch that routes into new files under `src/pages/tonetest/`, `src/lib/tonetest/` and `src/components/tonetest/`.

**No tests, no type checking, no lint.** The only automated check is `vite build`, which for a single-page app proves the code parses and little else. Whether Tree Test still works can only be established by using it.

**Fixed during setup.** A `.gitignore` was added, `node_modules` was removed from version control, which took the tracked file count from 4950 to 36, and all seven dependencies were pinned to the versions already in use rather than `latest`.

**Branches.** `main` is production. `dev` was created for integration. The tag `pre-harness-baseline` marks the state before any of this work and is the restore point of last resort. Every commit before it says "Add files via upload", so it carries no usable history.

---

## 5. Where the decisions live

| Question | File |
|---|---|
| What was decided about the product, with sources | `Work/Harness/projects/studier/harness-docs/decision-log.md` |
| What is still open | `Work/Harness/projects/studier/harness-docs/open-questions.md` |
| Scoring options and their trade-offs | `harness-docs/scoring-options.md` (this folder) |
| Original product specification | `docs/tone-test/Studier_Tone_Test_PRD_v2_ScoringAligned.md` |
| Task sequence, 21 tasks numbered 0 to 20 | `docs/tone-test/Studier_Tone_Test_MVP_Build_Plan_v2_ScoringAligned.md` |
| Reasoning behind the three-layer scoring model | `docs/tone-test/Tone_Test_Scoring_System_Explanation.md` |
| How the thinking developed | `docs/tone-test/Studier_Tone_Test_Development_Archive.md` |
| Retired material | `docs/tone-test/archive/` |

Where the decision log and the PRD disagree, the decision log is current. The PRD predates most of these decisions.

**Note added 15 August 2026.** The decision log and open questions register live in the separate `Work/Harness/projects/studier` folder, not in this product repository, because they are part of the harness governance record rather than product code. This document and `docs/tone-test/` are the working reference for day-to-day development; the harness folder is the archive of how the decisions were reached.

---

## 6. The harness experiment

### What was built

A governance system: protected file rules enforced by a hook, a task branch model with manual promotion to production, four subagents with per-role model allocation, a decision log, an open questions register, and an approval gate before and after each task.

### What was proven

All of it worked. The hook blocked a real edit attempt to protected code, including from a subagent. Per-role model allocation was verified from session transcripts, with the planner running on Opus and the reporter on Haiku as declared. One task ran the full loop from brief to plan to build to independent evaluation, and the evaluation was substantive: it recomputed a worked example in Python rather than reading that the arithmetic existed, and it found a genuine gap in the recommendation rules that only appeared when boundary inputs were constructed.

### What it cost

One task through the full loop consumed roughly 133,000 tokens across the three agents and took about half an hour of elapsed time, to produce one document. The same document in direct conversation would have taken perhaps 30,000. Approvals and permission prompts interrupted the operator more than a dozen times.

Four contradictions between role definitions and instructions surfaced during execution, each costing a round trip. All four were introduced during configuration and none was visible on review.

### Why it was shelved

The operator's assessment: a large organisational structure built for a job one person could do. That is accurate for a feature of this size.

The deeper reason is that the harness's central control does not yet work. The Evaluator's job is to catch what the builder got wrong, but with no automated tests it is one model reviewing another, which the architecture itself classifies as weak evidence. Its value depends on deterministic checks that were never built. Until they exist, the most expensive part of the system is producing opinions rather than evidence.

### What is worth keeping regardless

The decision log and the open questions register. These produced the value: 41 decisions extracted from six documents with their sources, 15 unanswered questions found before they blocked code, and seven contradictions between documents identified, including superseded weights still being shown to stakeholders. None of this requires subagents or approval gates. It requires writing decisions into files when they are made.

The branch model and the rollback tag. Both are nearly free and both protect production.

### When to try it again

When the project is large enough that one person cannot hold it, when multiple people or long-running sessions are involved, or when automated tests exist so that independent evaluation has something real to read. The architecture and every decision behind it are preserved in `harness-core/` inside the `Work/Harness` folder, and the setup is reproducible from the checklist there.

---

## 7. How work proceeds from here

Direct conversation. Code is written straight into the repository, committed and pushed to `dev` through the connector, and Vercel produces a preview URL. The operator opens the preview and gives feedback on what they see. No terminal, no commands, no reading code.

Database changes are applied directly, since Tone Test only adds tables and adding a table cannot break Tree Test. Each change is described before it is applied.

Nothing reaches production until the operator says so. That is the protection that matters, and it costs one extra word.

Work is recorded in a development log: what was done, what the operator saw, what comes next.

**Note added 15 August 2026.** This project now lives in two places with a clear split. Product code, this handover, the development plan and log, and the scoring options analysis are in `Work/Studier/code/Studier`, connected to GitHub as `henex-studio/studier`. The harness mechanism itself, the decision log and the open questions register are in `Work/Harness/projects/studier`, kept for reference and for reuse on a future larger project. The assistant writes product code directly into the Studier folder; GitHub pushes from that folder are done by the operator through GitHub Desktop.
