import React, { useMemo, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import Hero from "../components/Hero";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("registered") === "1";
  }, []);

  async function login(event) {
    event.preventDefault();
    setMessage("");

    if (!supabaseReady) {
      setMessage("Supabase is not configured.");
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);

    if (error) {
      // Supabase's own wording ("Email not confirmed") is accurate but easy
      // to misread as a typo error. Naming the actual cause, and where to
      // go to resolve it, matches fevnote's describeAuthError.
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        setMessage("This account has not been confirmed yet. Check your email for the confirmation link.");
      } else {
        setMessage(error.message);
      }
      return;
    }

    navigateTo("/admin");
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">

          <Hero />

          <h1>Sign in</h1>
          <p>Sign in to create and manage user tests.</p>

          {registered ? (
            <p className="success-box">
              Account created. Please sign in.
            </p>
          ) : null}

          <form className="form-stack" onSubmit={login}>
            <label className="form-block">
              <span className="form-label">Email</span>
              <input
                className="text-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="form-block">
              <span className="form-label">Password</span>
              <input
                className="text-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <p className="auth-switch-text">
              <a href="/forgot-password">Forgot your password?</a>
            </p>

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch-text">
            Need an account? <a href="/register">Register</a>
          </p>
        </section>
      </main>
    </div>
  );
}
