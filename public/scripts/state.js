const STORAGE_KEY = 'agora-dilemma-v1';
const CURRENT_VERSION = 1;

let saveTimer = null;

function createDefaultState() {
  return {
    version: CURRENT_VERSION,
    nickname: '',
    startedAt: '',
    checkin: null,
    sourceNotes: {},
    compare: { placements: {}, openAnswer: '' },
    decisions: {},
    perspectives: {},
    biasCheck: {},
    declaration: {},
    progress: { lastScreen: '', completed: [] }
  };
}

let currentState = createDefaultState();

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) {
      return null;
    }
    currentState = parsed;
    return currentState;
  } catch {
    return null;
  }
}

export function getState() {
  return currentState;
}

export function updateState(updater) {
  if (typeof updater === 'function') {
    updater(currentState);
  } else {
    Object.assign(currentState, updater);
  }
  scheduleSave();
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch {
      // 저장 실패 시 수업 중단 방지를 위해 조용히 무시
    }
  }, 400);
}

export function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {
    // 조용히 무시
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 조용히 무시
  }
  currentState = createDefaultState();
}

export function initState(nickname) {
  currentState = createDefaultState();
  currentState.nickname = nickname;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  currentState.startedAt = `${y}-${m}-${d}`;
  saveNow();
}

export function markScreenCompleted(screenId) {
  if (!currentState.progress.completed.includes(screenId)) {
    currentState.progress.completed.push(screenId);
  }
  scheduleSave();
}

export function setLastScreen(hash) {
  currentState.progress.lastScreen = hash;
  scheduleSave();
}

export function hasState() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
