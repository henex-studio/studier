// Measures the space between adjacent elements across the app and reports
// anything that does not match the scale.
//
// Why this exists. Spacing has been reported three times in one day and
// fixed twice by eye, and each time the fix was partial because looking at
// a screen cannot tell 12px from 14px. The third report was a comment box
// sitting at exactly 0 from the buttons above it, in fifteen places on one
// screen, which nobody had noticed in weeks of use. Measuring finds all of
// them in one pass and finds them again the next time.
//
//   npm run spacing
//
// It covers both sides of the product. The participant screens, which an
// outside participant sees and cannot report a fault on, and the operator
// screens, which need a signed-in session.
//
// The operator screens were added on 7 September 2026 because leaving them
// out had already cost something: both spacing faults reported that day,
// on the study card and on the tone dashboard, were on screens this script
// could not reach, so both were found by eye and measured by hand
// afterwards. A check whose coverage does not match where the faults are
// is a check that reassures more than it verifies.
//
// One sign-in covers everything: Vercel's gate on preview deployments, if
// the target is a preview, and Studier's own. It is the same manual pause
// npm run smoke and npm run screenshots already use, and it never types a
// password.
//
// A run creates a tone test session on the study it opens, because opening
// a role link is what starts one. It deletes nothing, so clear those out
// afterwards the same way the smoke test does.

import { chromium } from "playwright";
import readline from "node:readline";

// Where to measure. The dev preview by default, overridable so this can be
// pointed at production after a merge without editing the file.
const BASE_URL = process.env.SPACING_URL || "https://studier-git-dev-cafes-projects-5a353a12.vercel.app";

// Vercel protects preview deployments. A browser that has never signed in
// to Vercel gets redirected to vercel.com/login, so the first version of
// this script, which ran headless and unattended, measured nothing and
// timed out waiting for a card that was never going to appear. It reported
// only "waiting for locator to be visible", which named neither the page
// nor the redirect; that is why it now prints the url and title on failure,
// and that is how this was found in one run instead of several.
//
// So it opens a visible window and waits, the same way npm run screenshots
// and npm run smoke already do. Two ways to make it unattended again, both
// requiring something this repository cannot hold:
//
//   Point it at production, which Vercel does not protect:
//     SPACING_URL=https://<production-domain> npm run spacing
//
//   Or turn on Vercel's protection bypass for automation and put the secret
//     in the environment, never in a file here.
//
// Neither removes the Studier sign-in, which the operator screens need. A
// fully unattended version would have to hold an account's credentials,
// which is not something this repository will do.
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

// The scale, and the only two values that should appear.
//
//   CONTROL: two separate things, side by side or stacked.
//   LABEL:   a label or a caption and the control it describes. Closer on
//            purpose, so the reader can see which one it belongs to.
const CONTROL = 14;
const LABEL = 8;

// Pairs where the smaller value is the point rather than a mistake. Written
// as the two class names, in order. Anything not listed here is expected to
// sit CONTROL apart.
const LABEL_PAIRS = [
  ["button-row", "rating-scale-labels"],
  ["form-label", "textarea"],
  ["form-label", "text-input"],
  ["owner-chip", "h2"]
];

// Prose, not controls. Line height does the spacing in a paragraph or a
// bullet list and measuring it against a control scale is meaningless.
const PROSE = new Set(["li", "p", "span", "strong", "em", "br"]);

