import { ProgressMap, TermProgress } from '../types';

const STORAGE_KEY = 'memory-control-room-progress-v1';

export const createEmptyProgress = (): TermProgress => ({
  status: 'new',
  successes: 0,
  mistakes: 0,
  cardReviews: 0,
  writtenAttempts: 0,
  writtenCorrect: 0,
  blitzAttempts: 0,
  blitzCorrect: 0,
  repeatLater: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastSeenAt: null,
  lastMistakeAt: null,
});

export const loadProgress = (): ProgressMap => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed ?? {};
  } catch {
    return {};
  }
};

export const saveProgress = (progress: ProgressMap) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const resetProgressStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
