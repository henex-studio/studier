# Audit remediation plan, round one

Turns the findings in `AUDIT-2026-09-05.md` into ordered tasks. Written 5 September 2026, for execution in a later session after the operator switches model.

**In scope this round.** A1, A2 and A3 security hardening. B1, B2, B3, B4, B5, B7 and B8 interface work. D1, D2 and D3 documentation.

**Deferred to round two.** C1 and C2 accessibility, and A4, A5 and A6 database performance. Both groups are worth doing before any study runs with external participants, neither blocks the merge to `main`.

**Deferred until after the merge.** A7, the missing Supabase development branch, which is a governance question rather than a code change.

**No action.** A8, the duplicate applied migration, is harmless and recorded so nobody investigates it twice.

---

## Decisions already taken

The operator settled these on 5 September, so no task below is blocked.

1. The Preview button on a tone test card is removed. Preview stays available as the "Preview by role" section inside the builder.
2. The guides document role links only. The bare link still works and still shows the self-select screen, but teaching two methods would leave a new user choosing between them for no reason.
3. Version history gains a Platform group above the two existing test type groups. It carries changes that belong to neither test type, with its own version numbers. Role links, the wording strip and the editor footer stay in Tone tests, as v4.05.
4. This round covers security, documentation and interface. Accessibility and database performance wait.

---

## Constraints that apply to every task

Work on a task branch, merge to `dev`, never to `main`.

Nine shared files require operator approval before editing, listed as `review_paths` in `project-config.json`. Of those, this plan touches `src/App.jsx`, `src/pages/StudyListPage.jsx`, `src/pages/StudyBuilderPage.jsx`, `src/pages/RegisterPage.jsx`, `src/pages/PreviewRunnerPage.jsx` and `src/style.css`. The review line budget is 30 lines per file. Two tasks below would breach that if written carelessly, so both put their real code in a new component and leave only a small dispatch behind. Where a task can be written either way, write it the way that keeps the shared file small.

Build checks run locally. Operator acceptance runs on the Vercel preview. Anything touching anonymous access must be checked on the preview, because a local session carries residual authentication that hides the fault.

Each task ends with a build, a commit, and a report naming the review path files it touched.

---

## Task 1. Harden the three access control functions

Covers A1 and A2. Do this first and on its own.

`is_admin()`, `is_study_owner(uuid)` and `is_study_published(uuid)` are `SECURITY DEFINER` with no fixed search path, and all three are callable by anonymous visitors. Every row level security policy in the database calls at least one of them.

Write one migration in `supabase/migrations/`, numbered 016. It adds `SET search_path = public` to each of the three, recreating them with their existing bodies unchanged, and revokes execute from `anon` on all three. Do not change what any of them returns.

**Files.** `supabase/migrations/20260905_016_harden_access_control_functions.sql`, writable.

**Model.** Opus with extended thinking. This is access control.

**Why it goes first and alone.** These functions decide who can read what. A mistake either locks every account out of its own data or exposes data across accounts, and it would not be obvious from the interface which had happened. Keeping it in its own commit means it can be reverted without unpicking interface work.

**Verify.** Re-run the Supabase security advisor and confirm the three `function_search_path_mutable` warnings and the three matching `anon` warnings have gone. Then, on the Vercel preview, not locally: sign in and confirm the test collection shows the same studies as before, open a dashboard and confirm responses still load, and open a published test link in a private window and complete it as an anonymous participant. The last check is the one that matters, and it does not reproduce locally.

**Done when.** Advisor is clean on those six, and all three checks pass on the preview.

---

## Task 2. Remove the Preview button from tone test cards

Covers B1.

`previewPath()` sends a tone test to the builder, so Edit and Preview open the same page. Remove Preview for tone tests in both the card view and the list view. Leave it untouched for tree tests. If `previewPath()` ends up with no tone branch left, delete the branch rather than leaving it returning the builder path.

**Files.** `src/pages/StudyListPage.jsx`, review path. Expect under ten lines changed.

**Model.** Sonnet.

**Verify.** A tone test card shows Edit, Dashboard, Open link, Close, the role link row and Delete, with no Preview. A tree test card is unchanged.

---

## Task 3. Give the registration form real labels

Covers B5.

