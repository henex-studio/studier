import React, { useEffect, useMemo, useRef, useState } from "react";
import TreeView from "../components/TreeView";
import { supabase } from "../lib/supabase";
import { getParticipantId } from "../lib/participantId";
import { getMatchResult } from "../lib/matching";
import { CheckCircle2 } from "lucide-react";

function isPastExpiry(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

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
                type="button"
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

function TaskProgressNavigation({ tasks, taskIndex, reviewTaskIndex, setReviewTaskIndex, screen }) {
  if (!tasks.length || screen !== "test") return null;

  const manyTasks = tasks.length > 10;

  return (
    <section className="task-progress-card" aria-label="Task progress">
      <div className="task-progress-heading-row">
        <span className="form-label">Task progress</span>
        <span className="muted-text">Task {taskIndex + 1} of {tasks.length}</span>
      </div>
      <div className={manyTasks ? "task-progress-track task-progress-track-many" : "task-progress-track"}>
        {tasks.map((task, index) => {
          const isCompleted = index < taskIndex;
          const isCurrent = index === taskIndex;
          const isReviewing = reviewTaskIndex === index;
          const isFuture = index > taskIndex;
          const canOpen = isCompleted || isCurrent;
          let className = "task-progress-dot";
          if (isCompleted) className += " task-progress-dot-completed";
          if (isCurrent) className += " task-progress-dot-current";
          if (isFuture) className += " task-progress-dot-future";
          if (isReviewing) className += " task-progress-dot-reviewing";

          return (
            <button
              key={task.id || index}
              className={className}
              type="button"
              disabled={!canOpen}
              onClick={() => {
                if (isCurrent) setReviewTaskIndex(null);
                else if (isCompleted) setReviewTaskIndex(index);
              }}
              title={isCompleted ? `Review task ${index + 1}` : isCurrent ? `Current task ${index + 1}` : `Task ${index + 1} not started`}
              aria-label={isCompleted ? `Review task ${index + 1}` : isCurrent ? `Current task ${index + 1}` : `Task ${index + 1} not started`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function TestRunnerPage({ slug }) {
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
  const [reviewTaskIndex, setReviewTaskIndex] = useState(null);
  const [answers, setAnswers] = useState({});
  const [preAnswers, setPreAnswers] = useState({});
  const [finalAnswers, setFinalAnswers] = useState({});
  const [showNextNotice, setShowNextNotice] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [message, setMessage] = useState("");

  const participantId = useMemo(() => (study ? getParticipantId(study.id) : ""), [study]);
  const task = tasks[taskIndex];
  const currentAnswer = task
    ? answers[task.id] || { selected_path: "", skipped: false, first_click_path: "", click_history: [] }
    : null;
  const displayedTaskIndex = reviewTaskIndex === null ? taskIndex : reviewTaskIndex;
  const displayedTask = tasks[displayedTaskIndex];
  const displayedAnswer = displayedTask
    ? answers[displayedTask.id] || { selected_path: "", skipped: false, first_click_path: "", click_history: [] }
    : null;
  const isReviewingSubmittedTask = reviewTaskIndex !== null && reviewTaskIndex !== taskIndex;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, taskIndex, reviewTaskIndex]);

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
      .eq("slug", slug)
      .single();

    if (error || !studyData) {
      setMessage("This test link is not available.");
      setLoading(false);
      return;
    }

    if (studyData.status === "published" && isPastExpiry(studyData.expires_at)) {
      const closedAt = new Date().toISOString();
      await supabase
        .from("studies")
        .update({ status: "closed", closed_at: closedAt, updated_at: closedAt })
        .eq("id", studyData.id);
      setStudy({ ...studyData, status: "closed", closed_at: closedAt });
      setLoading(false);
      return;
    }

    if (studyData.status !== "published") {
      setStudy(studyData);
      setLoading(false);
      return;
    }

    setStudy(studyData);

    const { data: treeRows } = await supabase
      .from("study_trees")
      .select("tree_json")
      .eq("study_id", studyData.id)
      .maybeSingle();
    setTree(treeRows?.tree_json || []);

    const { data: taskRows } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("study_id", studyData.id)
      .order("task_order");
    setTasks(taskRows || []);

    const { data: questionRows } = await supabase
      .from("study_final_questions")
      .select("*")
      .eq("study_id", studyData.id)
      .order("question_order");
    const questions = questionRows || [];
    setPreQuestions(questions.filter((question) => question.question_position === "pre"));
    setFinalQuestions(questions.filter((question) => question.question_position !== "pre"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  function setCurrentAnswer(patch) {
    setAnswers((previous) => ({
      ...previous,
      [task.id]: { ...(previous[task.id] || {}), ...patch }
    }));
  }

  function selectPath(path) {
    if (isReviewingSubmittedTask) return;
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
      first_click_path: settings.record_first_click === false ? null : answer.first_click_path || null,
      click_history: settings.record_click_history === false ? null : clickHistory,
      depth: settings.record_depth === false ? null : selectedPath && !skipped ? selectedPath.split(" > ").length : 0,
      click_count: settings.record_click_count === false ? null : clickCount,
      backtrack_count: settings.record_backtrack_count === false ? null : Math.max(0, clickCount - uniqueClickCount),
      hesitation_flag: settings.record_hesitation_flag === false ? null : skipped || timeSeconds > 20 || clickCount > 3,
      time_seconds: settings.record_time_seconds === false ? null : timeSeconds,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("task_responses")
      .upsert(row, { onConflict: "study_id,participant_id,task_id" });
    if (error) setMessage(error.message);
  }

  async function next(skipped = false) {
    await saveCurrentAnswer(skipped);
    if (skipped) setCurrentAnswer({ skipped: true, selected_path: "" });
    setReviewTaskIndex(null);
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
    setReviewTaskIndex(null);
    if (taskIndex > 0) {
      setTaskIndex(taskIndex - 1);
      setStartedAt(Date.now());
      return;
    }
    setScreen(preQuestions.length ? "pre" : "welcome");
    setStartedAt(Date.now());
  }

  function backFromPre() {
    setReviewTaskIndex(null);
    setScreen("welcome");
    setStartedAt(Date.now());
  }

  function backFromFinal() {
    setReviewTaskIndex(null);
    setScreen("test");
    setStartedAt(Date.now());
  }

  function startTest() {
    setReviewTaskIndex(null);
    setTaskIndex(0);
    setStartedAt(Date.now());
    setScreen(preQuestions.length ? "pre" : "test");
  }

  function continueFromPre() {
    setReviewTaskIndex(null);
    setTaskIndex(0);
    setStartedAt(Date.now());
    setScreen("test");
  }

  async function submitFinal() {
    const row = {
      study_id: study.id,
      participant_id: participantId,
      final_answers: { ...preAnswers, ...finalAnswers },
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("final_responses")
      .upsert(row, { onConflict: "study_id,participant_id" });

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase
      .from("participant_sessions")
      .upsert(
        { study_id: study.id, participant_id: participantId, completed_at: new Date().toISOString() },
        { onConflict: "study_id,participant_id" }
      );

    setScreen("done");
  }

  if (loading) return <div className="page-shell"><main className="container narrow"><section className="card">Loading...</section></main></div>;

  if (!study) {
    return <div className="page-shell"><main className="container narrow"><section className="card"><h1>Test unavailable</h1><p>{message}</p></section></main></div>;
  }

  if (study.status === "closed") {
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
          <section className="card done-card">
            <CheckCircle2 className="done-icon" />
            <h1>Sorry, this test is now closed.</h1>
            <p>Do not worry. If you want to take part, please contact the person who shared this test with you.</p>
          </section>
        </main>
      </div>
    );
  }

  if (study.status !== "published") {
    return <div className="page-shell"><main className="container narrow"><section className="card"><h1>Test unavailable</h1><p>This test link is not available.</p></section></main></div>;
  }

  if (screen === "welcome") {
    const whatTheTestIs = Array.isArray(study.welcome_bullets) ? study.welcome_bullets : [];
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
          <section className="card hero-card">
            <span className="badge">Tree test</span>
            <h1>{study.title}</h1>
            {(study.welcome_text || []).map((text, index) => <p key={index}>{text}</p>)}
            {whatTheTestIs.length ? <div className="intro-card"><h2>What the test is</h2>{whatTheTestIs.map((text, index) => <p key={index}>{text}</p>)}</div> : null}
            <div className="privacy-card"><h2>Privacy</h2><ul>{(study.privacy_text || []).map((text, index) => <li key={index}>{text}</li>)}</ul></div>
            <button className="primary-button start-button" onClick={startTest}>Start test</button>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "pre") {
    return (
      <div ref={topRef} className="page-shell">
        <main className="container narrow">
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
          {showNextNotice ? <div className="next-toast">Next question loaded</div> : null}
          <section className="card">
            <h1>Final questions</h1>
            {finalQuestions.map((question) => <QuestionBlock key={question.id || question.question_key} question={question} answers={finalAnswers} onChange={(key, value) => setFinalAnswers({ ...finalAnswers, [key]: value })} />)}
            {message ? <p className="error-box">{message}</p> : null}
            <div className="button-row"><button className="secondary-button" onClick={backFromFinal}>Back</button><button className="primary-button" onClick={submitFinal}>Submit</button></div>
          </section>
        </main>
      </div>
    );
  }

  if (screen === "done") {
    return <div ref={topRef} className="page-shell"><main className="container narrow"><section className="card done-card"><CheckCircle2 className="done-icon" /><h1>Thank you</h1>{(study.end_text || []).map((text, index) => <p key={index}>{text}</p>)}</section></main></div>;
  }

  return (
    <div ref={topRef} className="page-shell">
      <main className="container">
        {showNextNotice ? <div className="next-toast">Next question loaded</div> : null}
        <TaskProgressNavigation tasks={tasks} taskIndex={taskIndex} reviewTaskIndex={reviewTaskIndex} setReviewTaskIndex={setReviewTaskIndex} screen={screen} />
        <section className="task-card">
          <span className="badge">Task {displayedTaskIndex + 1}</span>
          <h1>Choose where you would go</h1>
          <p>{displayedTask.task_text}</p>
        </section>
        {isReviewingSubmittedTask ? (
          <section className="locked-answer-notice">
            <h2>Submitted answer locked</h2>
            <p>This answer has already been submitted. To keep the test focused on your first instinct, submitted answers cannot be changed.</p>
          </section>
        ) : null}
        <section className="card"><h2>Menu</h2><TreeView tree={tree} selectedPath={displayedAnswer.selected_path || ""} expandToPath={isReviewingSubmittedTask ? displayedAnswer.selected_path || "" : ""} onSelect={isReviewingSubmittedTask ? undefined : selectPath} /></section>
        <section className="card selected-card">
          <h2>{isReviewingSubmittedTask ? "Submitted answer" : "Your selected place"}</h2>
          <div className="selected-path">{displayedAnswer.skipped ? "Skipped" : displayedAnswer.selected_path || "No selection yet"}</div>
          {message ? <p className="error-box">{message}</p> : null}
          {isReviewingSubmittedTask ? (
            <div className="button-row"><button className="primary-button" onClick={() => setReviewTaskIndex(null)}>Back to current task</button></div>
          ) : (
            <div className="action-grid three"><button className="secondary-button" onClick={back}>Back</button><button className="primary-button" disabled={!currentAnswer.selected_path} onClick={() => next(false)}>Next</button><button className="secondary-button" onClick={() => next(true)}>Skip this task</button></div>
          )}
        </section>
      </main>
    </div>
  );
}
