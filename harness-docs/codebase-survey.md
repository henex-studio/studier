# Studier Codebase Survey

**Date:** 2 August 2026
**Method:** Read-only inspection of `github.com/cafeyee/Studier` at `main` through the GitHub connector. No code was modified. The repository could not be cloned into the sandbox because it is private and the sandbox holds no credentials.
**Purpose:** Establish the facts needed for the protected path list at setup Stage 2, and test whether decision H-6.2 is achievable as written.
**Status:** Partial. Directory structure and configuration are confirmed. File contents were not read.

---

## 1. Repository structure

```text
Studier/
  .env.example
  README.md
  index.html
  package.json
  package-lock.json
  vercel.json
  node_modules/                    committed to the repository
  src/
    App.jsx                        5.7 KB    routing
    main.jsx                       0.3 KB    entry point
    style.css                     26.7 KB    all styling, single file
    components/
    lib/
      csvExport.js                 1.8 KB
      matching.js                  1.3 KB
      participantId.js             0.3 KB
      supabase.js                  0.3 KB    client initialisation
      treeParser.js                2.0 KB
    pages/
      StudyBuilderPage.jsx        29.6 KB    Tree Test builder
      StudyListPage.jsx           20.2 KB    study collection
      TestRunnerPage.jsx          18.0 KB    public participant runner
      PreviewRunnerPage.jsx       15.1 KB    creator preview
      GuidePage.jsx               13.9 KB    in-app guide
      DashboardPage.jsx            6.2 KB    results
      ConsentPage.jsx              4.6 KB
      RegisterPage.jsx             4.1 KB
      TreeView.jsx                 3.7 KB
      LoginPage.jsx                2.7 KB
  supabase/
    schema.sql                    10.0 KB
    consent_v2_registration_update.sql
    invite_registration.sql
    clear_test_data_delete_policies.sql
    pre_task_questions.sql
    expiry_date.sql
    studier_display_name.sql
```

## 2. Confirmed technical facts

Frontend is React with Vite. Build script is `vite build`. There is no test script, no lint script and no type checking. The project is plain JSX with no TypeScript.

Dependencies are declared as `"latest"` for every package including React, Vite and the Supabase client. `package-lock.json` exists and pins actual versions, so an install today reproduces the current tree, but any dependency refresh will move every package at once.

Database work is a set of loose SQL files in `supabase/`. There is no `supabase/migrations/` directory and therefore no migration framework. Changes appear to have been applied by hand.

`vercel.json` exists at 86 bytes, which is consistent with a single rewrite rule for SPA routing.

## 3. Findings that change the harness setup

### 3.1 The codebase is page-monolithic, which breaks H-6.2 as written

H-6.2 assumed that existing functionality could be protected by listing its paths, with Tone Test writing only into new directories. The structure does not permit this.

There is no per-feature directory. Each route is one large page component, and Tree Test logic is not separated from platform logic. Cross-referencing the build plan against the file list gives the following unavoidable contact points.

| Build plan task | Existing file that must change | Size |
|---|---|---|
| 1, study type selection and routing | `src/App.jsx`, `src/pages/StudyListPage.jsx` | 5.7 KB, 20.2 KB |
| 10, preview by role | `src/pages/PreviewRunnerPage.jsx` | 15.1 KB |
| 11, publishing checks | `src/pages/StudyBuilderPage.jsx` or shared publish logic | 29.6 KB |
| 12, participant role selection | `src/pages/TestRunnerPage.jsx` | 18.0 KB |
| 15, dashboard | `src/pages/DashboardPage.jsx`, `src/App.jsx` | 6.2 KB, 5.7 KB |
| 17, CSV export | `src/lib/csvExport.js` | 1.8 KB |
| 19, guide | `src/pages/GuidePage.jsx` | 13.9 KB |
| all, styling | `src/style.css` | 26.7 KB |

