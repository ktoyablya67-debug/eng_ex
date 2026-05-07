import { LearnProgressMap, LearnSessionState, LearnSettings } from '../../types';

const LEARN_PROGRESS_KEY = 'memory-control-room-learn-progress-v1';
const LEARN_SESSION_KEY = 'memory-control-room-learn-session-v1';
const LEARN_SETTINGS_KEY = 'memory-control-room-learn-settings-v1';

export const loadLearnProgress = (): LearnProgressMap => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LEARN_PROGRESS_KEY) ?? '{}') as LearnProgressMap;
  } catch {
    return {};
  }
};

export const saveLearnProgress = (progress: LearnProgressMap) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(progress));
};

export const loadLearnSession = (): LearnSessionState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEARN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as LearnSessionState) : null;
  } catch {
    return null;
  }
};

export const saveLearnSession = (session: LearnSessionState | null) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(LEARN_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(LEARN_SESSION_KEY, JSON.stringify(session));
};

export const loadLearnSettings = (): LearnSettings | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEARN_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as LearnSettings) : null;
  } catch {
    return null;
  }
};

export const saveLearnSettings = (settings: LearnSettings) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEARN_SETTINGS_KEY, JSON.stringify(settings));
};

export const resetLearnStorage = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEARN_PROGRESS_KEY);
  window.localStorage.removeItem(LEARN_SESSION_KEY);
  window.localStorage.removeItem(LEARN_SETTINGS_KEY);
};
