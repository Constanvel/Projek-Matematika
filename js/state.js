import { questions } from './data/questions.js';
import { map, spawn, gateIndex } from './data/levels.js';
export const freshState = () => ({ version: 1, level: 0, position: { ...spawn }, solved: [], attempts: {}, keys: [], won: false });
export const score = state => state.solved.length * 10;
export const levelQuestions = level => questions.filter(q => q.levelId === level);
export function walkable(state, x, y) {
  const tile = map[y]?.[x];
  if (!tile || tile === '#') return false;
  const index = gateIndex(tile);
  return index < 0 || state.solved.includes(levelQuestions(state.level)[index].id);
}
export function completeQuestion(state, id) {
  if (!state.solved.includes(id)) state.solved.push(id);
}
export const levelComplete = state => levelQuestions(state.level).every(q => state.solved.includes(q.id));
export function validateState(data) {
  if (!data || data.version !== 1 || !Number.isInteger(data.level) || data.level < 0 || data.level > 3 ||
      !Array.isArray(data.solved) || !Array.isArray(data.keys) || typeof data.attempts !== 'object' || !data.attempts) return null;
  const known = new Set(questions.map(q => q.id));
  if (data.solved.some(id => !known.has(id)) || new Set(data.solved).size !== data.solved.length) return null;
  if (data.keys.some(k => !Number.isInteger(k) || k < 0 || k > 2) || new Set(data.keys).size !== data.keys.length) return null;
  for (let i = 0; i < data.level; i++) {
    if (!data.keys.includes(i) || !levelQuestions(i).every(q => data.solved.includes(q.id))) return null;
  }
  if (data.keys.some(k => !levelQuestions(k).every(q => data.solved.includes(q.id)))) return null;
  if (data.solved.some(id => questions.find(q => q.id === id).levelId > data.level)) return null;
  for (const [id, attempts] of Object.entries(data.attempts)) {
    if (!known.has(id) || !Number.isInteger(attempts) || attempts < 1) return null;
  }
  if (data.solved.some(id => !data.attempts[id])) return null;
  if (typeof data.won !== 'boolean' || (data.won && (data.level !== 3 || data.solved.length !== 12))) return null;
  const state = { ...freshState(), ...data };
  if (!Number.isInteger(state.position?.x) || !Number.isInteger(state.position?.y) || !walkable(state, state.position.x, state.position.y)) state.position = { ...spawn };
  return state;
}
