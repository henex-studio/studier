# Studier Privacy Policy

**Version 2026-09-05**

This version string is recorded against your account when you agree to
this policy at sign-up, so it stays possible to tell which wording each
person actually agreed to after the policy is later revised. It matches
`PRIVACY_POLICY_VERSION`, exported from `src/pages/PrivacyPolicyContent.jsx`
and re-exported from `src/pages/PrivacyPolicyPage.jsx` for the pages that
already imported it from there. If you change the wording below in any
way that affects meaning, change both.

This policy covers two different groups of people, and says so
throughout, because what Studier holds about each is very different.
**Account holders** create and run tests. **Participants** answer them,
without an account and without being identified.

---

## Who runs Studier

Studier is operated by Henex Studio, a sole trader business based in New
Zealand. Under the Privacy Act 2020, Henex Studio is the agency
responsible for the personal information described in this policy, and
acts as its own privacy officer. You can reach us at privacy@henex.uk.

Studier is currently in invite-only testing. An account can only be
created with an invite code, and it is offered to a small number of
people so that problems can be found before it is opened more widely.

## What Studier is for

Studier is a research tool. Account holders use it to test whether people
can find things in a website's navigation, and to test how wording reads
before it is published. It exists to improve content and structure, not to
learn about the people answering.

Studier is not a production service and does not replace any privacy,
ethics, security, research or business approval an organisation requires.

## What Studier collects from account holders

**Your account:** your email address, your password (stored only as a
cryptographic hash, so nobody including us can read it), the display name
you choose, the invite code you signed up with, and the date and time you
agreed to this policy and to the use conditions.

**What you create:** the tests you build, including the questions and
wording you write, and the results of those tests.

Our hosting and database providers keep standard server and
authentication logs, which include IP addresses and sign-in times, as any
web service does. These are not used to build any picture of you.

Studier stores your sign-in session in your browser. It is not sent
anywhere else and is not used to identify you across other websites.

## What Studier collects from participants

If you are answering a test, you do not have an account, you are not
asked for your name or contact details, and you are not asked to sign in.

Studier gives your browser a random identifier such as `P4K2M9XQ` and
stores it in that browser. Its only purpose is to keep your answers
together and let you return to an unfinished test on the same device. It
is not linked to any account, is not shared with anyone, and cannot be
traced back to you.

Attached to that identifier, Studier records **your answers**, when you
started and finished, and, in a tree test, how you moved through the
navigation: which items you clicked, in what order, how many clicks you
made, how long you took, and whether you went back on yourself. The
account holder running the test chooses which of these are recorded.

In a tone test, what is recorded is the role you chose to answer as,
which version of the wording you were shown, your ratings, any risk gate
judgements, and anything you typed in your own words. No navigation
behaviour is recorded, because a tone test has none.

**The questions are written by the account holder running the test, not
by Studier.** They are asked not to request names, contact details, case
details or anything else that could identify a person, and the use
conditions they agree to say so. Studier does not check what they type,
so please do not enter personal information about yourself or anyone else
in a free text answer, even if a question seems to invite it.

## Who can see your information

**If you are an account holder:** you can see everything in your own
tests, including every response to them. You cannot see anyone else's
tests. This is enforced by the database itself, not only by the app, so it
holds even if the app has a bug.

**If you are a participant:** your answers are visible to the account
holder who ran the test you answered. They are not visible to other
participants, and not visible to anyone browsing the internet. Studier
gives an unsigned-in visitor no access to any response at all.

**The person operating Studier** can see all accounts and, unlike in some
services, can see the contents of tests and their responses. This is an
administrator capability that exists to support and repair the service. We
are telling you this plainly because it is true; it would be easy to write
a sentence implying otherwise.

We do not sell your information, share it for advertising, or give it to
anyone else except the service providers listed below, who process it on
our behalf in order to run Studier.

## Where your information is stored

Studier uses four service providers.

1. **Supabase** stores the database and handles sign-in. Your information
   is held on servers in Sydney, Australia.
2. **Vercel** hosts and delivers the app itself.
3. **Resend** sends the confirmation and password reset emails for
   account holders. Your email address passes through it. Resend stores
   account data, email metadata and delivery logs in the United States,
   regardless of which region the message is sent from. The contents of
   your tests and responses never pass through it.
4. **Cloudflare** forwards email sent to privacy@henex.uk before it
   reaches us.

Participants are never sent email, because Studier does not have their
address.

Because information is held outside New Zealand, principle 12 of the
Privacy Act 2020 applies. Australia has privacy laws providing safeguards
comparable to New Zealand's, and each provider above is subject to
privacy obligations in its own jurisdiction.

## How long it is kept

Information is kept for as long as the account or the test it belongs to
exists.

An account holder can clear all responses to one of their tests at any
time, or delete the test entirely, which permanently removes its
responses. Doing either cannot be undone.

You can permanently delete your own account from the account page, at
any time, without contacting us. This deletes your account, every test
you own, and every response those tests have collected, including
responses from participants who never had an account here. There is no
recovery once this is done.

If you cannot sign in, email privacy@henex.uk from the address on the
account and we will delete it by hand. We will respond within 20
working days.

Because Studier is in testing, we may end the test and close all
accounts. If that happens we will tell account holders first and give a
reasonable chance to export any results.

## Your rights

Under the Privacy Act 2020 you can ask for a copy of the personal
information we hold about you, and you can ask us to correct anything
that is wrong.

Account holders can export the results of any of their tests as a CSV
file from within the app, and can edit or delete their tests and their
responses directly.

For anything the app cannot do for you, such as correcting your account
email, email privacy@henex.uk from the address on your account.

Participants are not identified, so we generally cannot find or return
"your" answers on request: we have no way to tell which anonymous
responses are yours. If you gave an answer you regret and can tell us
which test you answered and roughly when, contact the person who sent you
the test link, since they are the one able to identify and remove it.

You can withdraw your agreement to this policy at any time by deleting
your account, from the account page or by asking us to do it for you.

## Security

Your connection to Studier is encrypted. Passwords are hashed and never
stored in a readable form. Access to tests and responses is restricted at
the database level to the account that owns them, and participants submit
answers through a restricted entry point that gives them no ability to
read or alter anything.

No system is perfectly secure. Choose a password you do not use anywhere
else, and do not share your account details.

## If something goes wrong

If a privacy breach happens and it is likely to cause serious harm, the
Privacy Act 2020 requires us to notify the Office of the Privacy
Commissioner and the people affected. We will do this as soon as we
reasonably can.

If you are not satisfied with how we have handled your information, you
can complain to the Office of the Privacy Commissioner at
www.privacy.org.nz.

## Information about participants

If you are an account holder, the people who answer your tests are
relying on you. You choose who receives the link, what the questions ask,
and what is done with the results. Studier limits what it collects, but it
cannot stop you writing a question that asks for something it should not.
Please only send tests to people who expect them, and check exported
results before sharing them.

## Changes to this policy

If we change this policy in a way that affects what we do with your
information, we will tell you and ask you to agree again before you
continue using Studier. Smaller corrections will be published here with a
new version date.

## Contact

privacy@henex.uk
