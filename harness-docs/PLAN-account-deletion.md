# Plan, account deletion for Studier

**Written:** 5 September 2026
**Status:** proposal, nothing built. Approve before work starts.
**Requested by the operator:** a signed-in person can permanently delete their own account and everything belonging to it, from the account page, behind a warning that says the action cannot be undone.

This plan also folds in a gap found while checking the request: the privacy policy is currently unreachable from anywhere inside the signed-in product.

---

## 1. What exists today

There is no way to delete an account. `docs/privacy-policy.md` and `PrivacyPolicyPage.jsx` both say deletion happens by emailing `privacy@henex.uk` from the address on the account, answered within 20 working days. That claim was accurate when it was written and stops being accurate the moment this button ships, so the policy is part of this work rather than a follow-up to it.

The data side is already solved, and this is the useful discovery. `profiles.id` and `studies.owner_id` both reference `auth.users(id) on delete cascade`, and every other table in the product hangs off `studies` with the same rule, including all six tone test tables added by later migrations. `feedback.owner_id` cascades off `auth.users` directly. Deleting one row from `auth.users` therefore removes the profile, every study that person owns, the trees, tasks and questions inside those studies, every participant session, every task and final response, every tone variant, question, response and gate judgement, and their feedback.

What is not solved is deleting that one row. A browser holding the anon key cannot touch `auth.users`. This is the whole technical problem, and it decides the shape of the work.

---

## 2. Decisions only the operator can make

Under H-5.5 these are recorded rather than guessed. The first two change what the feature does.

**D1. Participant responses die with the account.** A creator who deletes their account destroys every answer that third-party participants gave to their studies. That is defensible, since the account holder is the one who collected it, and it is also irreversible and takes the research record with it. Two positions are reasonable. Either the deletion goes ahead and the warning states plainly how many responses will be destroyed, or deletion is blocked while any study still holds responses, forcing the person to export or clear first. Recommendation is the first, with counts shown in the warning, because the second turns "delete my account" into a puzzle the person has to solve before they are allowed to leave.

**D2. Administrators.** Should an account with `role = 'admin'` be allowed to delete itself, and should the last remaining administrator be stopped? Recommendation is to allow it but refuse when that account is the only administrator left, because nothing else in the product can restore administrator access afterwards.

**D3. How the confirmation works.** The request says a warning dialog. Recommendation is to go one step further and require the person to type their own email address into a field before the button activates. A dialog with an OK button is one mis-click away from destroying real data, and this action has no undo at any layer.

**D4. Whether the email route stays.** Someone who cannot sign in, because they have lost the password and the mailbox, cannot use a button. Recommendation is that the policy keeps the `privacy@henex.uk` route alongside the button rather than replacing it.

**D5. Privacy policy version.** The policy currently makes a factual claim that this work makes false. Updating the text is not optional. Bumping `PRIVACY_POLICY_VERSION` is a separate question: existing accounts carry the old string, and Studier has no re-consent flow, so a bump records that the wording changed without anyone being asked to agree again. Recommendation is to bump it, since the string exists to answer "which wording did this person see", and to leave the existing accounts alone.

---

## 3. Two ways to build it, and which one fits

**Option A, a database function.** A `SECURITY DEFINER` function, `public.delete_my_account()`, taking no parameters at all, reading the caller from `auth.uid()`, deleting that one row from `auth.users` and letting the existing cascades do the rest. Granted to `authenticated`, revoked from `anon`.

This matches how the rest of Studier already works. Several `SECURITY DEFINER` functions exist here for participant submission and consent. It adds no new infrastructure, no deployment step and no second copy of the service key. Taking no parameters is what makes it safe: the caller cannot name a victim, only themselves. That design point matters here more than in most projects, because the last function of this shape in this repository, `complete_invite_registration`, took a user id as a parameter and was exactly the hole that had to be closed in August.

The cost is that it writes into Supabase's own `auth` schema from SQL. The cascade behaviour is Supabase's to change, and a future change would be theirs rather than ours.

**Option B, an edge function.** A deployed function holding the service role key, verifying the caller's token and calling `auth.admin.deleteUser`. This is the path Supabase documents. It needs a `supabase/functions/` directory that does not exist yet, a deploy step the harness cannot perform, and the service role key stored as a function secret.

**Recommendation: Option A**, on the grounds that it follows existing patterns, introduces no new secret and no new deployment surface, and that the parameterless design removes the failure mode that made the previous function dangerous. Option B is the better answer for a product that already runs edge functions. Studier does not run any.

---

## 4. Steps

Database first, then the page, in the order `CLAUDE.md` requires.

**Step 1. The function.** One migration adding `delete_my_account()` as described, with the grant and the revoke, and a comment listing the cascade paths it relies on so the next reader does not have to work them out. Nothing visible changes.

**Step 2. Verify the cascade against the live database, not the schema file.** Query the actual foreign keys on the development branch and confirm every table that references `studies` or `auth.users` carries `on delete cascade`. `schema.sql` is a historical record here, not the current shape, and six tables arrived after it was written.

**Step 3. The account page.** A separate danger section below the existing display name form. It states what will be destroyed, including live counts of that person's tests and of the responses held inside them, fetched when the page loads. It requires the typed confirmation from D3. On success it calls the function, signs the person out, and lands them on a plain page saying the account is gone. `AccountPage.jsx` is a new-ish file and not a review path, so this step does not stop for approval on its own.

**Step 4. The policy.** Update `docs/privacy-policy.md` and `PrivacyPolicyPage.jsx` together, as their own notes instruct. Describe the button, keep or drop the email route per D4, bump the version per D5.

**Step 5. Make the policy reachable, which today it is not.** The links exist only on the registration form and the consent screen. Nobody who is signed in, and nobody sitting on the sign-in page, can reach `/privacy` from the interface at all. Add a link in the shared shell so it is available from every signed-in page, and one on the sign-in page. `LoginPage.jsx` is a review path and stops for approval.

**Step 6. Verify on the deployed preview, with a throwaway account.** Create an account, give it a test, answer that test as a participant so real responses exist, then delete the account from the page. Confirm the auth user is gone, the profile is gone, the test and its responses are gone, the session no longer works, and the public test link no longer resolves. Local checks do not prove the session behaviour.

---

## 5. Risks

The feature is irreversible by design, which is what makes it worth building carefully rather than quickly. Three things are worth stating before any code exists.

A mis-click destroys real research data belonging to a study's participants as well as the account holder, which is why D3 recommends more friction than a dialog.

The cascade is trusted rather than enumerated by the function itself. If a future table references `studies` without `on delete cascade`, deletion will fail with a foreign key error instead of leaving orphans, which is the safer failure but still a failure. Step 2 exists so this is known today, and any new table needs the same rule.

Nothing in this plan can be tested honestly on a local machine. Deleting the row is easy to check anywhere; proving the person's session is dead afterwards is not.

---

## 6. Effort

Steps 1 and 2 together are around an hour. Step 3 is two to three hours, most of it in the counts and the confirmation flow rather than the deletion itself. Step 4 is an hour of careful writing. Step 5 is small. Step 6 is an hour and should not be skipped.