`RegisterPage.jsx` uses placeholder text alone for display name, email, password and invite code. The label vanishes as soon as anyone types, and screen readers get nothing dependable. `LoginPage.jsx` already does this correctly with `<label className="form-block">` wrapping a `<span className="form-label">`. Copy that pattern exactly rather than inventing a variant. Do the same for the new test title field in `StudyListPage.jsx`.

Keep the placeholders or drop them, either is fine, but the label must be a real label.

**Files.** `src/pages/RegisterPage.jsx` and `src/pages/StudyListPage.jsx`, both review paths. Around twenty lines each.

**Model.** Sonnet.

**Verify.** Every field has a visible label that stays visible while typing. Registration still succeeds end to end on the preview.

---

## Task 4. Three small corrections

Covers B2, B7 and B8. One commit is fine.

First, guard the tree test preview against a tone test id. `PreviewRunnerPage.jsx` has no `study_type` check, so `/preview/<a tone test id>` tries to render a tree test. `DashboardPage.jsx` already dispatches on study type correctly, so copy that shape. Sending it to the tone builder is an acceptable outcome; rendering a broken tree test is not.

Second, surface the two discarded errors. `ToneTestLinks.jsx` and the question loader in `ToneTestRunnerPage.jsx` both take only `data` from the Supabase response, so a failed query renders as an empty result. In the runner that shows "No questions found for this role", which blames the wrong thing. Read the error and show it.

Third, change `@media (max-width: 640px)` at `src/style.css` line 284 to 639. At exactly 640 pixels it currently collides with the `min-width: 640px` block and the winner depends on source order. Every other mobile query in the file already uses 639.

**Files.** `src/pages/PreviewRunnerPage.jsx` and `src/style.css`, review paths, both small. `src/components/tonetest/ToneTestLinks.jsx` and `src/pages/tonetest/ToneTestRunnerPage.jsx`, writable.

**Model.** Sonnet.

**Verify.** Visit `/preview/` with a tone test id and confirm it no longer renders a broken tree test. Resize a browser to exactly 640 pixels and confirm one layout, not a mixture.

---

## Task 5. Add a not-found page

Covers B3.

`App.jsx` currently ends by returning the test collection, so every unrecognised path for a signed-in user silently shows the study list, and every unrecognised path for a signed-out user shows sign-in. A stale bookmark or a mistyped address looks like a working page.

Create `src/pages/NotFoundPage.jsx` holding the whole page, then change `App.jsx` in two places only: add an explicit route for `/admin` returning `StudyListPage`, and change the final fallthrough to return `NotFoundPage`. The new page needs a short explanation and a link back to the test collection.

Check before writing that `/admin` is the only path currently relying on the fallthrough. Search for `href="/admin"` and for `navigateTo("/admin")` first, and route anything else you find.

**Files.** `src/pages/NotFoundPage.jsx`, new, defaults to ask so flag it. `src/App.jsx`, review path, expect under ten lines.

**Model.** Sonnet.

**Verify.** Every existing route still resolves: sign in, consent, register, forgot and reset password, the collection, both builders, both dashboards, both guides, version history, account, preview, privacy and a public test link. Then confirm a nonsense path shows the new page. This task changes routing for the whole site, so walk the full list rather than sampling it.

---

## Task 6. Replace the four native browser dialogs

Covers B4. The largest task here.

`window.prompt` and `window.confirm` appear in four places: clearing test data and deleting a study in `StudyListPage.jsx`, leaving with unsaved changes in `StudyBuilderPage.jsx`, and one in `ToneBuilderPage.jsx`. They are unstyled system boxes that cannot be made to match the site, and some browsers suppress them. The account deletion flow already does this properly with an in-page typed confirmation.

Build one `src/components/ConfirmDialog.jsx` on the existing modal pattern, the same backdrop and panel classes `PrivacyPolicyModal.jsx` and `FeedbackButton.jsx` use. It needs two modes: a plain confirm with a cancel and a confirm button, and a typed confirmation that stays disabled until an expected word is typed.

Keep the friction where it already exists. Clearing test data keeps its typed CLEAR, because it destroys collected answers. Deleting a study keeps a typed confirmation for the same reason. Unsaved changes gets the plain two-button form.

The unsaved changes case in `StudyBuilderPage.jsx` is the awkward one. `window.confirm` answers synchronously inside a navigation handler, and a modal cannot. Expect to hold the intended destination in state, show the dialog, and navigate when the answer comes back. Read that handler before starting, and if the change to the shared file is heading past the thirty line budget, stop and report rather than pushing through.

