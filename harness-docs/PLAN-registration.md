# Plan, email verification and password reset for Studier

**Written:** 24 August 2026
**Revised:** 24 August 2026, after the operator connected the fevnote repository and settled two decisions. The invite code stays. The three protected authentication files may be changed.
**Status:** proposal, nothing built. Approve before work starts.
**Reference implementation:** `Fevnote/code/fevnote`, in particular `src/services/authService.js`, `src/pages/Register.jsx`, `src/pages/ForgotPassword.jsx`, and `supabase/migrations/0004_multi_account_foundation.sql`.

The earlier draft of this plan assumed the invite code was being removed. The operator has decided to keep it alongside email verification, which is also what fevnote does. That decision simplifies the work and removes most of the risk the first draft was worried about.

---

## 1. How registration works today

From `src/pages/RegisterPage.jsx` and `supabase/consent_v2_registration_update.sql`.

The person types a display name, email, password and invite code. The browser then asks the database whether the code is valid, calls Supabase to create the account, calls a function called `complete_invite_registration` passing the new user's id to write the profile row and consume the code, then signs the person straight back out and sends them to the sign-in page.

One code exists, `STUDIER-PILOT-2026`, good for ten uses. Six accounts exist and all six are confirmed. There is no way to reset a forgotten password anywhere in the interface.

---

## 2. The defect this work fixes

`complete_invite_registration` runs with its owner's privileges and is granted to the `anon` role, so anyone on the internet can call it directly over the public API without signing in. It takes the user id as an ordinary parameter instead of reading it from the caller's session, and writes to `profiles` with `on conflict do update`. Someone holding a valid invite code and an existing user's id could overwrite that user's profile row, including the `role` field, which is where administrator status lives. Two versions of the function exist, a four-argument and a five-argument one, both exposed.

Supabase's own security check flags all of this, along with `validate_invite_code` and `accept_platform_consent` being callable while signed out.

Keeping the invite code lowers the exposure, since an attacker still needs a code, but it does not remove it. The fix falls out of the work below rather than needing its own project: once a database trigger creates the profile row, the function has no reason to exist and gets dropped.

---

## 3. Where fevnote's design applies, and where it does not

fevnote already runs invite codes and email verification together, so the pattern is proven rather than theoretical. Four pieces transfer directly.

**Metadata plus a trigger, not a client-side write.** fevnote passes the invite code, display name and privacy version into `supabase.auth.signUp` as user metadata. A trigger on `auth.users` called `handle_new_user` reads them out and creates the profile row. The comment explaining why is exact: with confirmation switched on, sign-up returns no session, so the browser has no authenticated context to write with, and recording consent at first login would date it to the wrong moment. Studier's current flow is the pattern fevnote abandoned.

**The trigger cannot break sign-up.** fevnote wraps the whole trigger body in an exception handler that swallows any failure. The reasoning is that a missing profile row can be repaired afterwards but a sign-up that cannot complete cannot, and this code sits in the path of every registration including accounts made from the Supabase dashboard. Worth copying exactly.

**Consuming a code atomically.** fevnote's update puts every condition in the `WHERE` clause, so two simultaneous sign-ups cannot both take the last remaining use. Studier's current function does `select ... for update` then a separate update, which also works, but the single-statement form is simpler and moves into the trigger cleanly.

**Not revealing which emails have accounts.** fevnote's password reset returns success whether or not the address exists, and its comment says confirming or denying an email's existence is itself a privacy leak. Its sign-up path checks for an empty `identities` array, which is how Supabase silently no-ops on an already-registered email rather than erroring. Both behaviours should be carried over.

**Where fevnote's reasoning does not transfer.** fevnote deliberately does not enforce the invite code inside the trigger. Its comment argues that row level security already means a stray account sees nothing but its own empty data, that controlling tester numbers is a different problem from protecting data, and that only the second one justifies risking the sign-up path.

That argument holds for fevnote and does not hold for Studier. A stray fevnote account is inert. A stray Studier account can create studies, publish public links, and collect responses from third parties under the operator's domain. The consequence of an unauthorised account is a live public artefact, not an empty screen.

This is a real decision rather than a detail, and it is in section 6.

---

## 4. What the target looks like

1. Registration still asks for display name, email, password and invite code.
2. The code is checked as the person types, so the form can say it is not valid in place.
3. Supabase sends a verification email. The account cannot be used until the link is followed.
4. The profile row is created by a trigger reading sign-up metadata, not by the browser.
5. The sign-in page carries a "Forgot your password" link.
6. Two new pages handle requesting a reset and choosing a new password.
7. A recovery session lands on the new-password screen, never inside the application.
8. `complete_invite_registration` is dropped in both its versions.

