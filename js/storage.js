import { validateState } from './state.js';
export const KEY = 'gundul-warrior-v1';
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: null };
    const state = validateState(JSON.parse(raw));
    return { state, warning: state ? '' : 'Progres tidak valid. Mulai permainan baru untuk melanjutkan.' };
  } catch { return { state: null, warning: 'Progres tidak dapat dibaca. Penyimpanan browser mungkin dibatasi.' }; }
}
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
