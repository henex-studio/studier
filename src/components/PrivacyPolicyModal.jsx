import React from "react";
import { X } from "lucide-react";
import PrivacyPolicyContent from "../pages/PrivacyPolicyContent";

// PLAN-account-deletion.md Step 5a follow-up, 5 September 2026. The privacy
// policy link on the registration form and the consent screen used to open
// /privacy as a full navigation, which either left a half-filled form
// behind or, opened in a new tab, put the policy one tab away from the
// place that needed it. Same backdrop-and-panel pattern FeedbackButton
// already uses, just larger and scrollable, so the page underneath (and
// whatever the person has typed into it) never unmounts.
export default function PrivacyPolicyModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="feedback-panel-backdrop policy-modal-backdrop" onClick={onClose}>
      <div className="card feedback-panel policy-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-panel-header">
          <h2>Privacy policy</h2>
          <button type="button" className="feedback-panel-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="policy-modal-body">
          <PrivacyPolicyContent />
        </div>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
