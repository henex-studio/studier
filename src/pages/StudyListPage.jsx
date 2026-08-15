import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";


const NZ_TIME_ZONE = "Pacific/Auckland";

function formatNzDateTime(value) {
  if (!value) return "No closing time set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No closing time set";
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function isPastExpiry(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

function expiryLabel(study) {
  if (!study.expires_at) return "No closing time set";
  const prefix = study.status === "closed" || isPastExpiry(study.expires_at) ? "Closed" : "Closes";
  return `${prefix} ${formatNzDateTime(study.expires_at)}`;
}

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

function hasTextListValue(values) {
  return Array.isArray(values) && values.some((value) => String(value || "").trim());
}

function getPublishIssues(study, treeRecord, tasks, finalQuestions) {
  const issues = [];

  if (!String(study?.title || "").trim()) issues.push("Add a test title.");
  if (!hasTextListValue(study?.welcome_text)) issues.push("Add a welcome note.");
  if (!hasTextListValue(study?.privacy_text)) issues.push("Add a privacy note.");
  if (!treeRecord?.tree_json?.length) issues.push("Add a valid IA tree CSV.");
  if (isPastExpiry(study?.expires_at)) issues.push("Set the closing time to a future New Zealand time, or clear it before publishing.");

  if (!tasks.length) {
    issues.push("Add at least one task.");
  }

  tasks.forEach((task, index) => {
    if (!String(task.task_text || "").trim()) issues.push(`Task ${index + 1} needs task text.`);
    if (!(task.target_paths || []).length) issues.push(`Task ${index + 1} needs at least one target path.`);
  });

  finalQuestions.forEach((question, index) => {
    if (!String(question.question_text || "").trim()) issues.push(`Final question ${index + 1} needs question text.`);

    if (question.question_type === "choice") {
      const options = Array.isArray(question.options) ? question.options : [];
      if (options.length < 2) issues.push(`Choice question ${index + 1} needs at least 2 options.`);
      if (options.some((option) => !String(option || "").trim())) issues.push(`Choice question ${index + 1} has an empty option.`);
    }
  });

  return issues;
}

function PublishIssues({ issues }) {
  if (!issues.length) return null;

  return (
    <div className="publish-validation-box">
      <p className="form-label">This test is not ready to publish.</p>
      <ol>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ol>
    </div>
  );
}

export default function StudyListPage({ profile }) {
  const [studies, setStudies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [title, setTitle] = useState("");
  const [studyType, setStudyType] = useState("tree_test");
  const [message, setMessage] = useState("");
  const [copiedStudyId, setCopiedStudyId] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");
  const [publishIssuesByStudyId, setPublishIssuesByStudyId] = useState({});
  const [publishingStudyId, setPublishingStudyId] = useState("");
  const [clearingStudyId, setClearingStudyId] = useState("");
  const [viewMode, setViewMode] = useState("cards");
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

    let studyRows = data || [];
    const expiredPublishedStudies = studyRows.filter((study) => study.status === "published" && isPastExpiry(study.expires_at));

    if (expiredPublishedStudies.length > 0) {
      const expiredIds = expiredPublishedStudies.map((study) => study.id);
      const closedAt = new Date().toISOString();
      await supabase.from("studies").update({ status: "closed", closed_at: closedAt, updated_at: closedAt }).in("id", expiredIds);
      studyRows = studyRows.map((study) => expiredIds.includes(study.id) ? { ...study, status: "closed", closed_at: closedAt } : study);
    }

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

    if (studyType === "tone_test") {
      const defaultToneStudy = {
        owner_id: profile.id,
        title: title.trim(),
        slug: makeSlug(title),
        status: "draft",
        study_type: "tone_test",
        welcome_text: [],
        welcome_bullets: [],
        privacy_text: [
          "This test does not ask for your name or contact details.",
          "Please do not enter personal or case details."
        ],
        end_text: ["You have completed the test.", "Thank you for your feedback."],
        expires_at: null,
        data_collection_settings: {}
      };

      const { data, error } = await supabase.from("studies").insert(defaultToneStudy).select().single();
      if (error) {
        setMessage(error.message);
        return;
      }
      navigateTo(`/tone-builder/${data.id}`);
      return;
    }

    const defaultStudy = {
      owner_id: profile.id,
      title: title.trim(),
      slug: makeSlug(title),
      status: "draft",
      study_type: "tree_test",
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
      expires_at: null,
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

  async function validateBeforePublish(study) {
    const [{ data: treeRecord }, { data: taskRows }, { data: finalRows }] = await Promise.all([
      supabase.from("study_trees").select("tree_json").eq("study_id", study.id).maybeSingle(),
      supabase.from("study_tasks").select("task_text,target_paths").eq("study_id", study.id).order("task_order"),
      supabase.from("study_final_questions").select("question_text,question_type,options").eq("study_id", study.id).order("question_order")
    ]);

    return getPublishIssues(study, treeRecord, taskRows || [], finalRows || []);
  }

  async function updateStatus(study, status) {
    setCopiedStudyId("");
    setFallbackLink("");
    setMessage("");

    if (status === "published") {
      setPublishingStudyId(study.id);
      const issues = await validateBeforePublish(study);
      setPublishingStudyId("");

      if (issues.length > 0) {
        setPublishIssuesByStudyId((previous) => ({ ...previous, [study.id]: issues }));
        return;
      }
    }

    setPublishIssuesByStudyId((previous) => {
      const next = { ...previous };
      delete next[study.id];
      return next;
    });

    const payload = { status, updated_at: new Date().toISOString() };
    if (status === "published") {
      payload.published_at = new Date().toISOString();
      payload.closed_at = null;
    }
    if (status === "closed") payload.closed_at = new Date().toISOString();

    const { error } = await supabase.from("studies").update(payload).eq("id", study.id);
    if (error) setMessage(error.message);
    await loadStudies();
  }

  async function clearResponseData(study) {
    setCopiedStudyId("");
    setFallbackLink("");
    setMessage("");
    const typed = window.prompt(
      `Clear all response data for "${study.title}"? This will permanently delete task responses, final question responses, and participant session records. Type CLEAR to continue.`
    );
    if (typed !== "CLEAR") return false;

    setClearingStudyId(study.id);
    const tables = ["task_responses", "final_responses", "participant_sessions"];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("study_id", study.id);
      if (error) {
        setClearingStudyId("");
        setMessage(error.message);
        return false;
      }
    }
    setClearingStudyId("");
    setMessage("Response data cleared.");
    await loadStudies();
    return true;
  }

  async function clearDataAndPublish(study) {
    setCopiedStudyId("");
    setFallbackLink("");
    setMessage("");
    setPublishingStudyId(study.id);
    const issues = await validateBeforePublish(study);
    setPublishingStudyId("");
    if (issues.length > 0) {
      setPublishIssuesByStudyId((previous) => ({ ...previous, [study.id]: issues }));
      return;
    }

    const cleared = await clearResponseData(study);
    if (!cleared) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("studies")
      .update({ status: "published", published_at: now, closed_at: null, updated_at: now })
      .eq("id", study.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setPublishIssuesByStudyId((previous) => {
      const next = { ...previous };
      delete next[study.id];
      return next;
    });
    setMessage("Response data cleared and test published.");
    await loadStudies();
  }

  async function deleteStudy(study) {
    setCopiedStudyId("");
    setFallbackLink("");

    const ok = window.confirm(
      "This will permanently delete this test, its tree, questions, responses, final answers, and dashboard data. This action cannot be undone."
    );
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

  function renderActions(study) {
    const isPublishing = publishingStudyId === study.id;
    const isClearing = clearingStudyId === study.id;
    const isBusy = isPublishing || isClearing;

    return (
      <div className="button-row stable-action-row">
        {study.status !== "published" ? (
          <button className="primary-button" disabled={isBusy} onClick={() => updateStatus(study, "published")}>
            {isPublishing ? "Checking..." : "Publish"}
          </button>
        ) : (
          <button className="secondary-button" disabled={isBusy} onClick={() => updateStatus(study, "closed")}>Close</button>
        )}

        {study.status === "published" ? (
          <button className="secondary-button" type="button" disabled={isBusy} onClick={() => copyTestLink(study)}>Copy link</button>
        ) : null}

        {study.status !== "published" ? (
          <button className="secondary-button" type="button" disabled={isBusy} onClick={() => clearResponseData(study)}>
            {isClearing ? "Clearing..." : "Clear test data"}
          </button>
        ) : null}

        {study.status !== "published" ? (
          <button className="secondary-button" type="button" disabled={isBusy} onClick={() => clearDataAndPublish(study)}>
            {isBusy ? "Working..." : "Clear data and publish"}
          </button>
        ) : null}

        <button className="danger-button" disabled={isBusy} onClick={() => deleteStudy(study)}>Delete</button>
      </div>
    );
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <div className="collection-header-row">
          <div>
            <h1>Test collection</h1>
            <p>Create and manage internal tree tests.</p>
          </div>

          <div className="view-toggle" aria-label="Collection view mode">
            <button
              className={viewMode === "cards" ? "view-toggle-button view-toggle-button-active" : "view-toggle-button"}
              type="button"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </button>
            <button
              className={viewMode === "list" ? "view-toggle-button view-toggle-button-active" : "view-toggle-button"}
              type="button"
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
        </div>

        <div className="inline-form new-test-form">
          <input className="text-input" placeholder="New test title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <select
            className="text-input"
            aria-label="Test type"
            value={studyType}
            onChange={(event) => setStudyType(event.target.value)}
          >
            <option value="tree_test">Tree Test</option>
            <option value="tone_test">Tone Test</option>
          </select>
          <button className="primary-button" onClick={createStudy}>Add new test</button>
        </div>

        {message ? <p className="error-box">{message}</p> : null}
        {profile.role !== "admin" ? <p className="muted-text">Test limit: {studies.length} of 3.</p> : null}
      </section>

      {loading ? <div className="card">Loading...</div> : null}
      {!loading && studies.length === 0 ? <div className="card">No tests yet.</div> : null}

      {!loading && studies.length > 0 && viewMode === "cards" ? (
        <section className="study-grid">
          {studies.map((study) => {
            const owner = ownerById.get(study.owner_id) || { label: "Unknown user", title: "Unknown user" };
            const isAdminView = profile.role === "admin";
            const fullLink = `${window.location.origin}/test/${study.slug}`;
            const isCopied = copiedStudyId === study.id;
            const publishIssues = publishIssuesByStudyId[study.id] || [];

            return (
              <article className="card study-card" key={study.id}>
                <div className="study-card-header">
                  <span className={statusClass(study.status)}>{statusLabel(study.status)}</span>
                  {isAdminView ? <span className={ownerClass(study.owner_id)} title={owner.title}>{owner.label}</span> : null}
                </div>

                <h2>{study.title}</h2>
                <p className="study-link-code" title={fullLink}>Test link code: <span>/{study.slug}</span></p>
              <p className="study-expiry-text">{expiryLabel(study)}</p>

                <div className="button-row">
                  <a className="secondary-button" href={`/builder/${study.id}`}>Edit</a>
                  <a className="secondary-button" href={`/dashboard/${study.id}`}>Dashboard</a>
                  <a className="secondary-button" href={`/preview/${study.id}`}>Preview</a>
                  {study.status === "published" ? <a className="secondary-button" href={`/test/${study.slug}`} target="_blank" rel="noreferrer">Open link</a> : null}
                </div>

                {renderActions(study)}
                <PublishIssues issues={publishIssues} />
                {isCopied ? <div className="copy-toast">{fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}</div> : null}
              </article>
            );
          })}
        </section>
      ) : null}

      {!loading && studies.length > 0 && viewMode === "list" ? (
        <section className="card list-view-card">
          <div className="desktop-table test-list-table-wrap">
            <table className="test-list-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Status</th>
                  {profile.role === "admin" ? <th>Owner</th> : null}
                  <th>Link code</th>
                  <th>Quick links</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => {
                  const owner = ownerById.get(study.owner_id) || { label: "Unknown user", title: "Unknown user" };
                  const fullLink = `${window.location.origin}/test/${study.slug}`;
                  const isCopied = copiedStudyId === study.id;
                  const publishIssues = publishIssuesByStudyId[study.id] || [];

                  return (
                    <React.Fragment key={study.id}>
                      <tr>
                        <td>
                          <a className="test-title-link" href={`/builder/${study.id}`}>{study.title}</a>
                        </td>
                        <td><span className={statusClass(study.status)}>{statusLabel(study.status)}</span></td>
                        {profile.role === "admin" ? <td><span className={ownerClass(study.owner_id)} title={owner.title}>{owner.label}</span></td> : null}
                        <td><span className="list-link-code" title={fullLink}>/{study.slug}</span></td>
                        <td>
                          <div className="list-link-row">
                            <a href={`/builder/${study.id}`}>Edit</a>
                            <a href={`/dashboard/${study.id}`}>Dashboard</a>
                            <a href={`/preview/${study.id}`}>Preview</a>
                            {study.status === "published" ? <a href={`/test/${study.slug}`} target="_blank" rel="noreferrer">Open</a> : null}
                          </div>
                        </td>
                        <td>{renderActions(study)}</td>
                      </tr>

                      {publishIssues.length || isCopied ? (
                        <tr className="list-feedback-row">
                          <td colSpan={profile.role === "admin" ? 6 : 5}>
                            <PublishIssues issues={publishIssues} />
                            {isCopied ? <div className="copy-toast">{fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}</div> : null}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