**Files.** `src/components/ConfirmDialog.jsx`, new, flag it. `src/pages/StudyListPage.jsx` and `src/pages/StudyBuilderPage.jsx`, review paths, keep each small. `src/pages/tonetest/ToneBuilderPage.jsx`, writable. `src/style.css`, review path, only if the existing modal classes genuinely do not stretch to cover it.

**Model.** Sonnet.

**Verify.** All four flows on the preview: clear test data on a tree test and on a tone test, delete a study, and leave a builder with unsaved changes. Confirm cancelling does nothing in every case. Confirm the typed confirmations stay disabled until the exact word is typed.

---

## Task 7. Restructure the version history

Covers D3. Do this after tasks 2 to 6, so it describes what actually shipped.

`VersionHistoryPage.jsx` has a Tone tests group and a Tree tests group, and this week produced changes belonging to neither. Add a Platform group above both, with its own version numbers, and record account deletion, the privacy policy modal with its version bump, and the privacy agreement gate on registration.

Add v4.05 under Tone tests for role links, the copy-per-role control, the pinned wording strip and the editor footer, plus the Preview button removal from task 2 if that reads as functional rather than cosmetic.

The page states it lists functional updates only. Apply that. Interface polish stays out.

**Files.** `src/pages/VersionHistoryPage.jsx`, defaults to ask so flag it.

**Model.** Sonnet.

**Verify.** Read the page against `git log` for the week and confirm nothing functional is missing and nothing cosmetic crept in.

---

## Task 8. Rewrite the tone guide and re-capture three screenshots

Covers D1 and D2. Last, because screenshots taken before tasks 2 to 6 land would be stale on arrival.

The guide still describes the old flow. `ToneGuidePage.jsx` says at line 116 that participants choose their role before they start, and at lines 250 and 251 that a participant opens the link and chooses a role. Neither is true for anyone who receives a role link. The figcaption at line 265 says the same thing.

Rewrite those passages to describe role links, and add a short section covering the part currently documented nowhere: the creator copies one link per role from the test collection and sends each to the right group. Per the decision above, do not document the bare link. It keeps working for anyone who has it, and the guide stays with one method.

Then re-capture `01-test-collection.png`, `05-tone-builder.png` and `08-tone-participant.png` using `scripts/screenshots/capture.mjs`. All three predate this week. The participant shot now needs the script to open a role link rather than the bare link, so the script needs that URL change before it runs.

Check the tree guide too. `GuidePage.jsx` embeds `01-test-collection.png`, and its alt text describes cards generally, so replacing the image file may be enough. Change the alt text only if the new image no longer matches it, which keeps a review path file untouched.

**Files.** `src/pages/tonetest/ToneGuidePage.jsx` and `scripts/screenshots/capture.mjs`, writable. Three PNG files under `public/guide/`. `src/pages/GuidePage.jsx`, review path, only if the alt text genuinely no longer fits.

**Model.** Opus with extended thinking for the guide rewrite, since it is explaining a workflow rather than generating markup. Sonnet is fine for running the capture script.

**Verify.** Read the tone guide start to finish as though new to the product, and confirm it never mentions choosing a role and never leaves the reader wondering how the three links reach three different people. Confirm the three new screenshots show the current interface, including the changes from tasks 2 to 6.

---

## Operator actions

These cannot be done from here.

1. Switch on leaked password protection, finding A3. Supabase dashboard, Authentication, password settings. Not a code change.
2. Push each task branch, since this environment has no git credentials.
3. Accept each task on the Vercel preview, particularly task 1 and task 5, which both change behaviour across the whole site.

---

## Round two, for later

C1 and C2, the accessibility pass over the participant flow. No `aria-pressed` exists anywhere, and the rating scale is five unrelated buttons rather than a labelled single-choice group. This affects the ratings, the risk gate buttons, the preferred wording buttons, the role buttons, the wording tabs and the view toggle. Do it as one pass, not scattered through other work.

A4, A5 and A6, the database performance findings. Ten unindexed foreign keys, eight policies re-evaluating `auth.uid()` per row, and six tables carrying duplicate permissive select policies. Invisible at current volume. Worth doing before a real study, and A6 is worth doing for readability regardless.

A7, the development branch. After the merge to `main`, either create the Supabase development branch that `CLAUDE.md` section 5 describes, or correct section 5. A governing document describing a safety measure that does not exist is worse than one admitting the gap.
