// Critical path smoke test. Drives the deployed dev preview with a real
// browser and walks the whole path an operator and a participant actually
// take: create a test, fill it in, publish it, answer it, read the result,
// export it, delete it.
//
// Why this exists. On 7 September 2026 every tone test role link was
// broken in production. The page opened, showed the test, and then sat on
// "Starting..." forever, so no participant could reach the questions. It
// had been broken since the feature landed. Nothing caught it, because
// nothing exercised the participant path. It surfaced only because the
// screenshot script happened to walk through that screen. This script is
// the answer to that: something that walks the path on purpose.
//
// One-time setup, then run:
//   npx playwright install chromium
//   npm run smoke
//
// To sweep leftovers from an interrupted run without testing anything:
//   npm run smoke:clean
//
// WHERE THIS WRITES. Production. There is no Supabase development branch
// (audit finding A7), so the preview, local development and production all
// share one database. Running this creates real rows in the real database.
// That was accepted deliberately on 7 September 2026: the platform has no
// active users and is classified internal, so the cost of a stray row is
// low and the cost of waiting for a development branch was not worth
// paying. See harness-docs/decision-log.md.
//
// That decision comes with an obligation, and it is the reason for the
// shape of the cleanup below. Cleanup runs from a finally block, so a
// failure part-way through still tidies up, and it sweeps anything left
// by an earlier run as well, because a hard kill (ctrl-C, closing the
// window, a laptop going to sleep) skips finally entirely. Two orphaned
// drafts reached production that way during the screenshot work.
//
// Read FIXTURE_TITLE below before changing anything about what cleanup
// matches. Deleting is the one thing here that cannot be undone, and the
// first version of this script proved that by deleting a real study.
//
// If a real study with external participants is ever run, this decision is
// revisited before this script runs again.

import { chromium } from "playwright";
import readline from "node:readline";

const BASE_URL = "https://studier-git-dev-cafes-projects-5a353a12.vercel.app";
const VIEWPORT = { width: 1440, height: 900 };

// Everything this script creates is titled to match FIXTURE_TITLE exactly,
// and cleanup deletes only titles that match it exactly.
//
// This pattern is strict on purpose. The first version of this script
// swept on the substring "SMOKE" using Playwright's hasText, which matches
// case-insensitively. It deleted a real study called "Smoke test, shopping
// menu" on its first run, on 7 September 2026. The deletion cascaded to
// every child row and the free plan has no point-in-time recovery, so the
// study was unrecoverable. Nothing about that was the database's fault:
// the sweep was written to a description of what it should match rather
// than to a check of what it would match.
//
// Hence: a case-sensitive regular expression, anchored at both ends,
// carrying a thirteen digit timestamp that no hand-typed title will ever
// contain by accident. Cleanup reads each card's title and tests it in
// JavaScript rather than delegating the match to a locator, so the rule is
// visible here and cannot be widened by a library's default.
//
// If this pattern ever changes, sweep with the old one first.
const FIXTURE_TITLE = /^SMOKE \d{13} (tree|tone)$/;
const RUN_ID = Date.now();
const TREE_TITLE = `SMOKE ${RUN_ID} tree`;
const TONE_TITLE = `SMOKE ${RUN_ID} tone`;

// A hard ceiling. This script creates two studies per run, so even with
// leftovers from a couple of interrupted runs the sweep should never reach
// this. If it does, something is matching more than it should and the
// right response is to stop rather than to keep deleting.
const MAX_SWEEP = 6;

const CLEAN_ONLY = process.argv.includes("--clean-only");

// The tree CSV format: first line is a header and is skipped, then the
// column a cell sits in decides its depth. See src/lib/treeParser.js.
const TREE_CSV = [
  "Level 1,Level 2",
  "Licences,",
  ",Renew a licence",
  ",Replace a licence",
  "Vehicles,",
  ",Register a vehicle"
].join("\n");

// Every selector the script depends on, in one place. The screenshot
// script kept breaking because selectors were scattered through it and a
// UI change quietly invalidated one at a time. When a control is renamed
// or restyled, this block is the only thing that should need editing.
const UI = {
  signedIn: 'h1:has-text("Test collection")',
  newTitleInput: 'input[placeholder="New test title"]',
  treeTab: "Tree Test",
  toneTab: "Tone Test",
  addTest: 'button:has-text("Add new test")',
  csvInput: 'textarea[placeholder="Paste CSV here"]',
  confirmDialog: ".confirm-dialog"
};

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

