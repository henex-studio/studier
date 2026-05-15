import React, { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";
import { buildFinalCsv, buildTaskCsv, downloadCsv } from "../lib/csvExport";

export default function DashboardPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskRows, setTaskRows] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [finalRows, setFinalRows] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: studyData, error } = await supabase.from("studies").select("*").eq("id", studyId).single();
    if (error) { setMessage(error.message); return; }
    setStudy(studyData);
    const { data: taskData } = await supabase.from("study_tasks").select("*").eq("study_id", studyId).order("task_order");
    setTasks(taskData || []);
    const { data: responseData } = await supabase.from("task_responses").select("*").eq("study_id", studyId).order("submitted_at", { ascending: false });
    setTaskRows(responseData || []);
    const { data: fq } = await supabase.from("study_final_questions").select("*").eq("study_id", studyId).order("question_order");
    setFinalQuestions(fq || []);
    const { data: fr } = await supabase.from("final_responses").select("*").eq("study_id", studyId).order("submitted_at", { ascending: false });
    setFinalRows(fr || []);
  }

  useEffect(() => { load(); }, [studyId]);

  if (!study) return <AdminShell profile={profile}><section className="card">Loading... {message}</section></AdminShell>;

  const participants = new Set(taskRows.map((row) => row.participant_id)).size;
  const exact = taskRows.filter((row) => row.match_type === "exact").length;
  const acceptable = taskRows.filter((row) => row.match_type === "acceptable").length;
  const wrong = taskRows.filter((row) => row.match_type === "wrong").length;
  const skipped = taskRows.filter((row) => row.match_type === "skipped" || row.skipped).length;

  return <AdminShell profile={profile}><section className="card admin-header"><div><span className="badge">{study.status}</span><h1>{study.title}</h1><p className="muted-text">Dashboard</p></div><div className="admin-actions"><button className="secondary-button" onClick={load}>Refresh</button><button className="primary-button" onClick={() => downloadCsv("studier-task-results.csv", buildTaskCsv(taskRows))}>Export task CSV</button><button className="secondary-button" onClick={() => downloadCsv("studier-final-answers.csv", buildFinalCsv(finalRows, finalQuestions))}>Export final CSV</button></div></section><section className="summary-grid"><div className="summary-card"><p>Participants</p><strong>{participants}</strong></div><div className="summary-card"><p>Task answers</p><strong>{taskRows.length}</strong></div><div className="summary-card"><p>Final surveys</p><strong>{finalRows.length}</strong></div><div className="summary-card"><p>Exact</p><strong>{exact}</strong></div><div className="summary-card"><p>Acceptable</p><strong>{acceptable}</strong></div><div className="summary-card"><p>Wrong</p><strong>{wrong}</strong></div><div className="summary-card"><p>Skipped</p><strong>{skipped}</strong></div></section><section className="card desktop-table"><table><thead><tr><th>Participant</th><th>Task</th><th>Selected path</th><th>Target path</th><th>Match</th><th>Correct</th><th>Time</th></tr></thead><tbody>{taskRows.length === 0 ? <tr><td colSpan="7">No data yet</td></tr> : taskRows.map((row) => <tr key={row.id}><td>{row.participant_id}</td><td>{row.task_order}</td><td>{row.selected_path}</td><td>{row.target_path}</td><td>{row.match_type}</td><td>{row.is_correct === true ? "Yes" : row.is_correct === false ? "No" : "Not recorded"}</td><td>{row.time_seconds ?? ""}</td></tr>)}</tbody></table></section></AdminShell>;
}
