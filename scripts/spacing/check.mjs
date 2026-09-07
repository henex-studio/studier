// Measures the space between adjacent elements on the participant screens
// and reports anything that does not match the scale.
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
// It measures the participant screens: the ones an outside participant
// sees, reachable with a link alone, and where the fault was. Operator
// screens are not covered; that would need a Studier session, which is
// what npm run smoke is for.
//
// That gap is real and has already cost something. The two spacing faults
// the operator reported on the study card and the tone dashboard are both
// on operator screens this script cannot reach, and both had to be found
// by eye and then measured by hand. Extending it to a signed-in context is
// the obvious next step and is not done. The sign-in this script may ask for is
// Vercel's, not Studier's, and only because preview deployments are
// protected. See the note on BASE_URL.
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
const NEEDS_SIGN_IN = !process.env.SPACING_URL;

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

async function main() {
  const browser = await chromium.launch({ headless: !NEEDS_SIGN_IN });
  let total = 0;

  try {
    if (NEEDS_SIGN_IN) {
      // One window, cleared once, then reused for every measurement below.
      const gate = await browser.newPage({ viewport: VIEWPORTS[0] });
      await gate.goto(`${BASE_URL}${PAGES[0].path}`, { waitUntil: "domcontentloaded" });
      console.log("\nA browser window has opened.");
      console.log("Vercel protects preview deployments, so it may show a Vercel login first.");
      console.log("Sign in there if asked, until the Studier test page is on screen.");
      await ask("Then press Enter here to start measuring... ");
      await gate.close();
    }

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });

      for (const target of PAGES) {
        // domcontentloaded, not networkidle. This site keeps analytics
        // connections open, so "the network went quiet" never happens and
        // the navigation times out before anything is measured. The waits
        // below are what actually decide when the page is ready.
        await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "domcontentloaded" });

        // The tone pages start a session over the network before there is
        // anything to measure. If that never arrives, say which page it
        // was and what was on it instead. The first version waited and
        // then died with a bare selector timeout, naming neither the page
        // nor what the page was actually showing, which is the same
        // failure this repository has now hit three times in other
        // scripts.
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
        } else {
          total += tally.size;
          console.log(`  TIGHT ${viewport.name.padEnd(7)} ${target.name}`);
          [...tally.entries()].sort().forEach(([line, count]) => {
            console.log(`          x${String(count).padEnd(3)} ${line}`);
          });
        }
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
  console.error("Spacing check crashed:", error);
  process.exit(1);
});
