import React from "react";

// Shown instead of the participant flow when a test has nothing in it yet.
//
// Added 9 September 2026. Opening the preview of an empty tree test gave a
// blank white page: the task screen reads displayedTask.task_text, there
// was no task, and the render threw. Nothing on screen, no way back except
// the browser's back button.
//
// A preview of an empty test cannot be made to work, so this does not try.
// It names what is missing, so the operator knows what to go and add
// rather than guessing, and it offers the two places they would want to
// go next. Same two destinations as PreviewBanner, in the same order.
//
// missing is a list of plain phrases, already ordered by the caller. Both
// study types use this, so nothing here knows which one it is looking at.
export default function NothingToPreview({ builderPath, missing }) {
  const items = missing.filter(Boolean);

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card">
          <h1>Nothing to preview yet</h1>
          <p>
            A preview shows what a participant sees. This test does not have enough in it to
            show anything.
          </p>

          {items.length ? (
            <>
              <p className="form-label">Still to add</p>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="button-row">
            <a className="primary-button" href={builderPath}>Back to editor</a>
            <a className="secondary-button" href="/admin">Back to test collection</a>
          </div>
        </section>
      </main>
    </div>
  );
}