Eight of the ten page files and the shared export library are in scope. A blanket denial on existing paths would block the feature at Task 1.

This does not mean the stability concern cannot be answered. It means the control has to change shape. See Section 5.

### 3.2 There is no `.gitignore`

The repository root has `.env.example` but no `.gitignore`. Dotfiles are visible through the API, so this is an absence rather than a reporting artefact.

Two consequences. First, `node_modules/` is committed, which is why it appears in the tree. Second, nothing prevents a real `.env` from being committed. Under H-6.4 item two, credentials must be in `.gitignore` before the first harness run, and the file that would enforce that does not exist.

### 3.3 Committed `node_modules` makes diff-based evaluation unusable

The Evaluator role under architecture Section 5.3 reads the git diff as its primary evidence. Any task that touches dependencies would produce a diff of thousands of files, which the Evaluator cannot read and which would consume the context budget several times over.

This has to be fixed before Stage 4, not after.

### 3.4 Verification has very little to work with

H-6.6 brought build and browser verification forward on the assumption that a production codebase has a verification surface. What exists is `vite build` and nothing else. No tests, no type checking, no lint.

For a React single-page application, a successful build is weak evidence. It confirms that the module graph resolves and syntax parses. It does not detect a broken route, a failed query, an RLS rejection or a blank render.

The regression check in H-6.6 therefore cannot be a build check. It has to be a browser check, which means adding Playwright and writing the Tree Test smoke path before Tone Test development starts. That is real work not currently in the build plan.

### 3.5 No migration mechanism exists

H-6.5 states that database changes reach production as reviewed migrations. There is no migration tooling in the repository. The loose SQL files in `supabase/` are a record of what was run, not a reproducible sequence.

A Supabase development branch can still be created, but promoting from it needs either the Supabase CLI migration structure or a documented manual procedure. This is a decision, not an implementation detail.

## 4. Branch state

Only `main` was inspected. The GitHub API defaulted to it, which indicates it is the default branch. Whether a `dev` branch exists was not confirmed and should be checked at Stage 1.

Under the existing working method recorded in `Studier_Project_Instructions.md`, code is pushed directly to the repository and Vercel deploys from it. If that push target is `main`, then production currently deploys on every change, and architecture Section 14.1 has no branch to stand on.

## 5. Recommended revision to H-6.2

The intent of H-6.2 was that the agent cannot destabilise existing behaviour. The mechanism assumed separable directories. Since the directories are not separable, the mechanism should change while the intent stays.

Three controls together, replacing the single blanket denial.

**Control one, narrow contact.** All Tone Test logic goes into new files under a new directory. Edits to the eight existing files are limited to dispatch, meaning a study type branch that routes to the new module. Any edit to an existing file that adds more than a small number of lines is refused and escalated.

**Control two, review gate rather than denial.** The eight files above move to a review list rather than a deny list. The hook stops the edit and requires operator approval, instead of refusing it outright. This keeps the operator in the loop at exactly the eight places where the risk lives.

**Control three, behavioural regression check.** A Playwright smoke test covering create, publish, complete, export, close and clear for Tree Test runs on every task. This is the only control that catches breakage which no path rule can see, and Section 3.4 shows it is the only real verification available.

The trade is more operator involvement than H-6.2 implied, concentrated in eight known files rather than spread across the codebase.

## 6. What this survey did not establish

File contents were not read, so the following remain unknown and are needed before the protected path list is final.

1. Whether `StudyListPage.jsx` and `App.jsx` assume every study has a tree, which build plan Task 1 lists as a risk.
2. How publish validation is structured and whether it can take a study type branch cleanly.
3. Whether `csvExport.js` is generic or Tree Test specific.
4. The actual table and RLS policy set in `schema.sql`.
5. Whether `src/components/` contains reusable primitives or Tree Test specific pieces.
6. The current Studier version in the repository, against the v3.07 recorded in the development archive.