Point 7 matters more than it looks. fevnote routes Supabase's `PASSWORD_RECOVERY` event separately in `App.jsx`, with the comment that a recovery session is a valid session and would otherwise drop the visitor straight into the previous owner's data. Studier's `App.jsx` currently treats any session as a signed-in user.

---

## 5. How it would be built

Eight steps, in order. Step 1 must land before step 5. The old registration function is removed last, not second, for the reason given under step 2.

**Step 1. Add the profile trigger.** A migration creating `handle_new_user` on fevnote's model: reads display name, invite code and consent versions from metadata, consumes the code atomically, inserts the profile row, and swallows its own failures. Written so it changes nothing for an account that already has a profile row, which makes it safe to apply while the six live accounts exist. Also adds the `privacy_version` and `privacy_accepted_at` columns the privacy plan needs, since both plans stamp their versions in this one trigger. Nothing visible changes.

**Step 2 moved. See step 7a.** The original ordering was wrong. It put the removal of `complete_invite_registration` immediately after the trigger, reasoning only that the trigger had to exist first. That is true but insufficient: the current registration page still calls that function on every sign-up, so dropping it at this point breaks registration for everyone until step 5 lands. The function can only go once nothing calls it. Caught while writing up step 1.

**Step 3. Operator turns on verification and connects a sender.** Not a code step, and the item most likely to take an unexpected afternoon. Details in section 7.

**Step 4. Build the two new pages.** Requesting a reset, and setting a new password, ported from `ForgotPassword.jsx`. New files, so no protection question arises. Two route lines in `src/App.jsx`, a review path, which stop for approval.

**Step 5. Rewrite the registration page.** Keep the invite code field. Add the live validity check. Move display name, invite code and consent versions into the sign-up metadata. Remove the direct profile write and the immediate sign-out. Show "check your email" instead of bouncing to sign-in. Handle the already-registered case. Editable under the operator's decision, stopping for approval.

**Step 6. Update the sign-in page.** Add the reset link. Give "Email not confirmed" its own message rather than a generic failure, using fevnote's error translation as the model.

**Step 7. Handle the recovery session in `App.jsx`.** Pass the auth event through, and route `PASSWORD_RECOVERY` to the new-password page before any signed-in route is considered. Review path.

**Step 7a. Close the hole.** Drop both versions of `complete_invite_registration`. Restrict `accept_platform_consent` to signed-in callers. Leave `validate_invite_code` reachable while signed out, because the registration form needs it before an account exists and it reveals only whether a code is valid. This runs only once step 5 has landed and nothing calls the dropped function.

**Step 8. Verify on the deployed preview.** Register a new account end to end, confirm the email arrives and the link works, confirm the profile row and both consent versions are correct, confirm an unconfirmed account cannot sign in, run a password reset, and confirm a recovery link cannot reach the application without setting a new password. Local checks do not prove any of this, because email links and redirect URLs behave differently there.

---

## 6. Decisions

All settled by the operator on 24 August 2026.

1. **The invite code stays**, alongside email verification. Same arrangement as fevnote.
2. **The invite code is enforced in the trigger**, not only in the form. This is where Studier deliberately departs from fevnote, for the reason in section 3: an unauthorised Studier account can publish public material under the operator's domain, which an unauthorised fevnote account cannot. An account cannot be created without a valid code.
3. **An exception is written for the Supabase dashboard**, since accounts created there carry no metadata and would otherwise be impossible to make. The exception is narrow: no invite code present at all means a dashboard account and is allowed through; an invite code present but invalid is rejected. An empty string counts as invalid, not as absent, so a form submission with the field cleared cannot slip through the dashboard path.
4. **The three authentication files moved** from `protected_paths` to `review_paths` in `project-config.json`, with the reasoning recorded in that file's `_review_paths_comment`. Every edit still stops for approval.

**Still worth settling, but not blocking.** Supabase's check against known-breached passwords is off, and the interface asks for six characters. Both are settings changes rather than development work, and this is the natural moment.

**A note on decision 3.** It carries a real consequence: anyone with access to the Supabase dashboard can create an account with no invite code and no verification. That is correct, because dashboard access already implies full control of the database, so it adds no exposure that did not exist. It is recorded here so it is a known property rather than a surprise later.

---

## 7. What only the operator can do

In the Supabase dashboard, not the repository:

1. Turn on email confirmation.
2. Connect a sending service. fevnote uses Resend. Supabase's built-in sender is rate limited and lands in spam often enough to matter.
3. Add the redirect URLs the verification and reset links return to, for production and for previews.
4. Turn on the breached-password check, and raise the minimum password length.

Nothing in this plan works without items 1, 2 and 3.

---

## 8. Effort

Steps 1 and 2 are around two hours including verification. Step 4 is half a day. Steps 5 to 7 are an hour or two each. Step 8 is an hour and should not be skipped. Step 3 is the operator's time, and the sending service is the unpredictable part.
