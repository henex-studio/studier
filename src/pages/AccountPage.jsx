import React, { useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";

// Milestone 6 Step 5. display_name is written once at registration and
// there was previously no way to change it, anywhere in the product. This
// was found while preparing for screenshots, when the operator went
// looking for the setting and it did not exist. Scope is deliberately
// display name only, settled by the operator on 30 August 2026: password
// change already has a working path through "Forgot your password?", and
// email change would drag in re-verification and keeping auth.users in
// step with the copy of the address held in profiles, which is not worth
// opening for a screenshot-driven convenience.
//
// The database side of this needed more than a page. profiles had no
// self-update policy at all (only an admin one), and separately both anon
// and authenticated held UPDATE on every column including role, which a
// naive self-update policy would have turned into "any signed-in user can
// make themselves an admin". Both were fixed together in migration
// 20260830_013_profiles_self_update_display_name_only.sql: a policy
// scoped to the caller's own row, and the grant narrowed to display_name
// only. Verified live before this page was written: changing your own
// name succeeds, changing your own role is refused for lack of privilege,
// changing someone else's name is silently refused by the policy.
export default function AccountPage({ profile, onUpdated }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");

    const cleaned = displayName.trim();
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: cleaned || null })
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Saved.");
    onUpdated?.(data);
  }

  return (
    <AdminShell profile={profile}>
      <section className="card admin-header">
        <div>
          <h1>Account</h1>
          <p className="muted-text">Change how your name appears around Studier.</p>
        </div>
        <div className="admin-actions">
          <a className="secondary-button" href="/admin">Back to test collection</a>
        </div>
      </section>

      <section className="card">
        <label className="form-block">
          <span className="form-label">Email</span>
          <span className="muted-text">{profile?.email}</span>
        </label>

        <label className="form-block">
          <span className="form-label">Role</span>
          <span className="muted-text">{profile?.role === "admin" ? "Admin" : "User"}</span>
        </label>

        <label className="form-block">
          <span className="form-label">Display name</span>
          <span className="muted-text">Shown in the top navigation and, for an admin, next to any test you own.</span>
          <input
            className="text-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={80}
          />
        </label>

        {message ? <p className={message === "Saved." ? "success-box" : "error-box"}>{message}</p> : null}

        <div className="button-row">
          <button className="primary-button" disabled={saving} onClick={save}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
