import React from "react";

// The bar that tells an operator they are looking at a preview and nothing
// is being recorded. Shared by both preview paths on purpose.
//
// It started as a local component inside PreviewRunnerPage. When the tone
// test gained a preview it would have become a second copy, and copies of
// the participant flow are what let the tree preview and the tree runner
// drift apart on 7 September. One component, so "preview" looks and reads
// the same wherever it appears.
//
// builderPath differs by study type, which is the only thing that varies:
// a tree test is edited at /builder/<id>, a tone test at /tone-builder/<id>.
export default function PreviewBanner({ builderPath }) {
  return (
    <section className="preview-banner">
      <div className="preview-banner-text">
        <strong>Preview mode</strong>
        <span>Responses are not saved.</span>
      </div>
      <div className="preview-banner-actions">
        <a className="secondary-button" href={builderPath}>Back to editor</a>
        <a className="secondary-button" href="/admin">Back to test collection</a>
      </div>
    </section>
  );
}
