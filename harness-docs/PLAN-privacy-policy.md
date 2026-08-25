# Plan, privacy policy for Studier

**Written:** 24 August 2026
**Revised:** 24 August 2026, after the operator connected the fevnote repository and settled the three decisions this plan was blocked on.
**Status:** proposal, nothing built. Approve before work starts.
**Reference implementation:** `Fevnote/code/fevnote`, in particular `docs/PRIVACY-POLICY.md`, `src/pages/PrivacyPolicy.jsx` and `src/services/authService.js`.
**Not legal advice.** fevnote's policy makes specific claims under the Privacy Act 2020. Reusing its structure is sound. Reusing its wording without checking that each claim is true of Studier is not.

---

## 1. The thing to correct first

The request was to align Studier's privacy policy with fevnote's approach. Studier has no privacy policy to align. It has something that is easy to mistake for one.

The page at `/` is headed "Use Studier responsibly" and lists eight use conditions telling the account holder what they must not do. That is an acceptable use agreement. It protects the operator from misuse of the tool.

A privacy policy does the opposite. It tells the reader what is collected about them, why, where it is held, how long, who else can see it, and how to get it removed. Studier says none of this to anyone.

So this is not alignment. It is writing a document that does not exist, and deciding how it sits alongside the use conditions that do.

---

## 2. What fevnote actually does, and what carries across

fevnote solved this problem properly, and most of the structure transfers. Four things are worth copying directly.

**A versioned policy with the version recorded against the account.** `docs/PRIVACY-POLICY.md` opens with `**Version 2026-08-14**` and a note saying this string is stamped on each account at sign-up so it stays possible to tell which wording a person agreed to. The same string lives as `PRIVACY_POLICY_VERSION` in `authService.js`, with an instruction to change both together. Studier already has this machinery for the use conditions: `CONSENT_VERSION` in `ConsentPage.jsx`, stored as `profiles.consent_version`. It needs a second version string, not a second mechanism.

**Consent stamped when consent was given.** fevnote records the privacy version at sign-up, in the database trigger, rather than at first sign-in. The comment in `0004_multi_account_foundation.sql` says why: with email confirmation on, sign-up produces no session, so the browser has nothing to write with, and recording it at first login would date the consent to the wrong moment. Studier currently writes it from the browser immediately after sign-up, which is the pattern fevnote deliberately moved away from. The registration plan covers this.

**Plain language, and claims that are true because of how the system is built.** fevnote's policy says the operator cannot see a child's records, and immediately explains why: row level security applies to the operator's account like everyone else's, so it is a property of the database rather than a promise about behaviour. That distinction is what makes the document credible.

**Honesty about the limits.** fevnote states outright that account deletion is not built, that it happens by emailing `privacy@henex.uk`, and that the response takes up to 20 working days. It does not promise a button that does not exist.

**What does not carry across, and this is the important part.** fevnote holds a child's health records for one parent. Studier holds an account holder's details plus responses collected from third parties who never signed up for anything. Three claims in fevnote's policy are false if copied into Studier's:

1. fevnote says the operator cannot see a user's records. In Studier the operator can. `is_admin()` grants read access across studies, and the whole point of the dashboard is that a study owner reads participant responses.
2. fevnote says information is collected only from the person typing it. Studier collects from participants who have no account and no relationship with Henex Studio.
3. fevnote's data is Sydney and Tokyo, through Supabase and Resend. Studier's region needs checking rather than assuming, and Studier sends no email at present.

Copying the wording without correcting these would produce a policy that reads well and is untrue, which is worse than having none.

---

## 3. What personal data Studier actually holds

Read from the database and the code.

**Account holders**, the people who create and run tests:

1. Email address, in `auth.users` and copied into `public.profiles`.
2. Display name, chosen at registration.
3. Password, held by Supabase Auth as a hash. The application never sees it.
4. Consent version and the time it was accepted.
5. Which invite code was used, once the registration work lands.
6. Sign-in timestamps and IP addresses, held by Supabase Auth in its own tables and logs. Nothing in the application writes these, which is why they are the item most easily forgotten.

Six accounts exist, all confirmed.

**Participants**, the people who answer a test:

1. A random identifier such as `P4K2M9XQ`, generated in the browser and kept in that browser's local storage. Not linked to any account and carrying nothing identifying.
2. Their answers, and the times they started and finished.
3. For a Tone Test, once Milestone 3 exists, the role they chose and the wording they saw.

