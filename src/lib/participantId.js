export function getParticipantId(studyId) {
  const key = `studier_participant_${studyId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = "P" + Math.random().toString(36).slice(2, 10).toUpperCase();
  window.localStorage.setItem(key, next);
  return next;
}
