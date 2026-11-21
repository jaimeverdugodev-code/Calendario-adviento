const KEY = 'adviento-progress-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { completed: {} };
    const data = JSON.parse(raw);
    if (!data.completed || typeof data.completed !== 'object') return { completed: {} };
    return data;
  } catch {
    return { completed: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function markCompleted(day) {
  const p = loadProgress();
  p.completed[String(day)] = true;
  saveProgress(p);
  return p;
}

export function isCompleted(day) {
  return !!loadProgress().completed[String(day)];
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}

export function completedCount() {
  return Object.keys(loadProgress().completed).length;
}
