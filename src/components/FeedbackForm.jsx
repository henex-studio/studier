import React, { useState } from "react";
import { supabase } from "../lib/supabase";

// Structure copied from fevnote's FeedbackForm.jsx rather than redesigned;
// see DEV-PLAN.md Step 5b. Categories match fevnote's three exactly, agreed
// with the operator on 4 September 2026.
const CATEGORIES = [
  { value: "bug", label: "Something is broken" },
  { value: "idea", label: "An idea or request" },
  { value: "other", label: "Something else" }
];

function describeFeedbackError(error) {
  const message = error?.message || "";
  if (message.includes("feedback_message_length")) {
    return "Feedback must be between 1 and 2000 characters.";
  }
  return message || "Could not send feedback. Please try again.";
}

export default function FeedbackForm({ onSent, onCancel }) {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    if (!message.trim()) {
      setError("Write a message before sending.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: submitError } = await supabase
      .from("feedback")
      .insert({ category, message: message.trim() });

    if (submitError) {
      setError(describeFeedbackError(submitError));
      setBusy(false);
      return;
    }

    setBusy(false);
    onSent();
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <p className="muted-text">
        Sent with your account email so the team knows who it is from and can reply. This is not anonymous.
      </p>

      <label className="form-label" htmlFor="feedback-category">What kind of feedback is this?</label>
      <select
        id="feedback-category"
        className="text-input"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        disabled={busy}
      >
        {CATEGORIES.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <label className="form-label" htmlFor="feedback-message">Message</label>
      <textarea
        id="feedback-message"
        className="text-input"
        rows={5}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What happened, or what would help?"
        disabled={busy}
        required
      />

      {error ? <p className="error-box">{error}</p> : null}

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="primary-button" disabled={busy}>{busy ? "Sending..." : "Send feedback"}</button>
      </div>
    </form>
  );
}