const PAGES = [
  { name: "Tone test, Audience", path: "/test/driver-licence-renewal-reminder-hsurx?role=audience" },
  { name: "Tone test, Agency", path: "/test/driver-licence-renewal-reminder-hsurx?role=agency" },
  { name: "Tree test", path: "/test/transport-services-navigation-test-j6foa" }
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

async function measure(page) {
  return page.evaluate(({ CONTROL, LABEL, LABEL_PAIRS, PROSE }) => {
    const first = (el) => String(el.className || "").split(" ")[0] || "";
    const isLabelPair = (a, b) =>
      LABEL_PAIRS.some(([x, y]) => first(a) === x && (first(b) === y || b.tagName.toLowerCase() === y));

    const found = [];
    document.querySelectorAll("main *").forEach((parent) => {
      const kids = [...parent.children].filter((el) => el.getClientRects().length);
      for (let i = 0; i < kids.length - 1; i += 1) {
        const a = kids[i];
        const b = kids[i + 1];
        if (PROSE.includes(a.tagName.toLowerCase()) && PROSE.includes(b.tagName.toLowerCase())) continue;

        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        if (rb.top < ra.bottom - 1) continue;               // side by side, not stacked

        const gap = Math.round((rb.top - ra.bottom) * 10) / 10;
        const expected = isLabelPair(a, b) ? LABEL : CONTROL;
        if (Math.abs(gap - expected) <= 0.5) continue;
        if (gap > expected) continue;                        // roomier than the scale is not the fault being hunted

        found.push({
          gap,
          expected,
          pair: `${a.tagName.toLowerCase()}.${first(a)} -> ${b.tagName.toLowerCase()}.${first(b)}`
        });
      }
    });
    return found;
  }, { CONTROL, LABEL, LABEL_PAIRS, PROSE: [...PROSE] });
}

// The operator screens. Their ids are not known in advance, so they are
// read off the test collection: each card links to its own builder and
// dashboard, and the two study types use different builder paths.
async function operatorPages(page) {
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".study-grid, .list-view-card", { timeout: 20000 });

  const found = await page.evaluate(() => {
    const pick = (type) => {
      const cards = [...document.querySelectorAll(".study-card")];
      const match = cards.find((card) =>
        [...card.querySelectorAll("a")].some((a) => (a.getAttribute("href") || "").startsWith(type))
      );
      if (!match) return null;
      const href = (selector) => match.querySelector(selector)?.getAttribute("href") || null;
      return { builder: href(`a[href^="${type}"]`), dashboard: href('a[href^="/dashboard/"]') };
    };
    return { tree: pick("/builder/"), tone: pick("/tone-builder/") };
  });

  const pages = [{ name: "Test collection", path: "/admin" }];
  if (found.tree?.builder) pages.push({ name: "Tree builder", path: found.tree.builder });
  if (found.tree?.dashboard) pages.push({ name: "Tree dashboard", path: found.tree.dashboard });
  if (found.tone?.builder) pages.push({ name: "Tone builder", path: found.tone.builder });
  if (found.tone?.dashboard) pages.push({ name: "Tone dashboard", path: found.tone.dashboard });

  if (pages.length === 1) {
    console.log("  note  No studies on the test collection, so only /admin was measured.");
  }
  return pages;
}

async function measurePage(page, viewport, target) {
  await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "domcontentloaded" });

  // domcontentloaded above, not networkidle: this site keeps analytics
  // connections open, so "the network went quiet" never arrives and the
  // navigation times out before anything is measured. This wait is what
  // decides when the page is ready.
  //
  // On failure, say which page and what was on it. The first version died
  // with a bare selector timeout naming neither, and the answer, a
  // redirect to a Vercel login, was invisible until it started printing
  // the url. That has now been the fault in three scripts here.
  try {
    await page.waitForSelector(".card", { timeout: 20000 });
  } catch {
    const text = (await page.evaluate(() => document.body.innerText)).trim().replace(/\s+/g, " ").slice(0, 200);
    throw new Error(
      `${viewport.name} ${target.name}: nothing rendered within 20s.\n` +
      `          url:   ${page.url()}\n` +
      `          title: ${await page.title()}\n` +
      `          text:  ${text || "(the page is empty)"}`
    );
  }

  await page.waitForTimeout(1500);

  const found = await measure(page);
  const tally = new Map();
  found.forEach((f) => {
    const key = `${f.gap}px where ${f.expected}px expected   ${f.pair}`;
    tally.set(key, (tally.get(key) || 0) + 1);
  });

  if (tally.size === 0) {
    console.log(`  ok    ${viewport.name.padEnd(7)} ${target.name}`);
    return 0;
  }

  console.log(`  TIGHT ${viewport.name.padEnd(7)} ${target.name}`);
  [...tally.entries()].sort().forEach(([line, count]) => {
    console.log(`          x${String(count).padEnd(3)} ${line}`);
  });
  return tally.size;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  let total = 0;

  try {
    const gate = await browser.newPage({ viewport: VIEWPORTS[0] });
    await gate.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    console.log("\nA browser window has opened.");
    console.log("Sign in to Studier there. If the target is a preview deployment,");
    console.log("Vercel may ask for its own login first; that one is not Studier's.");
    await ask("Once the test collection is on screen, press Enter here... ");
    await gate.close();

    // Read the operator pages once, in one context, then measure everything
    // at both widths.
    const scout = await browser.newPage({ viewport: VIEWPORTS[0] });
    const operator = await operatorPages(scout);
    await scout.close();

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      for (const target of [...PAGES, ...operator]) {
        total += await measurePage(page, viewport, target);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(
    total === 0
      ? "\nEvery measured gap matches the scale.\n"
      : `\n${total} spacing problem${total === 1 ? "" : "s"} above. Fix the rule that decides the value, not the one place it shows.\n`
  );

  if (total > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Spacing check crashed:", error.message);
  process.exit(1);
});
