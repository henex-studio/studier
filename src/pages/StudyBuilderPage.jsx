import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import TreeView from "../components/TreeView";
import { supabase } from "../lib/supabase";
import { treeFromCsv } from "../lib/treeParser";

const optionalDataSettings = [
  { key: "record_match_type", label: "Match type and correctness", description: "Shows whether the selected path was exact, acceptable, wrong, or skipped. Also records whether the response is counted as correct.", defaultChecked: true },
  { key: "record_time_seconds", label: "Time taken", description: "Shows how long the participant spent on each task.", defaultChecked: true },
  { key: "record_first_click", label: "First click", description: "Shows the first menu path selected for each task.", defaultChecked: true },
  { key: "record_click_count", label: "Click count", description: "Shows how many menu selections were made during each task.", defaultChecked: true },
  { key: "record_click_history", label: "Click history", description: "Shows the full sequence of menu paths selected during each task.", defaultChecked: false },
  { key: "record_backtrack_count", label: "Backtrack count", description: "Shows whether participants changed direction during a task.", defaultChecked: false },
  { key: "record_depth", label: "Selected depth", description: "Shows how deep the final selected path was in the menu.", defaultChecked: false },
  { key: "record_hesitation_flag", label: "Hesitation flag", description: "Flags tasks that may have involved hesitation, based on time or click count.", defaultChecked: false }
];

const sampleCsv = `Level 1,Level 2,Level 3
Services,,
,Payments,
,,Apply for payment
,,Check payment status
,Support,
,,Contact support
,,Make a complaint
Information,,
,Eligibility,
,Documents,
Account,,
,Sign in,
,Update details,
`;

function defaultDataSettings() {
  return optionalDataSettings.reduce((settings, item) => {
    settings[item.key] = item.defaultChecked;
    return settings;
  }, {});
}

function makeQuestionKey(text, index, position = "final") {
  const prefix = position === "pre" ? "pre" : "final";
  const base = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `${prefix}_${base || `q${index + 1}`}`;
}



const NZ_TIME_ZONE = "Pacific/Auckland";

function formatNzDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
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

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function dateTimeLocalToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isPastExpiry(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

function splitCsvRow(row) {
  return row.split(",").map((cell) => cell.trim());
}

function validateCsv(csvText) {
  const errors = [];
  const warnings = [];
  const text = String(csvText || "").trim();

  if (!text) {
    errors.push("CSV is empty. Add a tree or paste CSV content.");
    return { errors, warnings };
  }

  const rows = String(csvText || "").split(/\r?\n/);
  const header = splitCsvRow(rows[0] || "").map((cell) => cell.toLowerCase());
  const expectedHeader = ["level 1", "level 2", "level 3"];

  expectedHeader.forEach((label, index) => {
    if (header[index] !== label) errors.push(`Header column ${index + 1} should be ${expectedHeader[index].replace("level", "Level")}.`);
  });

  let hasLevelOne = false;
  let currentLevelOne = "";
  let currentLevelTwo = "";

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    if (!row.trim()) {
      warnings.push(`Row ${rowNumber} is empty.`);
      return;
    }

    const cells = splitCsvRow(row);
    if (cells.length > 3) warnings.push(`Row ${rowNumber} has more than 3 columns. Extra columns will be ignored.`);

    const levelOne = cells[0] || "";
    const levelTwo = cells[1] || "";
    const levelThree = cells[2] || "";

    if (levelOne) {
      hasLevelOne = true;
      currentLevelOne = levelOne;
      currentLevelTwo = "";
    }

    if (levelTwo) {
      if (!currentLevelOne) warnings.push(`Row ${rowNumber} has a Level 2 item but no parent Level 1 item above it.`);
      currentLevelTwo = levelTwo;
    }

    if (levelThree) {
      if (!currentLevelOne) warnings.push(`Row ${rowNumber} has a Level 3 item but no parent Level 1 item above it.`);
      if (!currentLevelTwo) warnings.push(`Row ${rowNumber} has a Level 3 item but no parent Level 2 item above it.`);
    }
  });

  if (!hasLevelOne) errors.push("CSV needs at least one Level 1 item.");
  return { errors, warnings };
}

