import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      setError(loginError.message);
      return;
    }
    window.location.href = "/admin";
  }

  if (!supabaseReady) return <div className="page-shell"><main className="container narrow"><section className="card"><h1>Studier</h1><p>Supabase environment variables are not configured.</p></section></main></div>;

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">
          <span className="badge">Studier</span>
          <h1>Sign in</h1>
          <p>Internal tree test builder for invited users.</p>
          <form onSubmit={login} className="form-stack">
            <label className="form-label">Email</label>
            <input className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label className="form-label">Password</label>
            <input className="text-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error ? <p className="error-box">{error}</p> : null}
            <button className="primary-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
