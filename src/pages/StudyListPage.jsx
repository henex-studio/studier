import React, { useEffect, useMemo, useState } from "react";
import { Network, MessageSquare } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";
import { getTonePublishIssues } from "../lib/tonetest/publishChecks";


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

function builderPath(study) {
  return study.study_type === "tone_test" ? `/tone-builder/${study.id}` : `/builder/${study.id}`;
}

// PreviewRunnerPage (the /preview/<id> route) only ever renders the Tree
// Test flow; it has no idea a Tone Test exists. A Tone Test's preview is
// the "Preview by role" section already built into ToneBuilderPage.jsx, so
// its Preview link points at the same builder page as Edit, rather than at
// a screen that would show the wrong study type's questions.
function previewPath(study) {
  return study.study_type === "tone_test" ? `/tone-builder/${study.id}` : `/preview/${study.id}`;
}

function typeLabel(study) {
  return study.study_type === "tone_test" ? "Tone Test" : "Tree Test";
}

function typeClass(study) {
  return study.study_type === "tone_test" ? "type-badge type-badge-tone" : "type-badge type-badge-tree";
}

function typeIcon(study) {
  return study.study_type === "tone_test" ? MessageSquare : Network;
}

function typeStripeClass(study) {
  return study.study_type === "tone_test" ? "type-stripe type-stripe-tone" : "type-stripe type-stripe-tree";
}

