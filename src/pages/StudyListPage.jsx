import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";

function makeSlug(title) {
  return (
    String(title || "test")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function statusLabel(status) {
  if (status === "published") return "Published";
  if (status === "closed") return "Closed";
  return "Draft";
}

function statusClass(status) {
  if (status === "published") return "status-badge status-published";
  if (status === "closed") return "status-badge status-closed";
  return "status-badge status-draft";
}

function ownerClass(ownerId) {
  const value = String(ownerId || "");
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total += value.charCodeAt(index);
  return `owner-chip owner-chip-${(total % 5) + 1}`;
}

export default function StudyListPage({ profile }) {
  const [studies, setStudies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [copiedStudyId, setCopiedStudyId] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");
  const [loading, setLoading] = useState(true);

  const ownerById = useMemo(() => {
    const map = new Map();
    profiles.forEach((item) => {
      map.set(item.id, {
        label: item.display_name || item.email || "Unknown user",
        title: item.email || item.display_name || "Unknown user"
      });
    });
    return map;
  }, [profiles]);

  async function loadStudies() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("studies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const studyRows = data || [];
    setStudies(studyRows);

    const ownerIds = [...new Set(studyRows.map((study) => study.owner_id).filter(Boolean))];
    if (ownerIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,role,display_name")
        .in("id", ownerIds);
      if (profileError) setMessage(profileError.message);
      else setProfiles(profileData || []);
    } else {
      setProfiles([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStudies();
  }, []);

  async function createStudy() {
    setMessage("");
    setCopiedStudyId("");
    setFallbackLink("");

    if (!title.trim()) {
      setMessage("Please enter a test title.");
      return;
    }

    if (profile.role !== "admin" && studies.length >= 3) {
      setMessage("You have reached the 3 test limit. Please delete an old test before creating a new one.");
      return;
    }

    const defaultStudy = {
      owner_id: profile.id,
      title: title.trim(),
      slug: makeSlug(title),
      status: "draft",
      welcome_text: [
        "Thank you for taking part in this short internal pilot.",
        "You will see short tasks. For each task, choose where you would expect to find the information."
      ],
      welcome_bullets: ["This is a tree test. It asks where people would click in a menu to find information."],
      privacy_text: [
        "This test does not ask for your name or contact details.",
        "Please do not enter personal or case details."
      ],
      end_text: ["You have completed the test.", "Thank you for helping improve the navigation."],
      data_collection_settings: {
        record_match_type: true,
        record_time_seconds: true,
        record_first_click: true,
        record_click_count: true,
        record_click_history: false,
        record_backtrack_count: false,
        record_depth: false,
        record_hesitation_flag: false
      }
    };

    const { data, error } = await supabase.from("studies").insert(defaultStudy).select().single();
    if (error) {
      setMessage(error.message);
      return;
    }
    navigateTo(`/builder/${data.id}`);
  }

  async function updateStatus(study, status) {
    setCopiedStudyId("");
    setFallbackLink("");
    const payload = { status, updated_at: new Date().toISOString() };
    if (status === "published") payload.published_at = new Date().toISOString();
    if (status === "closed") payload.closed_at = new Date().toISOString();
    const { error } = await supabase.from("studies").update(payload).eq("id", study.id);
    if (error) setMessage(error.message);
    await loadStudies();
  }

  async function deleteStudy(study) {
    setCopiedStudyId("");
    setFallbackLink("");
    const ok = window.confirm("This will permanently delete this test, its tree, questions, responses, final answers, and dashboard data. This action cannot be undone.");
    if (!ok) return;
    const { error } = await supabase.from("studies").delete().eq("id", study.id);
    if (error) setMessage(error.message);
    await loadStudies();
  }

  async function copyTestLink(study) {
    const fullLink = `${window.location.origin}/test/${study.slug}`;
    setFallbackLink("");
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopiedStudyId(study.id);
      window.setTimeout(() => {
        setCopiedStudyId((current) => (current === study.id ? "" : current));
      }, 2200);
    } catch {
      setCopiedStudyId(study.id);
      setFallbackLink(fullLink);
    }
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <h1>Test collection</h1>
        <p>Create and manage internal tree tests.</p>
        <div className="inline-form">
          <input className="text-input" placeholder="New test title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <button className="primary-button" onClick={createStudy}>Add new test</button>
        </div>
        {message ? <p className="error-box">{message}</p> : null}
        {profile.role !== "admin" ? <p className="muted-text">Test limit: {studies.length} of 3.</p> : null}
      </section>

      <section className="study-grid">
        {loading ? <div className="card">Loading...</div> : null}
        {!loading && studies.length === 0 ? <div className="card">No tests yet.</div> : null}

        {studies.map((study) => {
          const owner = ownerById.get(study.owner_id) || { label: "Unknown user", title: "Unknown user" };
          const isAdminView = profile.role === "admin";
          const fullLink = `${window.location.origin}/test/${study.slug}`;
          const isCopied = copiedStudyId === study.id;

          return (
            <article className="card study-card" key={study.id}>
              <div className="study-card-header">
                <span className={statusClass(study.status)}>{statusLabel(study.status)}</span>
                {isAdminView ? <span className={ownerClass(study.owner_id)} title={owner.title}>{owner.label}</span> : null}
              </div>

              <h2>{study.title}</h2>
              <p className="study-link-code" title={fullLink}>Test link code: <span>/{study.slug}</span></p>

              <div className="button-row">
                <a className="secondary-button" href={`/builder/${study.id}`}>Edit</a>
                <a className="secondary-button" href={`/dashboard/${study.id}`}>Dashboard</a>
                <a className="secondary-button" href={`/preview/${study.id}`}>Preview</a>
                {study.status === "published" ? <a className="secondary-button" href={`/test/${study.slug}`} target="_blank" rel="noreferrer">Open link</a> : null}
              </div>

              <div className="button-row stable-action-row">
                {study.status !== "published" ? <button className="primary-button" onClick={() => updateStatus(study, "published")}>Publish</button> : <button className="secondary-button" onClick={() => updateStatus(study, "closed")}>Close</button>}
                {study.status === "published" ? <button className="secondary-button" type="button" onClick={() => copyTestLink(study)}>Copy link</button> : null}
                <button className="danger-button" onClick={() => deleteStudy(study)}>Delete</button>
              </div>

              {isCopied ? <div className="copy-toast">{fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}</div> : null}
            </article>
          );
        })}
      </section>
    </AdminShell>
  );
}
