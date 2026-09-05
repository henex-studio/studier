import React, { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";

// PLAN-account-deletion.md Step 3. Counts are read, not guessed, so the
// warning names what is actually about to be destroyed rather than a
// generic sentence. is_study_owner already scopes both response tables to
// the caller's own studies, the same policy the dashboard relies on, so
// this asks for nothing it could not already see.
async function loadDeletionCounts(ownerId) {
  const { data: myStudies } = await supabase.from("studies").select("id").eq("owner_id", ownerId);
  const studyIds = (myStudies || []).map((study) => study.id);

  if (studyIds.length === 0) {
    return { studyCount: 0, participantCount: 0 };
  }

  const [{ count: treeCount }, { count: toneCount }] = await Promise.all([
    supabase.from("participant_sessions").select("id", { count: "exact", head: true }).in("study_id", studyIds),
    supabase.from("tone_sessions").select("id", { count: "exact", head: true }).in("study_id", studyIds)
  ]);

  return { studyCount: studyIds.length, participantCount: (treeCount || 0) + (toneCount || 0) };
}

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

  const [counts, setCounts] = useState(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    if (profile?.id) {
      loadDeletionCounts(profile.id).then((result) => { if (active) setCounts(result); });
    }
    return () => { active = false; };
  }, [profile?.id]);

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

  // PLAN-account-deletion.md Step 3 and decisions D1 to D3. The button
  // stays disabled until the typed text matches the signed-in email
  // exactly, which is the friction the operator asked for in place of a
  // single OK on a dialog. Refusing the last administrator, and destroying
  // participant response data along with the account, are both enforced
  // in delete_my_account() itself, not repeated here, so this page cannot
  // drift out of step with the one place that decision actually lives.
  const confirmMatches = confirmEmail.trim().toLowerCase() === (profile?.email || "").trim().toLowerCase();

  async function deleteAccount() {
    if (!confirmMatches || deleting) return;
    setDeleting(true);
    setDeleteError("");

    const { error } = await supabase.rpc("delete_my_account");

    if (error) {
      setDeleting(false);
      setDeleteError(error.message);
      return;
    }

    setDeleted(true);
    await supabase.auth.signOut();
  }

  if (deleted) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">
            <h1>Account deleted</h1>
            <p>
              Your Studier account, every test you owned, and every response those tests collected
              have been permanently deleted. This cannot be undone.
            </p>
            <div className="button-row">
              <a className="primary-button" href="/login">Back to sign in</a>
            </div>
          </section>
        </main>
      </div>
    );
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

      <section className="card">
        <h2>Delete account</h2>
        <p>
          This permanently deletes your Studier account
          {counts ? (
            <>
              {" "}and everything in it: {counts.studyCount} {counts.studyCount === 1 ? "test" : "tests"}
              {counts.participantCount > 0 ? (
                <> and {counts.participantCount} {counts.participantCount === 1 ? "response" : "responses"} collected from participants</>
              ) : null}
              .
            </>
          ) : (
            " and everything in it, including every test you own and every response those tests have collected."
          )}
        </p>
        <p className="error-box">
          This cannot be undone. There is no recovery, no grace period, and no way for Studier or
          Henex Studio to restore it once it is gone. Participant responses are destroyed along
          with the tests that collected them, even though the participants themselves never had an
          account here.
        </p>
        <p className="muted-text">
          If you would rather not use the button, email <a href="mailto:privacy@henex.uk">privacy@henex.uk</a>{" "}
          from this account's address and the same deletion will be done for you within 20 working days.
        </p>

        <label className="form-block">
          <span className="form-label">Type your email address, {profile?.email}, to confirm</span>
          <input
            className="text-input"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            placeholder={profile?.email}
            autoComplete="off"
          />
        </label>

        {deleteError ? <p className="error-box">{deleteError}</p> : null}

        <div className="button-row">
          <button
            className={confirmMatches ? "danger-button danger-button-armed" : "danger-button"}
            disabled={!confirmMatches || deleting}
            onClick={deleteAccount}
          >
            {deleting ? "Deleting..." : "Delete my account permanently"}
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
