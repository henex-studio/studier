# Build state, 7 September 2026

**Purpose.** What is built, what is not, and what someone needs to know before promoting `dev` to `main`. Written because the question "is development finished" could not be answered from the documents in this repository without reading the code, and the answer turned out to be yes with conditions.

**Status of `main`.** Still the pre-harness upload. It carries no Tone Test, no privacy policy, no password reset, and none of this week's work. Everything below lives on `dev`.

---

## 1. Is Tone Test finished

Yes, as a feature. All six milestones in `DEV-PLAN.md` are recorded complete in `DEV-LOG.md`, and the code backs that up: builder, participant runner, scoring, dashboard, CSV export, lifecycle, guides and preview all exist and all run.

Two product questions remain genuinely open, Q-5 and Q-8 in `open-questions.md`. Both concern whether Evidence Confidence should admit a researcher's judgement rather than being computed alone. Neither blocks anything that currently works. Every other question that file lists as open was answered on 30 August in `HANDOVER.md` section 2.5; the header of `open-questions.md` says so, and anyone reading past that header without reading it will reach the wrong conclusion.

**One thing to know about the scoring.** The blame flag question is found by its position, the sixth Audience rating question, because rating questions have no stable key. `scoring.js` says so at the point where it matters. If question reordering is ever added to the builder, that breaks silently and the blame flag starts reading the wrong answer.

---

## 2. What this week changed, and why it matters for a merge

Twenty-two commits. Five migrations, 017 to 021, all applied to production already, because there is no separate database to apply them to.

**Three faults were live and are now fixed.** Each had been in production for weeks and none was visible to a signed-in operator:

Every tone test role link deadlocked on "Starting..." and no participant could reach the questions. Broken since the feature shipped.

Every anonymous participant saw "No wording is available for this test yet." above a full page of questions about wording they could not read. The runner asked for columns it was not entitled to and the whole request was refused. Also broken since the feature shipped.

Anyone could list every published test, with titles and link codes, without holding a link, by asking the API. Confirmed with a real unauthenticated request before and after fixing.

**The pattern they share is the thing to carry forward.** All three only existed when signed out, and every tool for checking the product ran signed in. That includes the smoke test written this week. It is recorded as S-9.5 in `decision-log.md` along with what would close it.

---

## 3. What is deliberately not done

**A6, duplicate permissive policies.** Skipped on the operator's decision. It changes the shape of an access rule, and on four studies with no traffic the performance gain is zero. Risk without benefit, today.

**Three unused indexes.** Not dropped. "Never used" on a database with no traffic says the feature has not been exercised, not that the index is useless.

**A7, no separate development database.** Still open. Priced this week: a Supabase branch needs the Pro plan, a second free project has no migration tooling. Everything, including the smoke test, writes to production. Acceptable while there are no users and the classification is internal. It is the first thing to revisit if a real study runs.

**Q-16, the local environment has never run.** There is no `.env.local`, only the example. `CLAUDE.md` section 5 describes local verification that has never happened. Either stand it up or correct the section.

**The smoke test's signed-in blind spot, S-9.5.** Known, recorded, not fixed. It cannot see the category of fault that produced two of this week's three live bugs.

---

## 4. Structure findings, none blocking

`TestRunnerPage` and `PreviewRunnerPage` share fourteen identically named functions and differ by 158 lines. They drifted apart this morning, were realigned the same day, and will drift again. The tone test avoided this by taking a preview mode on one component instead of a second page, which is the pattern to copy when these two are finally merged.

`isPastExpiry` exists in five files. Checked character by character: all identical today. `navigateTo` in nine, also identical. No live inconsistency, five and nine chances of one.

The two test types are not symmetrical. Tone has a proper `src/lib/tonetest/`; tree's publish checks sit inside a 757 line page. `ToneBuilderPage.jsx` is 1051 lines with four editors inside it.

`PublicTestRouter.jsx` serves both types from a tone-only folder, which the file explains: the writable directories were all named for Tone Test. That constraint is gone as of today's path list rewrite.

---

## 5. Before merging to `main`

1. Run `npm run smoke`. It covers the operator path end to end and cleans up after itself.
2. Run `npm run spacing`. New this week. No sign-in needed.
3. Open a tone test preview and check the participant count on its dashboard does not move. Preview must never write.
4. Open a published test link in a private window and complete it. This is the check that matters, and the only one of the four that today's faults would have failed.

Migrations need no action at merge. They are already applied to the only database there is.