function checkQuestions(questions, label, warnings) {
  questions.forEach((question, index) => {
    if (!String(question.question_text || "").trim()) warnings.push(`${label} question ${index + 1} has no question text.`);

    if (question.question_type === "choice") {
      const options = Array.isArray(question.options) ? question.options : [];
      if (options.length < 2) warnings.push(`${label} choice question ${index + 1} needs at least 2 options.`);
      if (options.some((option) => !String(option || "").trim())) warnings.push(`${label} choice question ${index + 1} has an empty option.`);
    }
  });
}

function getReadinessChecks(study, treeRecord, tasks, preQuestions, finalQuestions, csvChecks) {
  const errors = [];
  const warnings = [];

  if (!String(study?.title || "").trim()) errors.push("Add a test title.");
  if (!(study?.welcome_text || []).some((text) => String(text || "").trim())) errors.push("Add a welcome note.");
  if (!(study?.privacy_text || []).some((text) => String(text || "").trim())) errors.push("Add a privacy note.");
  if (!treeRecord?.tree_json?.length) errors.push("Add a valid IA tree CSV.");
  if (csvChecks.errors.length) errors.push("Fix CSV errors before publishing.");
  if (isPastExpiry(study?.expires_at)) errors.push("Set the closing time to a future New Zealand time, or clear it before publishing.");

  if (!tasks.length) {
    errors.push("Add at least one task.");
  } else {
    tasks.forEach((task, index) => {
      if (!String(task.task_text || "").trim()) errors.push(`Task ${index + 1} needs task text.`);
      if (!(task.target_paths || []).length) errors.push(`Task ${index + 1} needs at least one target path.`);
    });
  }

  checkQuestions(preQuestions, "Pre task", warnings);
  checkQuestions(finalQuestions, "Final", warnings);
  return { errors, warnings };
}

function CheckPanel({ title, errors = [], warnings = [], emptyText }) {
  const hasItems = errors.length > 0 || warnings.length > 0;

  return (
    <div className="check-panel">
      <h3>{title}</h3>
      {!hasItems ? <p className="success-box">{emptyText}</p> : null}
      {errors.length ? (
        <div className="check-list check-list-error">
          <p className="form-label">Errors</p>
          <ol>{errors.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      ) : null}
      {warnings.length ? (
        <div className="check-list check-list-warning">
          <p className="form-label">Warnings</p>
          <ol>{warnings.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      ) : null}
    </div>
  );
}

function TextListEditor({ label, helpText, values, onChange }) {
  const text = (values || []).join("\n");
  return (
    <label className="form-block">
      <span className="form-label">{label}</span>
      {helpText ? <span className="muted-text">{helpText}</span> : null}
      <textarea className="textarea" value={text} onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))} />
    </label>
  );
}

