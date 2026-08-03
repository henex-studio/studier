# Studier, project instructions

Loaded automatically by Claude Code. These rules apply to every session in this repository.

Governing documents are in `../../harness-core/docs/`. The architecture is `ai-harness-architecture.md`. Every decision below carries an H or S number pointing at the reasoning in `decision-log.md` there, or in `harness-docs/decision-log.md` here for product decisions.

---

## 1. What this project is

Studier is a live research platform for tree testing, built in React with Vite, backed by Supabase, deployed on Vercel. It is being extended with a second study type called Tone Test.

The platform is deployed and holds a small amount of real test data. It has no active users. Classification is `internal` under H-6.3.

---

## 2. The rules that are not negotiable

**Never push to `main`.** Promotion to production is the operator's decision alone, under H-3.5. The harness has authority up to `dev` and no further.

**Never modify a protected path.** The list is in `project-config.json`. A `PreToolUse` hook enforces it. If a change there seems necessary, stop and report it. Do not look for a way around the guard. This is H-4.3.

**Nine shared files require operator approval before editing.** They are listed under `review_paths` in `project-config.json`. Tone Test cannot be built without touching them, so they are not denied outright, but every edit stops for review. Keep those edits to study-type dispatch that routes into a new module. This is H-6.10.

**Never invent a missing decision.** If a task needs a product, commercial or legal decision that has not been made, record it in `harness-docs/open-questions.md` and stop. Do not guess and continue. This is H-5.5 and it is the single most important behavioural rule here.

**Never put credentials into a file, a commit or a prompt.** `.env` and `.env.local` are protected and unreadable. This is H-6.4.

---

## 3. Where Tone Test code goes

All Tone Test logic goes into new directories:

```text
src/pages/tonetest/
src/lib/tonetest/
src/components/tonetest/
supabase/migrations/
```

Existing files change only to add a study-type branch that routes into these directories. If an edit to a shared file is doing real work rather than dispatching, the work is in the wrong place.

---

## 4. Branch and deployment model

```text
task/<id>-<slug>   one branch per task, produces a Vercel preview
dev                integration branch, the harness may merge here
main               production, operator only
```

`pre-harness-baseline` is a tag on the last commit before harness work began. It is the rollback point of last resort, and it exists because every commit before it says "Add files via upload" and carries no information. See H-6.16.

---

## 5. Where things are verified

From H-6.14.

Build and regression checks run locally, because they run on every task and must be fast. Human acceptance and anything involving anonymous access run on the Vercel preview URL, because RLS defects do not reliably reproduce locally. A local session carries residual authentication and different environment variables, which mask the failure.

Local development and the Vercel preview both point at the Supabase development branch. Only production points at the production database.

---

## 6. Database changes

From H-6.13. Migrations live in `supabase/migrations/` with timestamp prefixes. Never apply SQL directly to production. Never run `supabase db push` or `supabase db reset`; both are denied.

The seven loose SQL files in `supabase/` are a historical record and are protected. They are not the migration sequence.

Every new table needs an RLS policy. A table without access control is not finished.

---

## 7. Code conventions

Carried forward from the previous project instructions, which remain valid on this subject.

Follow existing patterns in the repository. Do not introduce new libraries, frameworks or architectural patterns without discussing the trade-off first. Check for an existing component before creating one that may duplicate it.

Handle data validation, error states, loading states and mobile responsiveness as part of the work, not as a follow-up.

Comments, filenames, folder names and CSS variable names in English.

When a task spans database and frontend, state the order of operations. Database and RLS first, then frontend.

Dependency versions are pinned exactly in `package.json`. Do not reintroduce `latest`. See H-6.11.

---

## 8. Working style

Align before executing. Check that the request is clear on goal, success criteria, constraints, deliverables and stopping condition. Ask before proceeding rather than guessing. Summarise the task and confirm before starting.

When revising one section, revise only that section unless a broader rewrite was requested.

Raise risks, weak evidence, unclear scope and duplicated effort as they appear. When you disagree or see a better option, say so and offer alternatives with a brief trade-off analysis. Do not execute without judgement.

Treat the documents in `harness-docs/` and `docs/tone-test/` as the primary knowledge base. Read them before generating new content.

Chinese for discussion and progress summaries. English for all formal outputs and all files in this repository.

Formal writing: no dashes as separators, no bullet point overuse, no filler openers, no redundant closing lines. State things directly. Vary sentence length. Prefer active voice. Clear English at IELTS 6.5 to 7 level.

Include a short glossary at the end of any reply that uses technical or domain specific terms.

---

## 9. Reading order for a new session

1. `harness-docs/decision-log.md` for what has been decided about the product.
2. `harness-docs/open-questions.md` for what has not. Eleven questions and five document conflicts are open. Several block specific build plan tasks.
3. `docs/tone-test/Studier_Tone_Test_PRD_v2_ScoringAligned.md` for the specification.
4. `docs/tone-test/Studier_Tone_Test_MVP_Build_Plan_v2_ScoringAligned.md` for the task sequence. Twenty-one tasks, numbered 0 to 20. This file owns the numbering; the project plan overview does not and its numbers are wrong.

---

## 10. Superseded

`docs/tone-test/Studier_Project_Instructions.md` is background. Its Workflow section, describing direct pushes to production and no local environment, was retired by H-6.12. Its rules, roles, tech stack and code conventions are carried into this file.