let stepNumber = 0;
async function step(name, body) {
  stepNumber += 1;
  const label = `${String(stepNumber).padStart(2, "0")}. ${name}`;
  try {
    await body();
    console.log(`  PASS  ${label}`);
  } catch (error) {
    console.error(`  FAIL  ${label}`);
    // The step name is the diagnosis. A bare Playwright timeout says which
    // selector gave up but not what the script was trying to achieve, and
    // that gap cost three debugging rounds on the screenshot script.
    error.message = `${label}\n         ${error.message}`;
    throw error;
  }
}

// Matches a card by its exact title. hasText would be a substring match,
// and a case-insensitive one, which is what deleted a real study on the
// first run. Nothing here matches loosely any more, even where the
// consequence would only be picking the wrong card.
function studyCard(page, title) {
  return page.locator(".study-card").filter({
    has: page.locator(".study-card-body h2", { hasText: new RegExp(`^${title}$`) })
  });
}

// Clicks Publish and reports what the app said if it refuses. Publishing
// runs a readiness check, and a rejected publish leaves the card in draft
// with a list of reasons on screen. Waiting for "Published" without
// reading that list turns a clear, specific complaint into a bare timeout.
async function publish(page, card) {
  await card.getByRole("button", { name: "Publish", exact: true }).click();

  const published = card.locator(".study-card-header", { hasText: "Published" });
  const refused = card.locator(".publish-validation-box");

  await Promise.race([
    published.waitFor({ state: "visible", timeout: 20000 }),
    refused.waitFor({ state: "visible", timeout: 20000 })
  ]).catch(() => {});

  if (await refused.isVisible().catch(() => false)) {
    const reasons = (await refused.innerText()).trim().replace(/\n/g, "\n         ");
    throw new Error(`The app refused to publish:\n         ${reasons}`);
  }

  await published.waitFor({ state: "visible", timeout: 20000 });
}

// Fills a label-wrapped field. The builders wrap the input inside a
// <label> that also holds a muted help paragraph, so the accessible name
// is the label text plus the help text. Matching on a substring is
// therefore deliberate, not sloppy.
function field(scope, labelText) {
  return scope.getByLabel(labelText, { exact: false }).first();
}

// Narrows to one <section class="card"> by its heading. Several class
// names in the builders are reused across sections, so reaching for one
// by index without saying which section it lives in picks whatever
// happens to render first.
function section(page, heading) {
  return page.locator("section.card").filter({
    has: page.getByRole("heading", { name: heading, exact: true })
  });
}

// Answers whatever a question card is asking without knowing its type.
// Rating scales, risk gates and the preference picker all render their
// options as buttons inside the card, so clicking the first enabled option
// button answers all three. Free text renders a textarea. Matching on
// structure rather than on option labels means adding a scale point or
// renaming a gate option does not break this.
async function answerQuestionCard(card) {
  const textareas = card.locator("textarea");
  const textareaCount = await textareas.count();
  for (let i = 0; i < textareaCount; i += 1) {
    await textareas.nth(i).fill("Automated answer from the smoke test.");
  }

  const options = card.locator("button:not([disabled])");
  const optionCount = await options.count();
  if (optionCount > 0) {
    await options.first().click();
  }
}

