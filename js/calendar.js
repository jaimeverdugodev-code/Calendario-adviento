import { isCompleted } from './storage.js';

export function isAdminMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('admin') === 'true';
}

export function getTodayInfo() {
  const now = new Date();
  return { month: now.getMonth(), date: now.getDate() }; // month 0-indexed, Dec = 11
}

export function getDayState(day) {
  const completed = isCompleted(day);
  const admin = isAdminMode();
  const { month, date } = getTodayInfo();
  const isDecember = month === 11;
  const unlockedByDate = isDecember && date >= day;
  const available = admin || unlockedByDate;

  if (completed) return 'completed';
  if (available) {
    // "Disponible hoy" highlight if it's exactly today in December (or admin: highlight all unlocked as available)
    if (admin) return 'available';
    if (isDecember && date === day) return 'today';
    return 'available';
  }
  return 'locked';
}
