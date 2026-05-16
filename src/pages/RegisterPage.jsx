import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { CONSENT_VERSION, hasLocalConsent } from "./ConsentPage";
import Hero from "../components/Hero";

function normalizeInviteCode(value) {
  return value.trim().toUpperCase();
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event) {
    event.preventDefault();
    setMessage("");

    if (!hasLocalConsent()) {
      navigateTo("/");
      return;
    }

    const cleanDisplayName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanInviteCode = normalizeInviteCode(inviteCode);

    if (!cleanDisplayName) {
      setMessage("Display name is required.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Email is required.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!cleanInviteCode) {
      setMessage("Invite code is required.");
      return;
    }

    setLoading(true);

    const { data: inviteOk } = await supabase.rpc("validate_invite_code", {
      p_code: cleanInviteCode
    });

    if (inviteOk !== true) {
      setLoading(false);
      setMessage("Invite code is not valid or has reached its limit.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password
    });

    if (signUpError) {
      setLoading(false);
      setMessage(signUpError.message);
      return;
    }

    const userId = signUpData?.user?.id;

    const { error: profileError } = await supabase.rpc(
      "complete_invite_registration",
      {
        p_user_id: userId,
        p_email: cleanEmail,
        p_display_name: cleanDisplayName,
        p_code: cleanInviteCode,
        p_consent_version: CONSENT_VERSION
      }
    );

    if (profileError) {
      setLoading(false);
      setMessage(profileError.message);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    navigateTo("/login?registered=1");
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">

          <Hero />

          <h1>Create account</h1>

          <form className="form-stack" onSubmit={register}>
            <input
              className="text-input"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <input
              className="text-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              className="text-input"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </section>
      </main>
    </div>
  );
}
