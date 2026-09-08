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
// It signs in to Studier once, the same manual pause npm run smoke and
// npm run screenshots already use, and it never types a password.
//
// A run creates a tone test session on the study it opens, because opening
// a role link is what starts one. It deletes nothing, so clear those out
// afterwards the same way the smoke test does.

import { chromium } from "playwright";
import readline from "node:readline";

// Production. Work moved to main on 7 September 2026, so the dev preview
// this used to point at is no longer where the code being checked lives.
// Checking a branch nobody is committing to is worse than not checking.
//
// This does not change what the checks touch in the database. Both the
// preview and production have always pointed at the same Supabase project,
// because there is no separate development database (audit finding A7).
//
// SPACING_URL still overrides it, for checking a preview before it lands.
const BASE_URL = process.env.SPACING_URL || "https://studier.henex.uk";

// Kept because it cost three runs to learn. Aiming at a preview meant
// Vercel's own login stood in front of the site, which the first version
// reported only as "waiting for locator to be visible", naming neither the
// page nor the redirect. Printing the url and the title on failure is what
// found it, and is why every failure here still does that.
//
// A fully unattended version would have to hold an account's credentials,
// which is not something this repository will do.
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

// The scale.
//
//   CONTROL: two separate things. 14, or 12 below 640px, where a
//            deliberate mobile rule tightens every button row.
//   LABEL:   a label, caption or help line and the control it describes.
//            Closer on purpose, so a reader can see what belongs to what.
const CONTROL = 14;
const CONTROL_MOBILE = 12;
const LABEL = 8;

// What counts as a label relationship, by meaning rather than by a list of
// class names that has to be kept complete.
//
// Two rules do almost all of it. Anything carrying one of these classes is
// a label, a caption or a help line, and whatever follows it is what it
// describes. And two elements inside the same <label> element belong
// together by definition, which is what a radio button and its own text
// are; that pair was reported as a fault until this rule existed.
//
// The named pair that is left does not fit either: the rating scale's
// caption sits after a button row rather than before its control.
const LABEL_CLASSES = ["form-label", "muted-text", "owner-chip"];
const LABEL_PAIRS = [["button-row", "rating-scale-labels"]];

// Things this check has no business measuring. Added after its first real
// run reported sixty-five problems of which most were its own.
//
//   PROSE      line height does the spacing, not a control scale.
//   STRUCTURE  tables separate rows with borders; measuring the gap
//              between two <tr> against a control scale is meaningless.
//              SVG internals are drawing instructions, not layout.
//   HIDDEN     a visually hidden label has no position to measure.
const PROSE = ["li", "p", "span", "strong", "em", "br"];
const STRUCTURE = ["table", "thead", "tbody", "tfoot", "tr", "td", "th", "svg", "path", "rect", "circle", "g", "line", "polyline"];

// A tree is a dense hierarchical list, and its nodes sit 6 apart on
// purpose. Spacing them like separate controls would make a real site tree
// several screens tall. Excluded rather than added as a third value,
// because the point of the scale is that there are two.
const DENSE = ["tree-node", "tree-children", "tree-button", "tree-wrap"];

// The participant screens, reachable with a link and nothing else. The
// operator screens are discovered at run time, further down.
const PAGES = [
  { name: "Tone test, Audience", path: "/test/driver-licence-renewal-reminder-hsurx?role=audience" },
  { name: "Tone test, Agency", path: "/test/driver-licence-renewal-reminder-hsurx?role=agency" },
  { name: "Tree test", path: "/test/transport-services-navigation-test-j6foa" }
];

// Both are measured, because the mobile rules are a different layout and
// a fault can exist in one and not the other.
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

async function measure(page, viewport) {
  return page.evaluate(({ CONTROL, LABEL, LABEL_CLASSES, LABEL_PAIRS, PROSE, STRUCTURE, DENSE }) => {
    const first = (el) => String(el.className?.baseVal ?? el.className ?? "").split(" ")[0] || "";
    const tag = (el) => el.tagName.toLowerCase();
    const sameLabel = (a, b) => {
      const owner = a.closest("label");
      return Boolean(owner) && owner === b.closest("label");
    };
    const isLabelPair = (a, b) =>
      sameLabel(a, b) ||
      LABEL_CLASSES.includes(first(a)) ||
      LABEL_PAIRS.some(([x, y]) => first(a) === x && first(b) === y);

    const skip = (el) =>
      STRUCTURE.includes(tag(el)) ||
      DENSE.includes(first(el)) ||
      el.closest("svg") !== null ||
      el.classList?.contains("sr-only");

    const found = [];
    document.querySelectorAll("main *").forEach((parent) => {
      const kids = [...parent.children].filter((el) => el.getClientRects().length);
      for (let i = 0; i < kids.length - 1; i += 1) {
        const a = kids[i];
        const b = kids[i + 1];
        if (skip(a) || skip(b)) continue;
        if (PROSE.includes(tag(a)) && PROSE.includes(tag(b))) continue;

        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        if (rb.top < ra.bottom - 1) continue;               // side by side, not stacked

        // What a reader actually sees between them, which includes the
        // padding each one carries. A study card's actions block sits at a
        // gap of 0 and looks correct, because its own top padding is the
        // space. Measuring the gap alone called that a fault.
        const sa = getComputedStyle(a);
        const sb = getComputedStyle(b);
        const visible =
          (rb.top - ra.bottom) +
          parseFloat(sa.paddingBottom || 0) +
          parseFloat(sb.paddingTop || 0);

        const gap = Math.round(visible * 10) / 10;
        const expected = isLabelPair(a, b) ? LABEL : CONTROL;
        if (gap >= expected - 0.5) continue;                 // roomier is not the fault being hunted

        found.push({
          gap,
          expected,
          pair: `${tag(a)}.${first(a)} -> ${tag(b)}.${first(b)}`
        });
      }
    });
    return found;
  }, {
    CONTROL: viewport.width < 640 ? CONTROL_MOBILE : CONTROL,
    LABEL, LABEL_CLASSES, LABEL_PAIRS, PROSE, STRUCTURE, DENSE
  });
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

  const found = await measure(page, viewport);
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

  // One context, one page, for the whole run.
  //
  // browser.newPage() creates a fresh context every time, and a fresh
  // context has no cookies. The first version signed in on one page and
  // then opened new ones for each viewport, so every measurement ran
  // signed out and the operator sat through the sign-in three times
  // watching it fail. The viewport is changed on the single page instead.
  const context = await browser.newContext({ viewport: VIEWPORTS[0] });
  const page = await context.newPage();

  let total = 0;

  try {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    console.log("\nA browser window has opened. Sign in to Studier there.");
    await ask("Once the test collection is on screen, press Enter here... ");

    // Confirm the sign-in took, rather than discovering it four pages later
    // as a selector timeout.
    try {
      await page.waitForSelector('h1:has-text("Test collection")', { timeout: 15000 });
    } catch {
      throw new Error(
        `Still not signed in.\n` +
        `          url:   ${page.url()}\n` +
        `          title: ${await page.title()}`
      );
    }

    const operator = await operatorPages(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const target of [...PAGES, ...operator]) {
        total += await measurePage(page, viewport, target);
      }
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