Participants never sign in and are never asked for a name or contact detail. The use conditions forbid creators from asking for these in question wording, but nothing in the software enforces it. A creator can type a question asking for a name. The policy should say this plainly rather than implying the platform prevents it, in the same spirit as fevnote's distinction between what the database guarantees and what a person promises.

**Where it lives.** Supabase and Vercel. The Supabase region needs confirming before it is written down.

---

## 4. What the policy has to say

Follow fevnote's section order, which works. Eleven sections: who runs it, what it is for, what is collected, who can see it, where it is stored, how long it is kept, your rights, security, what happens if something goes wrong, information about participants, and changes to the policy.

Three sections need genuinely different content from fevnote's.

**Who can see your information.** State that a study creator reads every response to their own study, and that the operator can read across all studies. This is the opposite of fevnote's position and cannot be softened.

**Information about participants.** fevnote has a section about children because a parent enters data about someone else. Studier needs the equivalent for participants: they are not identified, they are not asked to register, the creator who invited them is responsible for how they were invited, and the platform limits what can be asked but does not police it.

**How long it is kept, and deletion.** Studier can clear a study's responses and delete a study. It cannot delete an account. fevnote's answer, deletion on request by email within 20 working days, works here too and is honest. This is the operator's decision to confirm rather than mine to take.

---

## 5. How it would be built

Six steps. The operator's decision on the three protected files removes the blocker that stopped steps 4 and 5 previously.

**Step 1. Confirm three facts.** The Supabase region, whether any email service will exist once the registration work lands, and the deletion position from section 4. All three appear as specific claims in the finished document, so guessing is not an option.

**Step 2. Write the policy.** A new file, `docs/privacy-policy.md`, holding the version of record, opening with a version string on fevnote's pattern. Written from sections 3 and 4 above, using fevnote's structure and tone, not its claims. Nothing in the running product changes.

**Step 3. Build the page.** `src/pages/tonetest/` is the only writable page folder, which is the wrong home for a platform page. Better to put it beside fevnote's equivalent at `src/pages/PrivacyPolicy.jsx` and treat that as a new file rather than a protected one, since nothing of that name exists today. Reachable without signing in, because someone deciding whether to register needs to read it before they have an account. The route line goes in `src/App.jsx`, a review path, so it stops for approval.

**Step 4. Add the version constant and stamp it.** A `PRIVACY_POLICY_VERSION` constant, and a `privacy_version` plus `privacy_accepted_at` column on `profiles`, matching fevnote's naming so the two products stay legible side by side. The stamping happens in the registration trigger, so this step is genuinely part of the registration work and should be built with it rather than twice.

**Step 5. Link to it.** From the consent screen and the registration screen. Both now editable under the operator's decision, each edit stopping for approval.

**Step 6. Decide what the consent screen becomes.** Two documents now exist. Recommendation is to keep them separate, as fevnote does, with the use conditions asking the creator to behave responsibly and the privacy policy telling everyone what happens to their data. The consent checkbox then references both.

---

## 6. Decisions

All settled by the operator on 24 August 2026.

1. **The fevnote reference is available**, and has been read rather than assumed.
2. **The three authentication files moved** from `protected_paths` to `review_paths` in `project-config.json`. Every edit still stops for approval.
3. **The database is in Sydney, Australia.** Verified directly rather than taken on trust: the Supabase project reports region `ap-southeast-2`. This is the same region fevnote uses, so the Privacy Act 2020 principle 12 paragraph in fevnote's policy transfers with only the provider list changed.
4. **Deletion follows fevnote.** Account deletion is not built. It happens by emailing `privacy@henex.uk` from the address on the account, answered within 20 working days. The policy says this plainly rather than implying a button exists.
5. **The contact address is `privacy@henex.uk`**, and the entity is Henex Studio, matching fevnote.

**Still open, and not blocking.** Whether the use conditions and the privacy policy stay as two separate documents. Recommendation is that they do, as fevnote keeps them, with the consent checkbox referencing both. This can be settled when step 6 is reached.

**One thing to check when writing.** Studier sends no email today. Once the registration work lands it will send verification and reset messages through whatever service is connected, and that provider becomes a third party the policy has to name. fevnote names Resend, processing in Tokyo. If Studier uses the same service the same sentence applies. Do not write that section until step 3 of the registration plan is done, or it will describe something that is not true yet.

---

## 7. Effort

Steps 1 and 2 are two to three hours, mostly writing and the operator's reading. Step 3 is small. Steps 4 and 5 belong with the registration work and should not be estimated separately.