// Deletes every study whose title matches FIXTURE_TITLE exactly, through
// the app's own delete path. Going through the UI rather than SQL keeps
// database credentials out of this script and out of the repository
// entirely, which CLAUDE.md section 2 requires, and has the side benefit
// of exercising the delete path on every run.
async function sweep(page) {
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  await page.waitForSelector(".study-card, .card", { state: "visible" });

  let removed = 0;

  // Re-read the list each pass. Deleting a card re-renders it, so a
  // collection captured up front goes stale after the first deletion.
  for (;;) {
    const cards = page.locator(".study-card");
    const count = await cards.count();

    let target = null;
    let targetTitle = "";

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const title = (await card.locator(".study-card-body h2").first().innerText().catch(() => "")).trim();
      // The whole safety of this script is this one line. Read the title,
      // test it here, delete nothing that does not match exactly.
      if (FIXTURE_TITLE.test(title)) {
        target = card;
        targetTitle = title;
        break;
      }
    }

    if (!target) break;

    if (removed >= MAX_SWEEP) {
      throw new Error(
        `Sweep wanted to delete more than ${MAX_SWEEP} studies. Stopping without deleting "${targetTitle}". ` +
        `Check the fixture pattern before running again.`
      );
    }

    await target.getByRole("button", { name: "Delete", exact: true }).click();
    await page.locator(UI.confirmDialog).waitFor({ state: "visible", timeout: 15000 });
    await page.locator(UI.confirmDialog).getByRole("button", { name: "Delete", exact: true }).click();
    await target.waitFor({ state: "detached", timeout: 15000 });

    removed += 1;
    console.log(`  swept  ${targetTitle}`);
  }

  return removed;
}

