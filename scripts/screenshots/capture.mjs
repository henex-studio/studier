// Milestone 6 Step 7. Captures the ten guide screenshots by driving the
// real, deployed dev preview with a real browser (Playwright), the same
// approach used for Fevnote's onboarding screenshots
// (../fevnote/scripts/screenshots/capture.mjs), adapted for a project that
// already has suitable demo data on a live deployment instead of a local
// fixture server.
//
// This script never types a password. It opens a real, visible browser
// window and pauses so a person can sign in by hand, then reuses that
// signed-in session for every screenshot that needs one.
//
// One-time setup, then run:
//   npx playwright install chromium
//   npm run screenshots
//
// Output: public/guide/*.png (ten files, used directly by GuidePage.jsx
// and ToneGuidePage.jsx as /guide/<file>.png).

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(dirname, "..", "..", "public", "guide");

// The dev preview Vercel builds from this repository's dev branch. Both it
// and local development point at the Supabase development branch, per
// harness-docs/CLAUDE.md section 5, so neither can touch production data.
const BASE_URL = "https://studier-git-dev-cafes-projects-5a353a12.vercel.app";

// Ground truth for the two demo studies is their slug, visited directly
// during Milestone 6 Step 6 and unlikely to change; titles are not used for
// matching because they are free text. If a slug below no longer appears on
// a study card, the matching step throws a clear error rather than silently
// screenshotting the wrong card.
const TREE_SLUG = "transport-services-navigation-test-j6foa";
const TONE_SLUG = "driver-licence-renewal-reminder-hsurx";

const VIEWPORT = { width: 1440, height: 900 };

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function studyCard(page, slug) {
  const card = page.locator(".study-card", { hasText: slug });
  await card.waitFor({ state: "visible", timeout: 15000 });
  return card;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: false, args: ["--disable-gpu", "--disable-software-rasterizer"] });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  page.on("pageerror", (error) => console.error("Browser page error:", error.message));
  page.on("dialog", (dialog) => dialog.accept()); // accepts the "delete this test" confirm at the end

  try {
    // --- Sign in, by hand, in the window that just opened ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    console.log("\nA browser window has opened. Please sign in there with the Studier team account.");
    await ask("Once you see Test collection on screen, press Enter here to continue... ");
    await page.waitForSelector("h1:has-text(\"Test collection\")", { state: "visible", timeout: 120000 });
    console.log("Signed in. Capturing screenshots now, no further input needed.\n");

    // --- 1. Test collection ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    await page.waitForSelector(".study-grid, .card", { state: "visible" });
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "01-test-collection.png") });
    console.log("Saved 01-test-collection.png");

    // --- 2. Creating a tree test (form filled, not submitted) ---
    await page.fill('input[placeholder="New test title"]', "Example tree test");
    await page.selectOption('select[aria-label="Test type"]', "tree_test");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "02-create-tree-test.png") });
    console.log("Saved 02-create-tree-test.png");

    // --- 3. Creating a tone test (form filled, not submitted) ---
    await page.fill('input[placeholder="New test title"]', "Example tone test");
    await page.selectOption('select[aria-label="Test type"]', "tone_test");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "03-create-tone-test.png") });
    console.log("Saved 03-create-tone-test.png");
    // Leave the form as-is; nothing was submitted, so nothing needs undoing.
    await page.fill('input[placeholder="New test title"]', "");

    // --- 4. Tree builder, populated with the demo tree test ---
    const treeCard = await studyCard(page, TREE_SLUG);
    await treeCard.locator("a", { hasText: "Edit" }).click();
    await page.waitForSelector("h1", { state: "visible" });
    await page.waitForLoadState("networkidle");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "04-tree-builder.png"), fullPage: true });
    console.log("Saved 04-tree-builder.png");

    // --- 5. Tone builder, populated with the demo tone test ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    const toneCard = await studyCard(page, TONE_SLUG);
    await toneCard.locator("a", { hasText: "Edit" }).click();
    await page.waitForSelector("h1", { state: "visible" });
    await page.waitForLoadState("networkidle");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "05-tone-builder.png"), fullPage: true });
    console.log("Saved 05-tone-builder.png");

    // --- 6. The publish check ---
    // Both demo studies are already published, so neither shows the Publish
    // button or the validation it runs. A throwaway draft test triggers the
    // real check, gets its screenshot, then is deleted, leaving the two demo
    // studies untouched.
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    await page.fill('input[placeholder="New test title"]', "Screenshot publish check");
    await page.selectOption('select[aria-label="Test type"]', "tree_test");
    await page.click('button:has-text("Add new test")');
    await page.waitForSelector("h1", { state: "visible" }); // now on the new draft's builder page
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    const draftCard = await studyCard(page, "Screenshot publish check");
    await draftCard.locator("button", { hasText: "Publish" }).click();
    await draftCard.locator(".publish-validation-box").waitFor({ state: "visible", timeout: 15000 });
    await settle(page);
    await draftCard.screenshot({ path: path.join(outputDir, "06-publish-check.png") });
    console.log("Saved 06-publish-check.png");
    await draftCard.locator("button", { hasText: "Delete" }).click();
    await draftCard.waitFor({ state: "detached", timeout: 15000 });
    console.log("Cleaned up the throwaway draft test.");

    // --- 7. Tree test, participant view ---
    await page.goto(`${BASE_URL}/test/${TREE_SLUG}`, { waitUntil: "networkidle" });
    await page.waitForSelector(".hero-card", { state: "visible" });
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "07-tree-participant.png") });
    console.log("Saved 07-tree-participant.png");

    // --- 8. Tone test, participant view ---
    await page.goto(`${BASE_URL}/test/${TONE_SLUG}`, { waitUntil: "networkidle" });
    await page.waitForSelector(".hero-card", { state: "visible" });
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "08-tone-participant.png") });
    console.log("Saved 08-tone-participant.png");

    // --- 9. Tree dashboard ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    const treeCardAgain = await studyCard(page, TREE_SLUG);
    await treeCardAgain.locator("a", { hasText: "Dashboard" }).click();
    await page.waitForSelector("h1", { state: "visible" });
    await page.waitForLoadState("networkidle");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "09-tree-dashboard.png"), fullPage: true });
    console.log("Saved 09-tree-dashboard.png");

    // --- 10. Tone dashboard ---
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    const toneCardAgain = await studyCard(page, TONE_SLUG);
    await toneCardAgain.locator("a", { hasText: "Dashboard" }).click();
    await page.waitForSelector("h1", { state: "visible" });
    await page.waitForLoadState("networkidle");
    await settle(page);
    await page.screenshot({ path: path.join(outputDir, "10-tone-dashboard.png"), fullPage: true });
    console.log("Saved 10-tone-dashboard.png");

    console.log(`\nAll ten screenshots are in ${outputDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Screenshot run failed:", error);
  process.exit(1);
});
