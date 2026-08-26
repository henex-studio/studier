import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import Hero from "../components/Hero";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Sets a new password for the session created by following a reset
// link. Supabase's recovery link signs the browser in with a
// short-lived session for exactly this purpose. Until Milestone
// registration Step 7 wires PASSWORD_RECOVERY detection into App.jsx,
// reaching this page automatically from a real reset email is not yet
// guaranteed; App.jsx currently treats any session as an ordinary
// sign-in and would route to /admin instead. This page is reachable
// directly at /reset-password in the meantime, and Step 7 closes the
// gap so a recovery session cannot land anywhere else.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!supabaseReady) {
      setMessage("Supabase is not configured.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message || "Could not update the password. Please try again.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card hero-card">
            <Hero />
            <h1>Password updated</h1>
            <p>Your password has been changed. Sign in with your new password.</p>
            <div className="button-row">
              <button
                className="primary-button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigateTo("/login");
                }}
              >
                Go to sign in
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">
          <Hero />

          <h1>Choose a new password</h1>
          <p>This replaces your old password.</p>

          <form className="form-stack" onSubmit={submit}>
            <label className="form-block">
              <span className="form-label">New password</span>
              <input
                className="text-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="form-block">
              <span className="form-label">Confirm new password</span>
              <input
                className="text-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" disabled={loading}>
              {loading ? "Saving..." : "Save new password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
