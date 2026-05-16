import React, { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { supabase } from "../lib/supabase";
import { buildFinalCsv, buildTaskCsv, downloadCsv } from "../lib/csvExport";

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sortQuestions(questions) {
  return [...questions].sort((a, b) => {
    const aPosition = a.question_position === "pre" ? 0 : 1;
    const bPosition = b.question_position === "pre" ? 0 : 1;
    if (aPosition !== bPosition) return aPosition - bPosition;
    return (a.question_order || 0) - (b.question_order || 0);
  });
}

export default function DashboardPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [taskRows, setTaskRows] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [finalRows, setFinalRows] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: studyData, error } = await supabase.from("studies").select("*").eq("id", studyId).single();
    if (error) {
      setMessage(error.message);
      return;
    }

    setStudy(studyData);

    const { data: responseData } = await supabase
      .from("task_responses")
      .select("*")
      .eq("study_id", studyId)
      .order("submitted_at", { ascending: false });
    setTaskRows(responseData || []);

    const { data: questionData } = await supabase
      .from("study_final_questions")
      .select("*")
      .eq("study_id", studyId)
      .order("question_order");
    setQuestions(sortQuestions(questionData || []));

    const { data: finalData } = await supabase
      .from("final_responses")
      .select("*")
      .eq("study_id", studyId)
      .order("submitted_at", { ascending: false });
    setFinalRows(finalData || []);
  }

  useEffect(() => {
    load();
  }, [studyId]);

  if (!study) {
    return <AdminShell profile={profile}><section className="card">Loading... {message}</section></AdminShell>;
  }

  const participants = new Set(taskRows.map((row) => row.participant_id)).size;
  const exact = taskRows.filter((row) => row.match_type === "exact").length;
  const acceptable = taskRows.filter((row) => row.match_type === "acceptable").length;
  const wrong = taskRows.filter((row) => row.match_type === "wrong").length;
  const skipped = taskRows.filter((row) => row.match_type === "skipped" || row.skipped).length;
  const preQuestionCount = questions.filter((question) => question.question_position === "pre").length;
  const finalQuestionCount = questions.filter((question) => question.question_position !== "pre").length;

  return (
    <AdminShell profile={profile}>
      <section className="card admin-header">
        <div>
          <span className="badge">{study.status}</span>
          <h1>{study.title}</h1>
          <p>Dashboard</p>
          <p className="muted-text">Question answers CSV includes both pre task questions and final questions.</p>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" onClick={load}>Refresh</button>
          <button className="secondary-button" onClick={() => downloadCsv("studier-task-results.csv", buildTaskCsv(taskRows))}>Export task CSV</button>
          <button className="secondary-button" onClick={() => downloadCsv("studier-question-answers.csv", buildFinalCsv(finalRows, questions))}>Export question CSV</button>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card"><p>Participants</p><strong>{participants}</strong></div>
        <div className="summary-card"><p>Task answers</p><strong>{taskRows.length}</strong></div>
        <div className="summary-card"><p>Question answer sets</p><strong>{finalRows.length}</strong></div>
        <div className="summary-card"><p>Pre task questions</p><strong>{preQuestionCount}</strong></div>
        <div className="summary-card"><p>Final questions</p><strong>{finalQuestionCount}</strong></div>
        <div className="summary-card"><p>Exact</p><strong>{exact}</strong></div>
        <div className="summary-card"><p>Acceptable</p><strong>{acceptable}</strong></div>
        <div className="summary-card"><p>Wrong</p><strong>{wrong}</strong></div>
        <div className="summary-card"><p>Skipped</p><strong>{skipped}</strong></div>
      </section>

      <section className="card desktop-table">
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Task</th>
              <th>Selected path</th>
              <th>Match</th>
              <th>Correct</th>
              <th>Time</th>
              <th>First click</th>
              <th>Click count</th>
              <th>Click history</th>
              <th>Backtrack count</th>
              <th>Selected depth</th>
              <th>Hesitation flag</th>
            </tr>
          </thead>
          <tbody>
            {taskRows.length === 0 ? (
              <tr><td colSpan="12">No data yet</td></tr>
            ) : taskRows.map((row) => (
              <tr key={`${row.participant_id}-${row.task_id}-${row.submitted_at}`}>
                <td>{row.participant_id}</td>
                <td>{row.task_order}</td>
                <td>{displayValue(row.selected_path)}</td>
                <td>{displayValue(row.match_type)}</td>
                <td>{displayValue(row.is_correct)}</td>
                <td>{displayValue(row.time_seconds)}</td>
                <td>{displayValue(row.first_click_path)}</td>
                <td>{displayValue(row.click_count)}</td>
                <td>{displayValue(row.click_history)}</td>
                <td>{displayValue(row.backtrack_count)}</td>
                <td>{displayValue(row.depth)}</td>
                <td>{displayValue(row.hesitation_flag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
