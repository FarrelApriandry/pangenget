/**
 * Daily Streak Tracking for Pangenget.
 * Calculates current consecutive days of completed tasks.
 */

export interface StreakData {
  currentStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  longestStreak: number;
}

const STORAGE_KEY = "pangenget_streak";

export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, lastCompletedDate: "", longestStreak: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentStreak: 0, lastCompletedDate: "", longestStreak: 0 };
    return JSON.parse(raw);
  } catch {
    return { currentStreak: 0, lastCompletedDate: "", longestStreak: 0 };
  }
}

export function recordTaskCompletionForStreak(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, lastCompletedDate: "", longestStreak: 0 };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const data = getStreakData();

  if (data.lastCompletedDate === todayStr) {
    return data;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = 1;
  if (data.lastCompletedDate === yesterdayStr) {
    newStreak = data.currentStreak + 1;
  }

  const longestStreak = Math.max(data.longestStreak, newStreak);

  const updated: StreakData = {
    currentStreak: newStreak,
    lastCompletedDate: todayStr,
    longestStreak,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage errors
  }

  return updated;
}
