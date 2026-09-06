import React, { useEffect, useState } from "react";

// Audit finding B4. Four destructive or disruptive actions used
// window.prompt or window.confirm: clearing response data, deleting a
// study, leaving a builder with unsaved changes, and turning off a tone
// test role. Native dialogs cannot be styled to match the rest of the
// site, and some browsers suppress them outright. AccountPage.jsx's own
// account deletion already does this properly, with an in-page typed
// confirmation; this component generalises that pattern rather than
// leaving each caller to rebuild it.
//
// Same backdrop-and-panel base classes as PrivacyPolicyModal.jsx, with
// centred sizing of its own on top, the same way policy-modal-backdrop
// sits on top of feedback-panel-backdrop.
//
// requireText turns on typed confirmation, matched trimmed and exact
// against the confirm button, the same rule AccountPage.jsx uses for its
// own email confirmation. Leave it unset for a plain two-button dialog.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  detail = null,
  requireText = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  error = "",
  onConfirm,
  onCancel
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  const needsText = requireText.length > 0;
  const matches = !needsText || typed.trim() === requireText;

  return (
    <div className="feedback-panel-backdrop confirm-dialog-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="card feedback-panel confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        {detail}

        {needsText ? (
          <label className="form-block">
            <span className="form-label">Type {requireText} to confirm</span>
            <input
              className="text-input"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>
        ) : null}

        {error ? <p className="error-box">{error}</p> : null}

        <div className="button-row">
          <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "danger-button" : "primary-button"}
            disabled={busy || !matches}
            onClick={onConfirm}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
