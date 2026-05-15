export function getMatchResult(task, selectedPath, skipped, settings = {}) {
  const targetPaths = Array.isArray(task.target_paths) ? task.target_paths : [];
  const acceptablePaths = Array.isArray(task.acceptable_paths) ? task.acceptable_paths : [];
  const shouldRecordMatch = settings.record_match_type !== false;

  if (!shouldRecordMatch) {
    return {
      target_path: targetPaths[0] || "",
      target_paths: targetPaths,
      acceptable_paths: acceptablePaths,
      match_type: null,
      is_correct: null
    };
  }

  if (skipped) {
    return { target_path: targetPaths[0] || "", target_paths: targetPaths, acceptable_paths: acceptablePaths, match_type: "skipped", is_correct: false };
  }

  if (targetPaths.includes(selectedPath)) {
    return { target_path: targetPaths[0] || "", target_paths: targetPaths, acceptable_paths: acceptablePaths, match_type: "exact", is_correct: true };
  }

  if (acceptablePaths.includes(selectedPath)) {
    return { target_path: targetPaths[0] || "", target_paths: targetPaths, acceptable_paths: acceptablePaths, match_type: "acceptable", is_correct: true };
  }

  return { target_path: targetPaths[0] || "", target_paths: targetPaths, acceptable_paths: acceptablePaths, match_type: "wrong", is_correct: false };
}