// Type tag: icon plus label, used above the card title and above the title
// cell in list view. Step 5a moves type out of the chip row so it stops
// competing with status and owner for the same space.
function TypeTag({ study }) {
  const Icon = typeIcon(study);
  return (
    <span className={typeClass(study)}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      {typeLabel(study)}
    </span>
  );
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const visibleStudies = useMemo(() => {
    if (typeFilter === "all") return studies;
    return studies.filter((study) => study.study_type === typeFilter);
  }, [studies, typeFilter]);

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
    // Study-type dispatch only. Each type's own checklist lives with that
    // type's code: Tree Test's stays below, Tone Test's is in
    // src/lib/tonetest/publishChecks.js.
    if (study.study_type === "tone_test") {
      const [{ data: settings }, { data: variantRows }, { data: questionRows }] = await Promise.all([
        supabase.from("tone_test_settings").select("*").eq("study_id", study.id).maybeSingle(),
        supabase.from("tone_variants").select("variant_text").eq("study_id", study.id),
        supabase.from("tone_questions").select("role_key,required,question_text").eq("study_id", study.id)
      ]);
      return getTonePublishIssues(study, settings, variantRows || [], questionRows || []);
    }

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

    // Each study type keeps its responses in its own tables. Clearing a Tone
    // Test through the Tree Test list deleted nothing and still reported
    // success, which would have quietly left a previous round's answers in
    // place on reuse. Setup, variants, questions, gates and weights are
    // deliberately not listed here; clearing keeps them (HANDOVER.md 2.6).
    const isTone = study.study_type === "tone_test";
    const tables = isTone
      ? ["tone_responses", "tone_gate_responses", "tone_sessions"]
      : ["task_responses", "final_responses", "participant_sessions"];
    const deletes = isTone
      ? "participant sessions, ratings, and risk gate answers"
      : "task responses, final question responses, and participant session records";

    const typed = window.prompt(
      `Clear all response data for "${study.title}"? This will permanently delete ${deletes}. The test setup is kept. Type CLEAR to continue.`
    );
    if (typed !== "CLEAR") return false;

    setClearingStudyId(study.id);
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
        <h1>Test collection</h1>
        <p>Create and manage internal user tests.</p>
      </section>

      <section className={studyType === "tone_test" ? "card new-test-card new-test-card-tone" : "card new-test-card new-test-card-tree"}>
        <div className="new-test-switch" role="tablist" aria-label="Test type">
          <button
            type="button"
            role="tab"
            aria-selected={studyType === "tree_test"}
            className={studyType === "tree_test" ? "new-test-switch-button new-test-switch-button-active new-test-switch-button-tree" : "new-test-switch-button"}
            onClick={() => setStudyType("tree_test")}
          >
            <Network size={14} strokeWidth={2.25} aria-hidden="true" />
            Tree Test
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studyType === "tone_test"}
            className={studyType === "tone_test" ? "new-test-switch-button new-test-switch-button-active new-test-switch-button-tone" : "new-test-switch-button"}
            onClick={() => setStudyType("tone_test")}
          >
            <MessageSquare size={14} strokeWidth={2.25} aria-hidden="true" />
            Tone Test
          </button>
        </div>

        <p className="muted-text">You are creating a {studyType === "tone_test" ? "Tone Test" : "Tree Test"}.</p>
        <div className="inline-form new-test-form">
          <input className="text-input" placeholder="New test title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <button className="primary-button" onClick={createStudy}>Add new test</button>
        </div>
        {message ? <p className="error-box">{message}</p> : null}
        {profile.role !== "admin" ? <p className="muted-text">Test limit: {studies.length} of 3.</p> : null}
      </section>

      <section className="card">
        <div className="collection-header-row">
          <div className="type-filter" role="group" aria-label="Filter by test type">
            <button
              className={typeFilter === "all" ? "type-filter-button type-filter-button-active" : "type-filter-button"}
              type="button"
              onClick={() => setTypeFilter("all")}
            >
              All types
            </button>
            <button
              className={typeFilter === "tree_test" ? "type-filter-button type-filter-button-active type-filter-button-tree" : "type-filter-button type-filter-button-tree"}
              type="button"
              onClick={() => setTypeFilter("tree_test")}
            >
              <Network size={14} strokeWidth={2.25} aria-hidden="true" />
              Tree Test
            </button>
            <button
              className={typeFilter === "tone_test" ? "type-filter-button type-filter-button-active type-filter-button-tone" : "type-filter-button type-filter-button-tone"}
              type="button"
              onClick={() => setTypeFilter("tone_test")}
            >
              <MessageSquare size={14} strokeWidth={2.25} aria-hidden="true" />
              Tone Test
            </button>
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
      </section>

      {loading ? <div className="card">Loading...</div> : null}
      {!loading && studies.length === 0 ? <div className="card">No tests yet.</div> : null}
      {!loading && studies.length > 0 && visibleStudies.length === 0 ? <div className="card">No tests match this filter.</div> : null}

      {!loading && visibleStudies.length > 0 && viewMode === "cards" ? (
        <section className="study-grid">
          {visibleStudies.map((study) => {
            const owner = ownerById.get(study.owner_id) || { label: "Unknown user", title: "Unknown user" };
            const isAdminView = profile.role === "admin";
            const fullLink = `${window.location.origin}/test/${study.slug}`;
            const isCopied = copiedStudyId === study.id;
            const publishIssues = publishIssuesByStudyId[study.id] || [];

            return (
              <article className={`card study-card ${typeStripeClass(study)}`} key={study.id}>
                <div className="study-card-header">
                  <TypeTag study={study} />
                  <span className={statusClass(study.status)}>{statusLabel(study.status)}</span>
                </div>

                <div className="study-card-body">
                  {isAdminView ? <span className={ownerClass(study.owner_id)} title={owner.title}>{owner.label}</span> : null}
                  <h2>{study.title}</h2>
                  <p className="study-link-code" title={fullLink}>Test link code: <span>/{study.slug}</span></p>
                  <p className="study-expiry-text">{expiryLabel(study)}</p>
                </div>

                <div className="study-card-actions">
                  <div className="button-row">
                    <a className="secondary-button" href={builderPath(study)}>Edit</a>
                    <a className="secondary-button" href={`/dashboard/${study.id}`}>Dashboard</a>
                    <a className="secondary-button" href={previewPath(study)}>Preview</a>
                    {study.status === "published" ? <a className="secondary-button" href={`/test/${study.slug}`} target="_blank" rel="noreferrer">Open link</a> : null}
                  </div>

                  {renderActions(study)}
                  <PublishIssues issues={publishIssues} />
                  {isCopied ? <div className="copy-toast">{fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}</div> : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {!loading && visibleStudies.length > 0 && viewMode === "list" ? (
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
                {visibleStudies.map((study) => {
                  const owner = ownerById.get(study.owner_id) || { label: "Unknown user", title: "Unknown user" };
                  const fullLink = `${window.location.origin}/test/${study.slug}`;
                  const isCopied = copiedStudyId === study.id;
                  const publishIssues = publishIssuesByStudyId[study.id] || [];

                  return (
                    <React.Fragment key={study.id}>
                      <tr>
                        <td className={typeStripeClass(study)}>
                          <TypeTag study={study} />
                          <a className="test-title-link" href={builderPath(study)}>{study.title}</a>
                        </td>
                        <td><span className={statusClass(study.status)}>{statusLabel(study.status)}</span></td>
                        {profile.role === "admin" ? <td><span className={ownerClass(study.owner_id)} title={owner.title}>{owner.label}</span></td> : null}
                        <td><span className="list-link-code" title={fullLink}>/{study.slug}</span></td>
                        <td>
                          <div className="list-link-row">
                            <a href={builderPath(study)}>Edit</a>
                            <a href={`/dashboard/${study.id}`}>Dashboard</a>
                            <a href={previewPath(study)}>Preview</a>
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
