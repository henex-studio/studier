# Guide screenshots

Generates the ten screenshots Milestone 6 Step 7 places into the two guide
pages (`src/pages/GuidePage.jsx` and `src/pages/tonetest/ToneGuidePage.jsx`):
test collection, creating a tree test, creating a tone test, the tree
builder, the tone builder, the publish check, the tree test participant
view, the tone test participant view, the tree dashboard, and the tone
dashboard.

## Why this runs on your machine, not in a Cowork session

This needs a real, installable browser. Cowork's sandbox has no root
access, so Playwright's browser cannot install its system dependencies
there. On your own computer this is a normal `npx playwright install`.

## What it touches

Only the dev preview deployment (`studier-git-dev-...vercel.app`), which
already points at the Supabase development branch, the same one your local
development and the preview both use. Production is never involved.

The script briefly creates one throwaway draft test, titled "Screenshot
publish check", to capture what the publish validation looks like when
something is missing (both real demo studies are already published, so
neither one shows that screen). It deletes that draft itself before
finishing. The two real demo studies are only read, never edited.

## Running it

```
npx playwright install chromium   # one-time; downloads the browser itself
npm run screenshots
```

A real, visible Chrome window opens at the Test collection sign-in
screen. Sign in there yourself, the way you always do, then come back to
the terminal and press Enter. The script never sees or handles your
password; it only waits for you to finish. Everything after that runs on
its own, about half a minute, printing one line per screenshot saved.

Output lands directly in `public/guide/`:
`01-test-collection.png` through `10-tone-dashboard.png`.

## When to re-run this

Any time a change touches how the test collection page, either builder,
either participant view, or either dashboard looks. Re-run it and the same
ten filenames are overwritten in place, so nothing in the two guide pages
needs to change afterward unless a screenshot's content, not just its
appearance, needs to move to a different step.
