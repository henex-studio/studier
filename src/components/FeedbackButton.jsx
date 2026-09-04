import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

// A single floating entry point to feedback, mounted once in AdminShell so
// it appears on every signed-in screen. Structure copied from fevnote's
// FeedbackButton.jsx; see DEV-PLAN.md Step 5b. AdminShell wraps only the
// signed-in part of the app, so this never mounts on a participant's
// public test link (PublicTestRouter and ConsentPage render outside it),
// which is what the operator asked for.
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    setSent(false);
  }

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
      >
        <MessageSquare size={22} strokeWidth={2} aria-hidden="true" />
      </button>

      {open ? (
        <div className="feedback-panel-backdrop" onClick={close}>
          <div className="card feedback-panel" onClick={(event) => event.stopPropagation()}>
            <div className="feedback-panel-header">
              <h2>Send feedback</h2>
              <button type="button" className="feedback-panel-close" onClick={close} aria-label="Close">
                <X size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <div className="success-box">
                Thanks, your feedback was sent.
                <div className="button-row">
                  <button type="button" className="secondary-button" onClick={close}>Close</button>
                </div>
              </div>
            ) : (
              <FeedbackForm onSent={() => setSent(true)} onCancel={close} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
