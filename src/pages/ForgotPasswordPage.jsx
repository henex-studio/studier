import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import Hero from "../components/Hero";

// Requests a password reset email. Supabase returns success whether or
// not the address has an account, and this page shows the same message
// either way. Confirming or denying that an email is registered is
// itself a privacy leak, so the difference is never surfaced. See
// harness-docs/PLAN-registration.md, step 4, and fevnote's
// requestPasswordReset, which this follows.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (!supabaseReady) {
      setMessage("Supabase is not configured.");
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage("Enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin
    });

    setLoading(false);

    if (error) {
      setMessage(error.message || "Could not send the reset email. Please try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card hero-card">
            <Hero />
            <h1>Check your email</h1>
            <p>
              If an account exists for {email.trim()}, a password reset link is on its way. Open
              it to choose a new password.
            </p>
            <p className="auth-switch-text">
              <a href="/login">Back to sign in</a>
            </p>
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

          <h1>Reset your password</h1>
          <p>Enter the email on your account and we'll send a reset link.</p>

          <form className="form-stack" onSubmit={submit}>
            <label className="form-block">
              <span className="form-label">Email</span>
              <input
                className="text-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="auth-switch-text">
            <a href="/login">Back to sign in</a>
          </p>
        </section>
      </main>
    </div>
  );
}