function PathList({ title, paths, onRemove }) {
  return (
    <div>
      <p className="form-label">{title}</p>
      {paths.length === 0 ? <p className="muted-text">No paths selected.</p> : paths.map((path) => (
        <div key={path} className="path-pill">
          <span>{path}</span>
          <button type="button" onClick={() => onRemove(path)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function QuestionEditor({ title, helpText, questions, position, onUpdate, onDelete, onAddChoice, onAddText, onAddOption, onUpdateOption, onRemoveOption }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {helpText ? <p className="muted-text">{helpText}</p> : null}

      {questions.map((question, index) => (
        <div className="question-card" key={index}>
          <label className="form-block">
            <span className="form-label">Question text</span>
            <textarea className="textarea" value={question.question_text} onChange={(event) => onUpdate(index, { question_text: event.target.value, question_key: makeQuestionKey(event.target.value, index, position) })} />
          </label>

          <label className="form-block">
            <span className="form-label">Type</span>
            <select className="text-input" value={question.question_type} onChange={(event) => onUpdate(index, { question_type: event.target.value, options: event.target.value === "choice" ? question.options?.length ? question.options : ["Option 1", "Option 2"] : [] })}>
              <option value="choice">Choice</option>
              <option value="text">Text</option>
            </select>
          </label>

          {question.question_type === "choice" ? (
            <div className="form-block">
              <span className="form-label">Options</span>
              {(question.options || []).map((option, optionIndex) => (
                <div className="inline-form" key={optionIndex}>
                  <input className="text-input" value={option} onChange={(event) => onUpdateOption(index, optionIndex, event.target.value)} />
                  <button className="secondary-button" type="button" onClick={() => onRemoveOption(index, optionIndex)}>Remove</button>
                </div>
              ))}
              <button className="secondary-button" type="button" onClick={() => onAddOption(index)}>Add option</button>
            </div>
          ) : null}

          <div className="question-card-footer">
            <button className="danger-button" type="button" onClick={() => onDelete(index)}>Delete question</button>
          </div>
        </div>
      ))}

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={onAddChoice}>Add choice question</button>
        <button className="secondary-button" type="button" onClick={onAddText}>Add text question</button>
      </div>
    </section>
  );
}

function createQuestion(type, order, position) {
  return {
    question_order: order,
    question_key: makeQuestionKey("", order - 1, position),
    question_position: position,
    question_type: type,
    question_text: "",
    options: type === "choice" ? ["Option 1", "Option 2"] : []
  };
}

export default function StudyBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [treeRecord, setTreeRecord] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [preQuestions, setPreQuestions] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tree = useMemo(() => treeRecord?.tree_json || [], [treeRecord]);
  const csvChecks = useMemo(() => validateCsv(treeRecord?.csv_text || ""), [treeRecord?.csv_text]);
  const readinessChecks = useMemo(
    () => getReadinessChecks(study, treeRecord, tasks, preQuestions, finalQuestions, csvChecks),
    [study, treeRecord, tasks, preQuestions, finalQuestions, csvChecks]
  );

  function markDirty() {
    setHasUnsavedChanges(true);
  }

  function updateStudy(patch) {
    markDirty();
    setStudy((current) => ({ ...current, ...patch }));
  }

  async function loadStudy() {
    const { data: studyData, error: studyError } = await supabase.from("studies").select("*").eq("id", studyId).single();
    if (studyError) {
      setMessage(studyError.message);
      return;
    }

    setStudy({ ...studyData, data_collection_settings: { ...defaultDataSettings(), ...(studyData.data_collection_settings || {}) } });

    const { data: treeData } = await supabase.from("study_trees").select("*").eq("study_id", studyId).maybeSingle();
    setTreeRecord(treeData || { study_id: studyId, csv_text: "", tree_json: [] });

    const { data: taskData } = await supabase.from("study_tasks").select("*").eq("study_id", studyId).order("task_order");
    setTasks(taskData || []);

    const { data: questionData } = await supabase.from("study_final_questions").select("*").eq("study_id", studyId).order("question_order");
    const questionRows = questionData || [];
    setPreQuestions(questionRows.filter((question) => question.question_position === "pre"));
    setFinalQuestions(questionRows.filter((question) => question.question_position !== "pre"));
    setHasUnsavedChanges(false);
  }

  useEffect(() => { loadStudy(); }, [studyId]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!hasUnsavedChanges) return;
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      if (link.target && link.target !== "_self") return;

      const ok = window.confirm("You have unsaved changes. Leave without saving?");
      if (!ok) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [hasUnsavedChanges]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    markDirty();
    setTreeRecord({ ...treeRecord, csv_text: text, tree_json: treeFromCsv(text) });
  }

  function updateCsv(text) {
    markDirty();
    setTreeRecord({ ...treeRecord, csv_text: text, tree_json: treeFromCsv(text) });
  }

  function downloadSampleCsv() {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "studier_ia_tree_sample.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function addTask() {
    markDirty();
    setTasks([...tasks, { task_order: tasks.length + 1, task_text: "", target_paths: [], acceptable_paths: [] }]);
  }

  function updateTask(index, patch) {
    markDirty();
    const next = [...tasks];
    next[index] = { ...next[index], ...patch };
    setTasks(next);
  }

  function deleteTask(index) {
    markDirty();
    const next = tasks.filter((_, taskIndex) => taskIndex !== index).map((task, taskIndex) => ({ ...task, task_order: taskIndex + 1 }));
    setTasks(next);
  }

  function updateQuestion(position, index, patch) {
    markDirty();
    const list = position === "pre" ? [...preQuestions] : [...finalQuestions];
    list[index] = { ...list[index], ...patch, question_position: position };
    if (position === "pre") setPreQuestions(list);
    else setFinalQuestions(list);
  }

  function deleteQuestion(position, index) {
    markDirty();
    const list = position === "pre" ? preQuestions : finalQuestions;
    const next = list
      .filter((_, questionIndex) => questionIndex !== index)
      .map((question, questionIndex) => ({
        ...question,
        question_position: position,
        question_order: questionIndex + 1,
        question_key: question.question_key || makeQuestionKey(question.question_text, questionIndex, position)
      }));
    if (position === "pre") setPreQuestions(next);
    else setFinalQuestions(next);
  }

  function addQuestion(position, type) {
    markDirty();
    const list = position === "pre" ? preQuestions : finalQuestions;
    const next = [...list, createQuestion(type, list.length + 1, position)];
    if (position === "pre") setPreQuestions(next);
    else setFinalQuestions(next);
  }

  function addChoiceOption(position, questionIndex) {
    const question = position === "pre" ? preQuestions[questionIndex] : finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options) ? question.options : [];
    updateQuestion(position, questionIndex, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
  }

  function updateChoiceOption(position, questionIndex, optionIndex, value) {
    const question = position === "pre" ? preQuestions[questionIndex] : finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options) ? [...question.options] : [];
    currentOptions[optionIndex] = value;
    updateQuestion(position, questionIndex, { options: currentOptions });
  }

  function removeChoiceOption(position, questionIndex, optionIndex) {
    const question = position === "pre" ? preQuestions[questionIndex] : finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options) ? [...question.options] : [];
    if (currentOptions.length <= 2) {
      setMessage("A choice question needs at least 2 options.");
      return;
    }
    currentOptions.splice(optionIndex, 1);
    updateQuestion(position, questionIndex, { options: currentOptions });
  }

  function buildQuestionRows(list, position) {
    return list.map((question, index) => ({
      study_id: studyId,
      question_order: index + 1,
      question_position: position,
      question_key: question.question_key || makeQuestionKey(question.question_text, index, position),
      question_type: question.question_type,
      question_text: question.question_text,
      options: question.options || []
    }));
  }

  async function saveAll() {
    setMessage("Saving...");

    const { error: studyError } = await supabase.from("studies").update({
      title: study.title,
      welcome_text: study.welcome_text,
      welcome_bullets: study.welcome_bullets,
      privacy_text: study.privacy_text,
      end_text: study.end_text?.length ? study.end_text : ["You have completed the test.", "Thank you for helping improve the navigation."],
      data_collection_settings: study.data_collection_settings,
      expires_at: study.expires_at || null,
      updated_at: new Date().toISOString()
    }).eq("id", studyId);

    if (studyError) {
      setMessage(studyError.message);
      return;
    }

    await supabase.from("study_trees").delete().eq("study_id", studyId);
    await supabase.from("study_trees").insert({ study_id: studyId, csv_text: treeRecord.csv_text || "", tree_json: treeRecord.tree_json || [] });

    await supabase.from("study_tasks").delete().eq("study_id", studyId);
    if (tasks.length) {
      const taskRows = tasks.map((task, index) => ({
        study_id: studyId,
        task_order: index + 1,
        task_text: task.task_text,
        target_paths: task.target_paths || [],
        acceptable_paths: task.acceptable_paths || []
      }));
      await supabase.from("study_tasks").insert(taskRows);
    }

    await supabase.from("study_final_questions").delete().eq("study_id", studyId);
    const questionRows = [...buildQuestionRows(preQuestions, "pre"), ...buildQuestionRows(finalQuestions, "final")];
    if (questionRows.length) await supabase.from("study_final_questions").insert(questionRows);

    setMessage("Saved.");
    setHasUnsavedChanges(false);
    await loadStudy();
  }

  if (!study || !treeRecord) {
    return <AdminShell profile={profile}><section className="card">Loading...</section></AdminShell>;
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <span className="badge">{study.status}</span>
        <h1>Edit test</h1>
        <label className="form-block">
          <span className="form-label">Title</span>
          <input className="text-input" value={study.title} onChange={(event) => updateStudy({ title: event.target.value })} />
        </label>
        <TextListEditor label="Welcome note" helpText="Shown on the first page before the participant starts the test. Use one paragraph per line." values={study.welcome_text || []} onChange={(values) => updateStudy({ welcome_text: values })} />
        <TextListEditor label="What the test is" helpText="Shown in a plain explanation box on the first page. Use one paragraph per line." values={study.welcome_bullets || []} onChange={(values) => updateStudy({ welcome_bullets: values })} />
        <TextListEditor label="Privacy note" helpText="Shown in the privacy box on the first page. Use one point per line." values={study.privacy_text || []} onChange={(values) => updateStudy({ privacy_text: values })} />
      </section>

      <section className="card">
        <h2>Data collection settings</h2>
        <p className="muted-text">Always collected: selected path, skip status, task ID, participant ID, and submission time.</p>
        <div className="settings-list">
          {optionalDataSettings.map((item) => (
            <label key={item.key} className="setting-card">
              <span className="setting-main-row">
                <input type="checkbox" checked={(study.data_collection_settings || defaultDataSettings())[item.key] === true} onChange={(event) => updateStudy({ data_collection_settings: { ...(study.data_collection_settings || defaultDataSettings()), [item.key]: event.target.checked } })} />
                <span className="setting-label">{item.label}</span>
              </span>
              <span className="setting-description">{item.description}</span>
            </label>
          ))}
        </div>
      </section>

      <QuestionEditor
        title="Pre task questions"
        helpText="Optional. Use broad, non identifying questions only. Do not ask for names, emails, case details, sensitive information, or anything that could identify a person in a small group."
        questions={preQuestions}
        position="pre"
        onUpdate={(index, patch) => updateQuestion("pre", index, patch)}
        onDelete={(index) => deleteQuestion("pre", index)}
        onAddChoice={() => addQuestion("pre", "choice")}
        onAddText={() => addQuestion("pre", "text")}
        onAddOption={(index) => addChoiceOption("pre", index)}
        onUpdateOption={(index, optionIndex, value) => updateChoiceOption("pre", index, optionIndex, value)}
        onRemoveOption={(index, optionIndex) => removeChoiceOption("pre", index, optionIndex)}
      />

      <section className="card">
        <div className="section-title-row">
          <div>
            <h2>IA tree CSV</h2>
            <p className="muted-text">Use columns named Level 1, Level 2, and Level 3.</p>
          </div>
          <button className="secondary-button" type="button" onClick={downloadSampleCsv}>Download sample CSV</button>
        </div>
        <div className="file-input-wrap"><input type="file" accept=".csv,text/csv" onChange={handleFile} /></div>
        <textarea className="textarea csv-input" value={treeRecord.csv_text || ""} onChange={(event) => updateCsv(event.target.value)} placeholder="Paste CSV here" />
        <CheckPanel title="CSV checks" errors={csvChecks.errors} warnings={csvChecks.warnings} emptyText="CSV format looks OK." />
      </section>

      <section className="builder-layout">
        <aside className="card sticky-tree-panel">
          <h2>Tree preview</h2>
          <TreeView tree={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />
          {selectedPath ? <p className="selected-path">Selected path for setup: {selectedPath}</p> : null}
        </aside>

        <section className="card task-editor-panel">
          <h2>Tasks</h2>
          {tasks.map((task, index) => (
            <div className="question-card" key={index}>
              <label className="form-block">
                <span className="form-label">Task {index + 1}</span>
                <textarea className="textarea" value={task.task_text} onChange={(event) => updateTask(index, { task_text: event.target.value })} />
              </label>
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={() => selectedPath && updateTask(index, { target_paths: [...new Set([...(task.target_paths || []), selectedPath])] })}>Add selected path as target</button>
                <button className="secondary-button" type="button" onClick={() => selectedPath && updateTask(index, { acceptable_paths: [...new Set([...(task.acceptable_paths || []), selectedPath])] })}>Add selected path as acceptable</button>
              </div>
              <PathList title="Target paths" paths={task.target_paths || []} onRemove={(path) => updateTask(index, { target_paths: (task.target_paths || []).filter((item) => item !== path) })} />
              <PathList title="Acceptable paths" paths={task.acceptable_paths || []} onRemove={(path) => updateTask(index, { acceptable_paths: (task.acceptable_paths || []).filter((item) => item !== path) })} />
              <div className="question-card-footer">
                <button className="danger-button" type="button" onClick={() => deleteTask(index)}>Delete task</button>
              </div>
            </div>
          ))}
          <button className="secondary-button" type="button" onClick={addTask}>Add task</button>
        </section>
      </section>

      <QuestionEditor
        title="Final questions"
        helpText="Optional. Question keys are generated automatically from the question text for CSV export."
        questions={finalQuestions}
        position="final"
        onUpdate={(index, patch) => updateQuestion("final", index, patch)}
        onDelete={(index) => deleteQuestion("final", index)}
        onAddChoice={() => addQuestion("final", "choice")}
        onAddText={() => addQuestion("final", "text")}
        onAddOption={(index) => addChoiceOption("final", index)}
        onUpdateOption={(index, optionIndex, value) => updateChoiceOption("final", index, optionIndex, value)}
        onRemoveOption={(index, optionIndex) => removeChoiceOption("final", index, optionIndex)}
      />

      <section className="card">
        <h2>Test closing time</h2>
        <p className="muted-text">Optional. The test link will close after this time. Time is shown in New Zealand time.</p>
        <label className="form-block">
          <span className="form-label">Test closes at</span>
          <input
            className="text-input"
            type="datetime-local"
            value={toDateTimeLocalValue(study.expires_at)}
            onChange={(event) => updateStudy({ expires_at: dateTimeLocalToIso(event.target.value) })}
          />
        </label>
        <p className={isPastExpiry(study.expires_at) ? "error-box" : "muted-text"}>
          {study.expires_at ? `Current closing time: ${formatNzDateTime(study.expires_at)}` : "No closing time is set."}
        </p>
      </section>

      <section className="card">
        <h2>Test readiness checks</h2>
        <p className="muted-text">These checks help you prepare the test before previewing or publishing.</p>
        <CheckPanel title="Readiness checks" errors={readinessChecks.errors} warnings={readinessChecks.warnings} emptyText="This test looks ready for preview and publishing." />
      </section>

      <section className="card sticky-actions">
        {message ? <p>{message}</p> : null}
        {hasUnsavedChanges ? <p className="unsaved-changes-note">Unsaved changes</p> : null}
        <p className="muted-text">Save the test before previewing recent changes.</p>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={saveAll}>Save test</button>
          <a className="secondary-button" href={`/preview/${study.id}`}>Preview test</a>
          <a className="secondary-button" href="/admin">Back to test collection</a>
          <a className="secondary-button" href={`/dashboard/${study.id}`}>Dashboard</a>
          {study.status === "published" ? <a className="secondary-button" href={`/test/${study.slug}`} target="_blank" rel="noreferrer">Open test link</a> : null}
        </div>
      </section>
    </AdminShell>
  );
}