async function main() {
  const browser = await chromium.launch({ headless: false, args: ["--disable-gpu", "--disable-software-rasterizer"] });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const pageErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
    console.error("  browser page error:", error.message);
  });

  let failed = false;

  try {
    // --- Sign in, by hand. This script never types a password. ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    console.log("\nA browser window has opened. Please sign in there with the Studier team account.");
    await ask("Once you see Test collection on screen, press Enter here to continue... ");
    await page.waitForSelector(UI.signedIn, { state: "visible", timeout: 120000 });

    if (CLEAN_ONLY) {
      console.log("\nSweeping leftover SMOKE studies, testing nothing.\n");
      const removed = await sweep(page);
      console.log(`\nSwept ${removed} ${removed === 1 ? "study" : "studies"}.\n`);
      return;
    }

    console.log(`\nSigned in. Running the critical path. Fixtures are named "${TREE_TITLE}" and "${TONE_TITLE}".\n`);

    // Clear anything an earlier interrupted run left behind, before
    // counting anything, so a stale fixture cannot be mistaken for a
    // fresh one.
    await step("Sweep leftovers from any earlier run", async () => {
      await sweep(page);
    });

    // ---------- Tree test, operator path ----------

    await step("Create a tree test", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      await page.fill(UI.newTitleInput, TREE_TITLE);
      await page.getByRole("tab", { name: UI.treeTab }).click();
      await page.click(UI.addTest);
      await page.waitForSelector("h1", { state: "visible" });
    });

    await step("Fill in the tree test and save it", async () => {
      // The two builders label these differently: "Welcome note" and
      // "Privacy note" here, "Welcome message" and "Privacy message" in
      // the tone builder. Spelling each out rather than matching on
      // "Welcome" keeps the failure honest if one of them is renamed.
      await field(page, "Welcome note").fill("Thank you for helping with this check.");
      await field(page, "Privacy note").fill("This check does not collect personal details.");
      await page.fill(UI.csvInput, TREE_CSV);

      await page.getByRole("button", { name: "Add task" }).click();
      // The task's label is "Task 1", not "Task text". Corrected after the
      // first run, where getByLabel("Task text") timed out. The panel is
      // scoped explicitly because the tone builder is not the only place
      // in the app with a textarea inside a .question-card.
      await page.locator(".task-editor-panel .question-card").first().locator("textarea").first()
        .fill("Where would you go to renew a licence?");

      // A target path is set by picking a node in the tree, then adding
      // the selection. There is no way to type a path directly, so this
      // is the one interaction here that depends on the tree widget's
      // internals. Scoped to the tree panel so it cannot accidentally
      // match the same words sitting in the CSV textarea above it. If
      // this step starts failing, check TreeView first.
      const treeNode = page.locator(".sticky-tree-panel .tree-label", { hasText: /^Renew a licence$/ });
      await treeNode.first().waitFor({ state: "visible", timeout: 15000 });
      await treeNode.first().click();
      await page.getByRole("button", { name: "Add selected path as target" }).click();

      // "Save test" in the tree builder, "Save" in the tone builder.
      await page.getByRole("button", { name: "Save test", exact: true }).click();
      await page.waitForSelector("text=Saved.", { timeout: 20000 });
    });

    await step("Publish the tree test", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      const card = studyCard(page, TREE_TITLE);
      await card.waitFor({ state: "visible", timeout: 15000 });
      await publish(page, card);
    });

    // ---------- Tone test, operator path ----------

    await step("Create a tone test", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      await page.fill(UI.newTitleInput, TONE_TITLE);
      await page.getByRole("tab", { name: UI.toneTab }).click();
      await page.click(UI.addTest);
      await page.waitForSelector("h1", { state: "visible" });
    });

    await step("Fill in the tone test and save it", async () => {
      await field(page, "Scenario").fill("A reminder that a driver licence is about to expire.");
      await field(page, "Content goal").fill("The reader renews on time without feeling accused.");
      await field(page, "Welcome message").fill("You will read two versions of the same message.");
      await field(page, "Privacy message").fill("This check does not collect personal details.");

      // Publishing needs at least two variants. A new tone test starts
      // with the minimum already present but empty, so this fills them
      // rather than adding more.
      //
      // Scoped to the Wording variants section. The class .question-card
      // is used in four places in this builder, and the Questions section
      // renders above this one, so an unscoped .nth(0) reaches a question
      // rather than the first variant. Caught in review, not by a run.
      const variantCards = section(page, "Wording variants").locator(".question-card");
      const wordings = [
        "Your driver licence expires next month. You can renew it online in about ten minutes.",
        "Your driver licence is due for renewal. Renewing online takes about ten minutes."
      ];
      for (let i = 0; i < wordings.length; i += 1) {
        const card = variantCards.nth(i);
        await field(card, "Label").fill(`Version ${i + 1}`);
        await field(card, "Wording").fill(wordings[i]);
      }

      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.waitForSelector("text=Saved.", { timeout: 20000 });
    });

    await step("Publish the tone test", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      const card = studyCard(page, TONE_TITLE);
      await card.waitFor({ state: "visible", timeout: 15000 });
      await publish(page, card);
    });

    // ---------- Participant path ----------

    let toneSlug = "";

    await step("Copy a role link from the published tone test", async () => {
      const card = studyCard(page, TONE_TITLE);
      const openLink = card.getByRole("link", { name: "Open" });
      await openLink.waitFor({ state: "visible", timeout: 15000 });

      // The role in this link is chosen from the test's active roles,
      // which ToneTestLinks loads from the database after the card first
      // renders. Until that lands the link reads "?role=" with nothing
      // after it, so the wait below is for a role actually being named,
      // not merely for the parameter being present. Checking only for
      // "role=" would let an empty one through and fail later, in the
      // participant step, where the cause would be much harder to see.
      let href = "";
      await page.waitForFunction(
        (title) => {
          const cards = Array.from(document.querySelectorAll(".study-card"));
          const match = cards.find((element) => element.querySelector(".study-card-body h2")?.textContent?.trim() === title);
          const link = match && Array.from(match.querySelectorAll("a")).find((a) => a.textContent.trim() === "Open");
          return Boolean(link && /[?&]role=[a-z_]+/.test(link.getAttribute("href") || ""));
        },
        TONE_TITLE,
        { timeout: 15000 }
      );

      href = await openLink.getAttribute("href");
      if (!href || !/[?&]role=[a-z_]+/.test(href)) {
        throw new Error(`The Open link names no role. Got: ${href}`);
      }
      toneSlug = href;
    });

    // This is the step that would have caught the 7 September deadlock.
    // Everything before it passed while role links were completely broken.
    await step("Open the tone role link and reach the questions", async () => {
      await page.goto(`${BASE_URL}${toneSlug}`, { waitUntil: "networkidle" });
      await page.waitForSelector("text=You are answering as", { state: "visible", timeout: 20000 });
      await page.waitForSelector(".tone-wording-bar", { state: "visible", timeout: 20000 });
      await page.waitForSelector(".question-card", { state: "visible", timeout: 20000 });
    });

    await step("Answer every tone question and submit", async () => {
      const cards = page.locator(".question-card");
      const count = await cards.count();
      if (count === 0) throw new Error("The role link reached the page but no questions rendered.");

      for (let i = 0; i < count; i += 1) {
        await answerQuestionCard(cards.nth(i));
      }

      await page.getByRole("button", { name: "Submit", exact: true }).click();

      // A refused submit names the questions still unanswered, which is
      // exactly what is needed if the generic answering above missed
      // something. Waiting only for the end card would throw that away
      // and report a timeout instead.
      const done = page.locator(".done-card");
      const refused = page.locator(".error-box");

      await Promise.race([
        done.waitFor({ state: "visible", timeout: 30000 }),
        refused.first().waitFor({ state: "visible", timeout: 30000 })
      ]).catch(() => {});

      if (await refused.first().isVisible().catch(() => false)) {
        throw new Error(`The app refused the submission: ${(await refused.first().innerText()).trim()}`);
      }

      await done.waitFor({ state: "visible", timeout: 30000 });
    });

    await step("Run the tree test as a participant and submit", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      const card = studyCard(page, TREE_TITLE);
      const href = await card.getByRole("link", { name: "Open" }).getAttribute("href");

      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Start test" }).click();

      // The tree starts collapsed on a /test/ page and expanded in the
      // builder, so unlike the builder step this one has to open the
      // parent before the leaf exists to be clicked. See
      // shouldCollapseByDefault in TreeView.jsx.
      const parent = page.locator(".tree-label", { hasText: /^Licences$/ }).first();
      await parent.waitFor({ state: "visible", timeout: 15000 });
      await parent.click();

      const leaf = page.locator(".tree-label", { hasText: /^Renew a licence$/ }).first();
      await leaf.waitFor({ state: "visible", timeout: 15000 });
      await leaf.click();

      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.locator(".done-card").waitFor({ state: "visible", timeout: 20000 });
    });

    // ---------- Reporting ----------

    await step("The tone dashboard shows the submitted response", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      const card = studyCard(page, TONE_TITLE);
      await card.getByRole("link", { name: "Dashboard" }).click();
      await page.waitForSelector("h1", { state: "visible" });
      await page.getByRole("button", { name: "Refresh" }).click();

      // A tone test opens ToneDashboardPage, which counts sessions in
      // summary cards. Reading that number is the point of the step: it
      // is the only place in this script that proves the answers
      // submitted a moment ago actually reached the database, rather
      // than the participant page merely looking like it worked.
      const completed = page.locator(".summary-card", { hasText: "Sessions completed" }).locator("strong");
      await completed.waitFor({ state: "visible", timeout: 20000 });
      const value = Number((await completed.innerText()).trim());

      if (!Number.isFinite(value) || value < 1) {
        throw new Error(`The dashboard shows ${value} completed sessions after one was just submitted.`);
      }
    });

    await step("Export a CSV from the tree dashboard", async () => {
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
      const card = studyCard(page, TREE_TITLE);
      await card.getByRole("link", { name: "Dashboard" }).click();
      await page.waitForSelector("h1", { state: "visible" });

      const download = page.waitForEvent("download", { timeout: 20000 });
      await page.getByRole("button", { name: "Export task CSV" }).click();
      const file = await download;
      if (!file.suggestedFilename().endsWith(".csv")) {
        throw new Error(`Expected a CSV download, got ${file.suggestedFilename()}`);
      }
    });

    await step("No uncaught browser errors during the run", async () => {
      if (pageErrors.length > 0) {
        throw new Error(`${pageErrors.length} uncaught error(s):\n         ${pageErrors.join("\n         ")}`);
      }
    });
  } catch (error) {
    failed = true;
    console.error(`\nSmoke test failed at step ${error.message}\n`);
  } finally {
    // Runs whether the test passed or failed. A hard kill skips this
    // entirely, which is why the next run sweeps by prefix before it
    // starts, and why npm run smoke:clean exists.
    if (!CLEAN_ONLY) {
      try {
        console.log("\nCleaning up.");
        const removed = await sweep(page);
        console.log(`Cleanup removed ${removed} ${removed === 1 ? "study" : "studies"}.`);
      } catch (cleanupError) {
        console.error(
          `\nCLEANUP FAILED: ${cleanupError.message}\n` +
          `"${TREE_TITLE}" and "${TONE_TITLE}" may still be in the live test collection.\n` +
          `Delete them by hand, or run: npm run smoke:clean\n`
        );
        failed = true;
      }
    }

    await browser.close();
  }

  if (failed) process.exit(1);
  console.log("\nCritical path passed.\n");
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
