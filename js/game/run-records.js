/** Local-only run data. Neither namespace reads or changes learning progress. */
export const RUN_KEY = 'gundul-warrior-run-v1';
export const LEADERBOARD_KEY = 'gundul-warrior-leaderboard-v1';

const MAX_HEALTH = 3;
const LEADERBOARD_LIMIT = 10;
const DEFAULT_NAME = 'Petualang';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonnegative = value => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, value)) : 0;
const count = value => Math.floor(nonnegative(value));

/**
 * Return an independent, full-health run. The caller advances elapsed while active,
 * sets completed on victory, and sets recorded only after saving the victory.
 */
export function createRun() {
  return { health: MAX_HEALTH, maxHealth: MAX_HEALTH, falls: 0, elapsed: 0, completed: false, recorded: false };
}

function normalizeRun(value) {
  if (!isRecord(value)) return createRun();
  const health = typeof value.health === 'number' && Number.isFinite(value.health)
    ? Math.max(1, Math.min(MAX_HEALTH, Math.floor(value.health))) : MAX_HEALTH;
  return {
    health, maxHealth: MAX_HEALTH, falls: count(value.falls), elapsed: nonnegative(value.elapsed),
    completed: value.completed === true, recorded: value.recorded === true,
  };
}

/** Mutate the run; the third fall immediately restores all three health points. */
export function takeFall(run) {
  Object.assign(run, normalizeRun(run));
  run.falls = Math.min(Number.MAX_SAFE_INTEGER, run.falls + 1);
  run.health -= 1;
  const depleted = run.health === 0;
  if (depleted) run.health = MAX_HEALTH;
  return { depleted };
}

/** Produce plain display text, limited to 20 Unicode code points. Render with textContent. */
export function sanitizeName(name) {
  if (typeof name !== 'string') return DEFAULT_NAME;
  const text = name.replace(/[<>\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
    .replace(/\s+/gu, ' ').trim();
  return Array.from(text).slice(0, 20).join('') || DEFAULT_NAME;
}

function readJSON(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return typeof raw === 'string' ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(storage, key, value) {
  try {
    if (typeof storage?.setItem !== 'function') return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Load a validated run, or return a fresh run when storage is missing or unreadable. */
export function loadRun(storage) {
  return normalizeRun(readJSON(storage, RUN_KEY));
}

/** Save a validated snapshot. Returns false when persistence is unavailable. */
export function saveRun(storage, run) {
  return writeJSON(storage, RUN_KEY, normalizeRun(run));
}

/** Persist and return a fresh run without touching leaderboard or learning records. */
export function resetRun(storage) {
  const run = createRun();
  saveRun(storage, run);
  return run;
}

function validEntry(entry) {
  return isRecord(entry)
    && typeof entry.name === 'string'
    && Number.isSafeInteger(entry.score) && entry.score >= 0 && entry.score <= 120
    && Number.isSafeInteger(entry.falls) && entry.falls >= 0
    && typeof entry.elapsed === 'number' && Number.isFinite(entry.elapsed)
    && entry.elapsed >= 0 && entry.elapsed <= Number.MAX_SAFE_INTEGER;
}

function rank(entries) {
  // Stable sorting keeps earlier victories first when every ranking value ties.
  return entries.sort((a, b) => b.score - a.score || a.falls - b.falls || a.elapsed - b.elapsed)
    .slice(0, LEADERBOARD_LIMIT);
}

/** Return up to ten entries, ranked by score descending, falls then elapsed ascending. */
export function getLeaderboard(storage) {
  const entries = readJSON(storage, LEADERBOARD_KEY);
  if (!Array.isArray(entries)) return [];
  return rank(entries.filter(validEntry).map(entry => ({
    score: entry.score, falls: entry.falls, elapsed: entry.elapsed, name: sanitizeName(entry.name),
  })));
}

/**
 * Append a victory (ties and duplicate runs are retained) and return the top ten.
 * The returned list remains usable if saving fails; persistence is best-effort.
 * Scores are local display records, not trusted or cheat-resistant results.
 */
export function recordVictory(storage, victory = {}) {
  const value = isRecord(victory) ? victory : {};
  const entry = {
    score: Math.min(120, count(value.score)), falls: count(value.falls), elapsed: nonnegative(value.elapsed),
    name: sanitizeName(value.name),
  };
  const leaderboard = rank([...getLeaderboard(storage), entry]);
  writeJSON(storage, LEADERBOARD_KEY, leaderboard);
  return leaderboard;
}
