import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessage(error.message);
      return;
    }

    navigateTo("/admin");
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">
          <span className="badge">Studier</span>
          <h1>Sign in</h1>
          <p>Sign in to create and manage internal tree tests.</p>

          <form className="form-stack" onSubmit={login}>
            <label className="form-block">
              <span className="form-label">Email</span>
              <input
                className="text-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="form-block">
              <span className="form-label">Password</span>
              <input
                className="text-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            {message ? <p className="error-box">{message}</p> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-switch-text">
            Need an account? <a href="/register">Register with an invite code</a>
          </p>
        </section>
      </main>
    </div>
  );
}
