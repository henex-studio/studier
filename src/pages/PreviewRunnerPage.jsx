import React, { useEffect, useMemo, useRef, useState } from "react";
import TreeView from "../components/TreeView";
import { supabase } from "../lib/supabase";
import { getMatchResult } from "../lib/matching";
import { CheckCircle2 } from "lucide-react";

function secondsSince(value) {
  return Math.max(1, Math.round((Date.now() - value) / 1000));
}

function QuestionBlock({ question, answers, onChange }) {
  return (
    <div className="question-card" key={question.id || question.question_key}>
      <p className="form-label">{question.question_text}</p>
      {question.question_type === "choice" ? (
        <div className="choice-grid">
          {(question.options || []).map((option) => {
            const selected = answers[question.question_key] === option;
            return (
              <button
                key={option}
                className={selected ? "final-choice final-choice-selected" : "final-choice"}
                onClick={() => onChange(question.question_key, option)}
              >
                {selected ? <CheckCircle2 className="choice-icon-selected" /> : <span className="choice-empty" />}
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          className="textarea"
          value={answers[question.question_key] || ""}
          onChange={(event) => onChange(question.question_key, event.target.value)}
        />
      )}
    </div>
  );
}

export default function PreviewRunnerPage({ profile, studyId }) {
  const topRef = useRef(null);
  const nextNoticeTimerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState(null);
  const [tree, setTree] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [preQuestions, setPreQuestions] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [screen, setScreen] = useState("welcome");
  const [taskIndex, setTaskIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [preAnswers, setPreAnswers] = useState({});
  const [finalAnswers, setFinalAnswers] = useState({});
  const [showNextNotice, setShowNextNotice] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [message, setMessage] = useState("");

  const task = tasks[taskIndex];
  const currentAnswer = task
    ? answers[task.id] || { selected_path: "", skipped: false, first_click_path: "", click_history: [] }
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, taskIndex]);

  useEffect(() => {
    return () => {
      if (nextNoticeTimerRef.current) window.clearTimeout(nextNoticeTimerRef.current);
    };
  }, []);

  function showNextQuestionNotice() {
    setShowNextNotice(true);
    if (nextNoticeTimerRef.current) window.clearTimeout(nextNoticeTimerRef.current);
    nextNoticeTimerRef.current = window.setTimeout(() => {
      setShowNextNotice(false);
    }, 1200);
  }

  async function load() {
    const { data: studyData, error } = await supabase
      .from("studies")
      .select("*")
      .eq("id", studyId)
      .single();

    if (error || !studyData) {
      setMessage(error?.message || "Preview is not available.");
      setLoading(false);
      return;
    }

    if (profile.role !== "admin" && studyData.owner_id !== profile.id) {
      setMessage("You do not have access to preview this test.");
      setLoading(false);
      return;
    }

    setStudy(studyData);

    const { data: treeRows } = await supabase.from("study_trees").select("tree_json").eq("study_id", studyData.id).maybeSingle();
    setTree(treeRows?.tree_json || []);

    const { data: taskRows } = await supabase.from("study_tasks").select("*").eq("study_id", studyData.id).order("task_order");
    setTasks(taskRows || []);

    const { data: questionRows } = await supabase.from("study_final_questions").select("*").eq("study_id", studyData.id).order("question_order");
    const questions = questionRows || [];
    setPreQuestions(questions.filter((question) => question.question_position === "pre"));
    setFinalQuestions(questions.filter((question) => question.question_position !== "pre"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [studyId]);

  function setCurrentAnswer(patch) {
    setAnswers((previous) => ({
      ...previous,
      [task.id]: { ...(previous[task.id] || {}), ...patch }
    }));
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

  function next(skipped = false) {
    if (skipped) setCurrentAnswer({ skipped: true, selected_path: "" });
    if (taskIndex < tasks.length - 1) {
      setTaskIndex(taskIndex + 1);
      setStartedAt(Date.now());
      showNextQuestionNotice();
    } else {
      setScreen("final");
      showNextQuestionNotice();
    }
  }

  function back() {
    if (taskIndex > 0) {
      setTaskIndex(taskIndex - 1);
      setStartedAt(Date.now());
      return;
    }
    setScreen(preQuestions.length ? "pre" : "welcome");
    setStartedAt(Date.now());
  }

  function backFromPre() {
    setScreen("welcome");
    setStartedAt(Date.now());
  }

  function backFromFinal() {
    setScreen("test");
    setStartedAt(Date.now());
  }

  function startTest() {
    setTaskIndex(0);
    setStartedAt(Date.now());
    setScreen(preQuestions.length ? "pre" : "test");
  }

  function continueFromPre() {
    setTaskIndex(0);
    setStartedAt(Date.now());
    setScreen("test");
  }

  function finishPreview() {
    setScreen("done");
  }

  function PreviewBanner() {
    return <section className="preview-banner"><strong>Preview mode</strong><span>Responses are not saved.</span></section>;
  }


  if (loading) return <div className="page-shell"><main className="container narrow"><section className="card">Loading...</section></main></div>;

  if (!study) {
    return <div className="page-shell"><main className="container narrow"><section className="card"><h1>Preview unavailable</h1><p>{message}</p><a className="primary-button" href="/admin">Back to test collection</a></section></main></div>;
  }

  if (screen === "welcome") {
    const whatTheTestIs = Array.isArray(study.welcome_bullets) ? study.welcome_bullets : [];
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
          <PreviewBanner />
          <section className="card hero-card">
            <span className="badge">Tree test</span>
            <h1>{study.title}</h1>
            {(study.welcome_text || []).map((text, index) => <p key={index}>{text}</p>)}
            {whatTheTestIs.length ? <div className="intro-card"><h2>What the test is</h2>{whatTheTestIs.map((text, index) => <p key={index}>{text}</p>)}</div> : null}
            <div className="privacy-card"><h2>Privacy</h2><ul>{(study.privacy_text || []).map((text, index) => <li key={index}>{text}</li>)}</ul></div>
            <button className="primary-button start-button" onClick={startTest}>Start preview</button>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "pre") {
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
          <PreviewBanner />
          <section className="card">
            <span className="badge">Before you start</span>
            <h1>Before you start</h1>
            <p className="muted-text">Please answer these optional questions before the tasks.</p>
            {preQuestions.map((question) => <QuestionBlock key={question.id || question.question_key} question={question} answers={preAnswers} onChange={(key, value) => setPreAnswers({ ...preAnswers, [key]: value })} />)}
            <div className="button-row"><button className="secondary-button" onClick={backFromPre}>Back</button><button className="primary-button" onClick={continueFromPre}>Continue</button></div>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "final") {
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
          <PreviewBanner />
          <section className="card">
            {showNextNotice ? <div className="next-toast">Next question loaded</div> : null}
            <h1>Final questions</h1>
            {finalQuestions.map((question) => <QuestionBlock key={question.id || question.question_key} question={question} answers={finalAnswers} onChange={(key, value) => setFinalAnswers({ ...finalAnswers, [key]: value })} />)}
            {message ? <p className="error-box">{message}</p> : null}
            <div className="button-row"><button className="secondary-button" onClick={backFromFinal}>Back</button><button className="primary-button" onClick={finishPreview}>Finish preview</button></div>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "done") {
    return <div ref={topRef} className="page-shell"><main className="container narrow"><PreviewBanner /><section className="card done-card"><CheckCircle2 className="done-icon" /><h1>Preview complete</h1><p>Responses were not saved.</p><div className="button-row action-center"><a className="primary-button" href={`/builder/${study.id}`}>Back to editor</a><a className="secondary-button" href="/admin">Back to test collection</a></div></section></main></div>;
  }

  return (
    <div ref={topRef} className="page-shell">
      <main className="container">
        <PreviewBanner />
        {showNextNotice ? <div className="next-toast">Next question loaded</div> : null}
        <section className="task-card">
          <span className="badge">Task {taskIndex + 1} of {tasks.length}</span>
          <h1>Choose where you would go</h1>
          <p>{task.task_text}</p>
        </section>
        <section className="card"><h2>Menu</h2><TreeView tree={tree} selectedPath={currentAnswer.selected_path || ""} onSelect={selectPath} /></section>
        <section className="card selected-card">
          <h2>Your selected place</h2>
          <div className="selected-path">{currentAnswer.skipped ? "Skipped" : currentAnswer.selected_path || "No selection yet"}</div>
          {message ? <p className="error-box">{message}</p> : null}
          <div className="action-grid three"><button className="secondary-button" onClick={back}>Back</button><button className="primary-button" disabled={!currentAnswer.selected_path} onClick={() => next(false)}>Next</button><button className="secondary-button" onClick={() => next(true)}>Skip this task</button></div>
        </section>
      </main>
    </div>
  );
}
