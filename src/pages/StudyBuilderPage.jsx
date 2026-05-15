import React, { useEffect, useMemo, useState } from "react";
import AdminShell from "../components/AdminShell";
import TreeView from "../components/TreeView";
import { supabase } from "../lib/supabase";
import { treeFromCsv } from "../lib/treeParser";

const defaultSettings = {
  record_first_click: true,
  record_click_history: true,
  record_click_count: true,
  record_backtrack_count: true,
  record_time_seconds: true,
  record_depth: true,
  record_match_type: true,
  record_hesitation_flag: true
};

function TextListEditor({ label, values, onChange }) {
  const text = (values || []).join("\n");

  return (
    <label className="form-block">
      <span className="form-label">{label}</span>
      <textarea
        className="textarea"
        value={text}
        onChange={(event) =>
          onChange(event.target.value.split("\n").filter(Boolean))
        }
      />
    </label>
  );
}

function PathList({ title, paths, onRemove }) {
  return (
    <div>
      <p className="form-label">{title}</p>

      {paths.length === 0 ? (
        <p className="muted-text">No paths selected.</p>
      ) : (
        paths.map((path) => (
          <div key={path} className="path-pill">
            <span>{path}</span>
            <button type="button" onClick={() => onRemove(path)}>
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default function StudyBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [treeRecord, setTreeRecord] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedPath, setSelectedPath] = useState("");

  const tree = useMemo(() => treeRecord?.tree_json || [], [treeRecord]);

  async function loadStudy() {
    const { data: studyData, error: studyError } = await supabase
      .from("studies")
      .select("*")
      .eq("id", studyId)
      .single();

    if (studyError) {
      setMessage(studyError.message);
      return;
    }

    setStudy(studyData);

    const { data: treeData } = await supabase
      .from("study_trees")
      .select("*")
      .eq("study_id", studyId)
      .maybeSingle();

    setTreeRecord(treeData || { study_id: studyId, csv_text: "", tree_json: [] });

    const { data: taskData } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("study_id", studyId)
      .order("task_order");

    setTasks(taskData || []);

    const { data: finalData } = await supabase
      .from("study_final_questions")
      .select("*")
      .eq("study_id", studyId)
      .order("question_order");

    setFinalQuestions(finalData || []);
  }

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    setTreeRecord({
      ...treeRecord,
      csv_text: text,
      tree_json: treeFromCsv(text)
    });
  }

  function updateCsv(text) {
    setTreeRecord({
      ...treeRecord,
      csv_text: text,
      tree_json: treeFromCsv(text)
    });
  }

  function addTask() {
    setTasks([
      ...tasks,
      {
        task_order: tasks.length + 1,
        task_text: "",
        target_paths: [],
        acceptable_paths: []
      }
    ]);
  }

  function updateTask(index, patch) {
    const next = [...tasks];
    next[index] = { ...next[index], ...patch };
    setTasks(next);
  }

  function addFinalQuestion(type = "text") {
    const order = finalQuestions.length + 1;

    setFinalQuestions([
      ...finalQuestions,
      {
        question_order: order,
        question_key: `q${order}`,
        question_type: type,
        question_text: "",
        options: type === "choice" ? ["Option 1", "Option 2"] : []
      }
    ]);
  }

  function updateFinalQuestion(index, patch) {
    const next = [...finalQuestions];
    next[index] = { ...next[index], ...patch };
    setFinalQuestions(next);
  }

  function addChoiceOption(questionIndex) {
    const question = finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options) ? question.options : [];

    updateFinalQuestion(questionIndex, {
      options: [...currentOptions, `Option ${currentOptions.length + 1}`]
    });
  }

  function updateChoiceOption(questionIndex, optionIndex, value) {
    const question = finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options)
      ? [...question.options]
      : [];

    currentOptions[optionIndex] = value;

    updateFinalQuestion(questionIndex, {
      options: currentOptions
    });
  }

  function removeChoiceOption(questionIndex, optionIndex) {
    const question = finalQuestions[questionIndex];
    const currentOptions = Array.isArray(question.options)
      ? [...question.options]
      : [];

    if (currentOptions.length <= 2) {
      setMessage("A choice question needs at least 2 options.");
      return;
    }

    currentOptions.splice(optionIndex, 1);

    updateFinalQuestion(questionIndex, {
      options: currentOptions
    });
  }

  async function saveAll() {
    setMessage("Saving...");

    const { error: studyError } = await supabase
      .from("studies")
      .update({
        title: study.title,
        welcome_text: study.welcome_text,
        welcome_bullets: study.welcome_bullets,
        privacy_text: study.privacy_text,
        end_text: study.end_text,
        data_collection_settings: study.data_collection_settings,
        updated_at: new Date().toISOString()
      })
      .eq("id", studyId);

    if (studyError) {
      setMessage(studyError.message);
      return;
    }

    await supabase.from("study_trees").delete().eq("study_id", studyId);

    await supabase.from("study_trees").insert({
      study_id: studyId,
      csv_text: treeRecord.csv_text || "",
      tree_json: treeRecord.tree_json || []
    });

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

    await supabase
      .from("study_final_questions")
      .delete()
      .eq("study_id", studyId);

    if (finalQuestions.length) {
      const finalRows = finalQuestions.map((question, index) => ({
        study_id: studyId,
        question_order: index + 1,
        question_key: question.question_key || `q${index + 1}`,
        question_type: question.question_type,
        question_text: question.question_text,
        options: question.options || []
      }));

      await supabase.from("study_final_questions").insert(finalRows);
    }

    setMessage("Saved.");
    await loadStudy();
  }

  if (!study || !treeRecord) {
    return (
      <AdminShell profile={profile}>
        <section className="card">Loading...</section>
      </AdminShell>
    );
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <span className="badge">{study.status}</span>
        <h1>Edit study</h1>

        <label className="form-block">
          <span className="form-label">Title</span>
          <input
            className="text-input"
            value={study.title}
            onChange={(event) => setStudy({ ...study, title: event.target.value })}
          />
        </label>

        <TextListEditor
          label="Welcome paragraphs"
          values={study.welcome_text || []}
          onChange={(values) => setStudy({ ...study, welcome_text: values })}
        />

        <TextListEditor
          label="Welcome bullet points"
          values={study.welcome_bullets || []}
          onChange={(values) => setStudy({ ...study, welcome_bullets: values })}
        />

        <TextListEditor
          label="Privacy bullet points"
          values={study.privacy_text || []}
          onChange={(values) => setStudy({ ...study, privacy_text: values })}
        />

        <TextListEditor
          label="End paragraphs"
          values={study.end_text || []}
          onChange={(values) => setStudy({ ...study, end_text: values })}
        />
      </section>

      <section className="card">
        <h2>Data collection settings</h2>

        <div className="settings-grid">
          {Object.keys(defaultSettings).map((key) => (
            <label key={key} className="check-row">
              <input
                type="checkbox"
                checked={(study.data_collection_settings || defaultSettings)[key] !== false}
                onChange={(event) =>
                  setStudy({
                    ...study,
                    data_collection_settings: {
                      ...(study.data_collection_settings || defaultSettings),
                      [key]: event.target.checked
                    }
                  })
                }
              />
              {key.replaceAll("_", " ")}
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>IA tree CSV</h2>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} />

        <textarea
          className="textarea csv-input"
          value={treeRecord.csv_text || ""}
          onChange={(event) => updateCsv(event.target.value)}
          placeholder="Paste CSV here"
        />

        <h3>Tree preview</h3>

        <TreeView tree={tree} selectedPath={selectedPath} onSelect={setSelectedPath} />

        {selectedPath ? (
          <p className="selected-path">Selected path for setup: {selectedPath}</p>
        ) : null}
      </section>

      <section className="card">
        <h2>Tasks</h2>

        {tasks.map((task, index) => (
          <div className="question-card" key={index}>
            <label className="form-block">
              <span className="form-label">Task {index + 1}</span>
              <textarea
                className="textarea"
                value={task.task_text}
                onChange={(event) =>
                  updateTask(index, { task_text: event.target.value })
                }
              />
            </label>

            <div className="button-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  selectedPath &&
                  updateTask(index, {
                    target_paths: [
                      ...new Set([...(task.target_paths || []), selectedPath])
                    ]
                  })
                }
              >
                Add selected path as target
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  selectedPath &&
                  updateTask(index, {
                    acceptable_paths: [
                      ...new Set([...(task.acceptable_paths || []), selectedPath])
                    ]
                  })
                }
              >
                Add selected path as acceptable
              </button>
            </div>

            <PathList
              title="Target paths"
              paths={task.target_paths || []}
              onRemove={(path) =>
                updateTask(index, {
                  target_paths: (task.target_paths || []).filter(
                    (item) => item !== path
                  )
                })
              }
            />

            <PathList
              title="Acceptable paths"
              paths={task.acceptable_paths || []}
              onRemove={(path) =>
                updateTask(index, {
                  acceptable_paths: (task.acceptable_paths || []).filter(
                    (item) => item !== path
                  )
                })
              }
            />
          </div>
        ))}

        <button className="secondary-button" type="button" onClick={addTask}>
          Add task
        </button>
      </section>

      <section className="card">
        <h2>Final questions</h2>

        {finalQuestions.map((question, index) => (
          <div className="question-card" key={index}>
            <label className="form-block">
              <span className="form-label">Question key</span>
              <input
                className="text-input"
                value={question.question_key}
                onChange={(event) =>
                  updateFinalQuestion(index, {
                    question_key: event.target.value
                  })
                }
              />
            </label>

            <label className="form-block">
              <span className="form-label">Question text</span>
              <textarea
                className="textarea"
                value={question.question_text}
                onChange={(event) =>
                  updateFinalQuestion(index, {
                    question_text: event.target.value
                  })
                }
              />
            </label>

            <label className="form-block">
              <span className="form-label">Type</span>
              <select
                className="text-input"
                value={question.question_type}
                onChange={(event) =>
                  updateFinalQuestion(index, {
                    question_type: event.target.value,
                    options:
                      event.target.value === "choice"
                        ? question.options?.length
                          ? question.options
                          : ["Option 1", "Option 2"]
                        : []
                  })
                }
              >
                <option value="choice">Choice</option>
                <option value="text">Text</option>
              </select>
            </label>

            {question.question_type === "choice" ? (
              <div className="form-block">
                <span className="form-label">Options</span>

                {(question.options || []).map((option, optionIndex) => (
                  <div className="inline-form" key={optionIndex}>
                    <input
                      className="text-input"
                      value={option}
                      onChange={(event) =>
                        updateChoiceOption(index, optionIndex, event.target.value)
                      }
                    />

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => removeChoiceOption(index, optionIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => addChoiceOption(index)}
                >
                  Add option
                </button>
              </div>
            ) : null}
          </div>
        ))}

        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={() => addFinalQuestion("choice")}
          >
            Add choice question
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => addFinalQuestion("text")}
          >
            Add text question
          </button>
        </div>
      </section>

      <section className="card sticky-actions">
        {message ? <p>{message}</p> : null}

        <div className="button-row">
          <button className="primary-button" type="button" onClick={saveAll}>
            Save study
          </button>

          <a className="secondary-button" href="/admin">
            Back to studies
          </a>

          <a className="secondary-button" href={`/dashboard/${study.id}`}>
            Dashboard
          </a>

          {study.status === "published" ? (
            <a
              className="secondary-button"
              href={`/test/${study.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Open test link
            </a>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
