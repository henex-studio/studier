import React, { useEffect, useMemo, useRef, useState } from "react";
import TreeView from "../components/TreeView";
import { supabase } from "../lib/supabase";
import { getParticipantId } from "../lib/participantId";
import { getMatchResult } from "../lib/matching";
import { CheckCircle2 } from "lucide-react";

function secondsSince(value) {
  return Math.max(1, Math.round((Date.now() - value) / 1000));
}

export default function TestRunnerPage({ slug }) {
  const topRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState(null);
  const [tree, setTree] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [screen, setScreen] = useState("welcome");
  const [taskIndex, setTaskIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finalAnswers, setFinalAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(Date.now());
  const [message, setMessage] = useState("");

  const participantId = useMemo(() => study ? getParticipantId(study.id) : "", [study]);
  const task = tasks[taskIndex];
  const currentAnswer = task ? answers[task.id] || { selected_path: "", skipped: false, first_click_path: "", click_history: [] } : null;

  useEffect(() => { window.scrollTo(0, 0); }, [screen, taskIndex]);

  async function load() {
    const { data: studyData, error } = await supabase.from("studies").select("*").eq("slug", slug).eq("status", "published").single();
    if (error) { setMessage("This test link is not available."); setLoading(false); return; }
    setStudy(studyData);
    const { data: treeRows } = await supabase.from("study_trees").select("tree_json").eq("study_id", studyData.id).maybeSingle();
    setTree(treeRows?.tree_json || []);
    const { data: taskRows } = await supabase.from("study_tasks").select("*").eq("study_id", studyData.id).order("task_order");
    setTasks(taskRows || []);
    const { data: finalRows } = await supabase.from("study_final_questions").select("*").eq("study_id", studyData.id).order("question_order");
    setFinalQuestions(finalRows || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  function setCurrentAnswer(patch) {
    setAnswers((previous) => ({ ...previous, [task.id]: { ...(previous[task.id] || {}), ...patch } }));
  }

  function selectPath(path) {
    const click = { path, time_from_task_start_seconds: secondsSince(startedAt) };
    const previous = currentAnswer || { click_history: [] };
    setCurrentAnswer({
      selected_path: path,
      skipped: false,
      first_click_path: previous.first_click_path || path,
      click_history: [...(previous.click_history || []), click]
    });
  }

  async function saveCurrentAnswer(skipped = false) {
    const answer = answers[task.id] || {};
    const selectedPath = skipped ? "Skipped" : answer.selected_path;
    const clickHistory = answer.click_history || [];
    const clickCount = clickHistory.length;
    const uniqueClickCount = new Set(clickHistory.map((item) => item.path)).size;
    const timeSeconds = secondsSince(startedAt);
    const settings = study.data_collection_settings || {};
    const match = getMatchResult(task, skipped ? "" : selectedPath, skipped, settings);

    const row = {
      study_id: study.id,
      participant_id: participantId,
      task_id: task.id,
      task_order: task.task_order,
      task_text: task.task_text,
      selected_path: selectedPath,
      skipped,
      target_path: match.target_path,
      target_paths: match.target_paths,
      acceptable_paths: match.acceptable_paths,
      match_type: match.match_type,
      is_correct: match.is_correct,
      first_click_path: settings.record_first_click === false ? null : (answer.first_click_path || null),
      click_history: settings.record_click_history === false ? null : clickHistory,
      depth: settings.record_depth === false ? null : (selectedPath && !skipped ? selectedPath.split(" > ").length : 0),
      click_count: settings.record_click_count === false ? null : clickCount,
      backtrack_count: settings.record_backtrack_count === false ? null : Math.max(0, clickCount - uniqueClickCount),
      hesitation_flag: settings.record_hesitation_flag === false ? null : (skipped || timeSeconds > 20 || clickCount > 3),
      time_seconds: settings.record_time_seconds === false ? null : timeSeconds,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("task_responses").upsert(row, { onConflict: "study_id,participant_id,task_id" });
    if (error) setMessage(error.message);
  }

  async function next(skipped = false) {
    await saveCurrentAnswer(skipped);
    if (taskIndex < tasks.length - 1) {
      setTaskIndex(taskIndex + 1);
      setStartedAt(Date.now());
    } else {
      setScreen("final");
    }
  }

  function back() {
    if (taskIndex > 0) {
      setTaskIndex(taskIndex - 1);
      setStartedAt(Date.now());
    }
  }

  async function submitFinal() {
    const row = { study_id: study.id, participant_id: participantId, final_answers: finalAnswers, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("final_responses").upsert(row, { onConflict: "study_id,participant_id" });
    if (error) { setMessage(error.message); return; }
    await supabase.from("participant_sessions").upsert({ study_id: study.id, participant_id: participantId, completed_at: new Date().toISOString() }, { onConflict: "study_id,participant_id" });
    setScreen("done");
  }

  if (loading) return <div className="page-shell"><main className="container narrow"><section className="card">Loading...</section></main></div>;
  if (!study) return <div className="page-shell"><main className="container narrow"><section className="card"><h1>Test unavailable</h1><p>{message}</p></section></main></div>;

  if (screen === "welcome") return <div ref={topRef} className="page-shell"><main className="container narrow"><section className="card hero-card"><span className="badge">Tree test</span><h1>{study.title}</h1>{(study.welcome_text || []).map((text, index) => <p key={index}>{text}</p>)}<div className="intro-card"><h2>What is a tree test?</h2><p>It simply asks where you would click in a menu to find something.</p><p>For example, if you were shopping online and wanted to buy running shoes, you might choose “Shoes &gt; Sports shoes &gt; Running shoes.”</p></div><ul>{(study.welcome_bullets || []).map((text, index) => <li key={index}>{text}</li>)}</ul><div className="privacy-card"><h2>Privacy</h2><ul>{(study.privacy_text || []).map((text, index) => <li key={index}>{text}</li>)}</ul></div><button className="primary-button start-button" onClick={() => setScreen("test")}>Start test</button></section></main></div>;

  if (screen === "final") return <div ref={topRef} className="page-shell"><main className="container narrow"><section className="card"><h1>Final questions</h1>{finalQuestions.map((question) => <div className="question-card" key={question.id}><p className="form-label">{question.question_text}</p>{question.question_type === "choice" ? <div className="choice-grid">{(question.options || []).map((option) => { const selected = finalAnswers[question.question_key] === option; return <button key={option} className={selected ? "final-choice final-choice-selected" : "final-choice"} onClick={() => setFinalAnswers({ ...finalAnswers, [question.question_key]: option })}>{selected ? <span className="choice-check">✓</span> : <span className="choice-empty" />}<span>{option}</span></button>; })}</div> : <textarea className="textarea" value={finalAnswers[question.question_key] || ""} onChange={(event) => setFinalAnswers({ ...finalAnswers, [question.question_key]: event.target.value })} />}</div>)}{message ? <p className="error-box">{message}</p> : null}<div className="button-row"><button className="secondary-button" onClick={() => setScreen("test")}>Back</button><button className="primary-button" onClick={submitFinal}>Submit</button></div></section></main></div>;

  if (screen === "done") return <div ref={topRef} className="page-shell"><main className="container narrow"><section className="card done-card"><CheckCircle2 className="done-icon" /><h1>Thank you</h1>{(study.end_text || []).map((text, index) => <p key={index}>{text}</p>)}</section></main></div>;

  return <div ref={topRef} className="page-shell"><main className="container"><section className="task-card"><span className="badge">Task {taskIndex + 1} of {tasks.length}</span><h1>Choose where you would go</h1><p>{task.task_text}</p></section><section className="card"><h2>Menu</h2><TreeView tree={tree} selectedPath={currentAnswer.selected_path || ""} onSelect={selectPath} /></section><section className="card selected-card"><h2>Your selected place</h2><div className="selected-path">{currentAnswer.skipped ? "Skipped" : currentAnswer.selected_path || "No selection yet"}</div>{message ? <p className="error-box">{message}</p> : null}<div className="action-grid three"><button className="secondary-button" disabled={taskIndex === 0} onClick={back}>Back</button><button className="primary-button" disabled={!currentAnswer.selected_path} onClick={() => next(false)}>Next</button><button className="secondary-button" onClick={() => next(true)}>Skip this task</button></div></section></main></div>;
}
