import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { CONSENT_VERSION, hasLocalConsent } from "./ConsentPage";
import { PRIVACY_POLICY_VERSION } from "./PrivacyPolicyPage";
import Hero from "../components/Hero";

function normalizeInviteCode(value) {
  return value.trim().toUpperCase();
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Registration Step 5. The invite code stays, but the account is now
// created by supabase.auth.signUp alone, with the invite code, display
// name and consent version carried in as sign-up metadata rather than
// written by a second call afterwards. The public.handle_new_user
// trigger (Registration Step 1) reads that metadata, enforces the
// invite code at the database itself, and writes the profile row. This
// page's own validate_invite_code check before signUp stays in place
// as a friendly pre-check, on fevnote's Register.jsx pattern: it gives
// a clear "invite code is not valid" message before the account is
// even attempted, while the trigger remains the real enforcement point
// behind it.
//
// A privacy policy version is not stamped here yet. Studier does not
// have a published privacy policy to record agreement to; see
// harness-docs/PLAN-privacy-policy.md. Adding privacy_version to the
// metadata below is the last part of that plan's Step 4, once the
// policy itself exists.
export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmailFor, setCheckEmailFor] = useState("");

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

    // Friendly pre-check only. The database trigger enforces this for
    // real; this call exists so an expired or already-used code fails
    // with a clear message here rather than a generic one from signUp.
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
      password,
      options: {
        data: {
          invite_code: cleanInviteCode,
          display_name: cleanDisplayName,
          consent_version: CONSENT_VERSION,
          privacy_version: PRIVACY_POLICY_VERSION
        }
      }
    });

    setLoading(false);

    if (signUpError) {
      setMessage(signUpError.message);
      return;
    }

    // Supabase silently no-ops instead of erroring when the email already
    // has an account, so it does not reveal which emails are registered.
    // An empty identities array is how that shows up.
    if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
      setMessage("An account with this email already exists. Try signing in instead.");
      return;
    }

    // With email confirmation switched on, signUp returns a user but no
    // session, and the account cannot sign in until the link is
    // followed. Without confirmation switched on, a session comes back
    // immediately and there is nothing to wait for.
    if (!signUpData?.session) {
      setCheckEmailFor(cleanEmail);
      return;
    }

    navigateTo("/admin");
  }

  if (checkEmailFor) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card hero-card">
            <Hero />
            <h1>Check your email</h1>
            <p>
              We sent a confirmation link to {checkEmailFor}. Open it to finish creating your
              account, then come back here to sign in.
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

            <p className="muted-text">
              By creating an account you agree to our{" "}
              <a href="/privacy">privacy policy</a>, which explains what Studier collects about
              you and about the people who answer your tests.
            </p>

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
