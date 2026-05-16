import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { CONSENT_VERSION, hasLocalConsent } from "./ConsentPage";

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

    const cleanDisplayName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanInviteCode = normalizeInviteCode(inviteCode);

    if (!hasLocalConsent()) {
      navigateTo("/");
      return;
    }

    if (!supabaseReady) {
      setMessage("Supabase is not configured.");
      return;
    }

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

    const { data: inviteOk, error: inviteError } = await supabase.rpc("validate_invite_code", { p_code: cleanInviteCode });

    if (inviteError || inviteOk !== true) {
      setLoading(false);
      setMessage(inviteError?.message || "Invite code is not valid or has reached its use limit.");
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

    if (!userId) {
      setLoading(false);
      setMessage("Account could not be created. Please try again.");
      return;
    }

    const { error: profileError } = await supabase.rpc("complete_invite_registration", {
      p_user_id: userId,
      p_email: cleanEmail,
      p_display_name: cleanDisplayName,
      p_code: cleanInviteCode,
      p_consent_version: CONSENT_VERSION
    });

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
          <span className="badge">Studier</span>
          <h1>Create account</h1>
          <p>Register with an invite code. New accounts are created as user accounts.</p>

          <form className="form-stack" onSubmit={register}>
            <label className="form-block">
              <span className="form-label">Display name</span>
              <input className="text-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="For example, Trump" autoComplete="name" />
            </label>

            <label className="form-block">
              <span className="form-label">Email</span>
              <input className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>

            <label className="form-block">
              <span className="form-label">Password</span>
              <input className="text-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
              <span className="muted-text">Use at least 6 characters.</span>
            </label>

            <label className="form-block">
              <span className="form-label">Invite code</span>
              <input className="text-input" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} autoComplete="off" />
            </label>

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch-text">Already have an account? <a href="/login">Sign in</a></p>
        </section>
      </main>
    </div>
  );
}
