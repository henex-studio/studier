import React, { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";

function makeSlug(title) {
  return String(title || "study").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) + "-" + Math.random().toString(36).slice(2, 7);
}

export default function StudyListPage({ profile }) {
  const [studies, setStudies] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStudies() {
    setLoading(true);
    const { data, error } = await supabase.from("studies").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setStudies(data || []);
  }

  useEffect(() => { loadStudies(); }, []);

  async function createStudy() {
    setMessage("");
    if (!title.trim()) {
      setMessage("Please enter a study title.");
      return;
    }
    if (profile.role !== "admin" && studies.length >= 3) {
      setMessage("You have reached the 3 project limit. Please delete an old project before creating a new one.");
      return;
    }
    const defaultStudy = {
      owner_id: profile.id,
      title: title.trim(),
      slug: makeSlug(title),
      status: "draft",
      welcome_text: ["Thank you for taking part in this short internal pilot.", "You will see short tasks. For each task, choose where you would expect to find the information."],
      welcome_bullets: ["There are no right or wrong answers. We are testing the navigation, not you.", "You can skip any task, or stop at any time by closing the browser window."],
      privacy_text: ["This test does not ask for your name or contact details.", "Please do not enter personal or case details."],
      end_text: ["You have completed the test.", "Thank you for helping improve the navigation."]
    };
    const { data, error } = await supabase.from("studies").insert(defaultStudy).select().single();
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = `/builder/${data.id}`;
  }

  async function updateStatus(study, status) {
    const payload = { status, updated_at: new Date().toISOString() };
    if (status === "published") payload.published_at = new Date().toISOString();
    if (status === "closed") payload.closed_at = new Date().toISOString();
    const { error } = await supabase.from("studies").update(payload).eq("id", study.id);
    if (error) setMessage(error.message);
    await loadStudies();
  }

  async function deleteStudy(study) {
    const ok = window.confirm("This will permanently delete this study, its tree, questions, responses, final answers, and dashboard data. This action cannot be undone.");
    if (!ok) return;
    const { error } = await supabase.from("studies").delete().eq("id", study.id);
    if (error) setMessage(error.message);
    await loadStudies();
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <h1>Studies</h1>
        <p>Create and manage internal tree tests.</p>
        <div className="inline-form">
          <input className="text-input" placeholder="New study title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <button className="primary-button" onClick={createStudy}>New study</button>
        </div>
        {message ? <p className="error-box">{message}</p> : null}
        {profile.role !== "admin" ? <p className="muted-text">Project limit: {studies.length} of 3.</p> : null}
      </section>

      <section className="study-grid">
        {loading ? <div className="card">Loading...</div> : null}
        {!loading && studies.length === 0 ? <div className="card">No studies yet.</div> : null}
        {studies.map((study) => (
          <article className="card" key={study.id}>
            <span className="badge">{study.status}</span>
            <h2>{study.title}</h2>
            <p className="muted-text">/{study.slug}</p>
            <div className="button-row">
              <a className="secondary-button" href={`/builder/${study.id}`}>Edit</a>
              <a className="secondary-button" href={`/dashboard/${study.id}`}>Dashboard</a>
              {study.status === "published" ? <a className="secondary-button" href={`/test/${study.slug}`} target="_blank">Open link</a> : null}
            </div>
            <div className="button-row">
              {study.status !== "published" ? <button className="primary-button" onClick={() => updateStatus(study, "published")}>Publish</button> : <button className="secondary-button" onClick={() => updateStatus(study, "closed")}>Close</button>}
              <button className="danger-button" onClick={() => deleteStudy(study)}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
