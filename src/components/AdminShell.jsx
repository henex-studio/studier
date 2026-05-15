import React from "react";
import { supabase } from "../lib/supabase";

export default function AdminShell({ profile, children }) {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <h1>Studier</h1>
          <p>{profile?.display_name || profile?.email} · {profile?.role}</p>
        </div>
        <div className="topbar-actions">
          <a className="secondary-button" href="/admin">
            Test collection
          </a>
          <a className="secondary-button" href="/guide">
            Guide
          </a>
          <button className="secondary-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
