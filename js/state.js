import { questions } from './data/questions.js';
import { levels, levelForQuestion, phaseFor } from './data/levels.js';

export const freshState = () => ({ version: 1, contentVersion: 1, level: 0, phase: 'journey', checkpoint: 'start', solved: [], attempts: {}, keys: [], won: false });
export const score = state => state.solved.length * 10;
export const levelQuestions = level => questions.filter(q => levels[level]?.questionIds.includes(q.id));
export const levelComplete = state => levelQuestions(state.level).every(q => state.solved.includes(q.id));
export function completeQuestion(state, id) {
  if (levelForQuestion(id) !== state.level || state.solved.includes(id)) return false;
  const sequence = levels[state.level].questionIds;
  if (!sequence.slice(0, sequence.indexOf(id)).every(previous => state.solved.includes(previous))) return false;
  state.solved.push(id);
  if (['q3', 'q6', 'q9'].includes(id)) {
    const key = ['q3', 'q6', 'q9'].indexOf(id);
    const prerequisites = levels[key].questionIds.slice(0, 3);
    if (prerequisites.every(q => state.solved.includes(q)) && !state.keys.includes(key)) state.keys.push(key);
  }
  const checkpoint = levels[state.level].gates.find(gate => gate.questionId === id)?.checkpointId;
  const currentX = levels[state.level].checkpoints.find(cp => cp.id === state.checkpoint)?.x ?? 0;
  const target = levels[state.level].checkpoints.find(cp => cp.id === checkpoint);
  if (target && target.x > currentX) state.checkpoint = target.id;
  state.phase = phaseFor(state);
  return true;
}
export function advanceLevel(state) {
  if (!levelComplete(state) || !Array.from({ length: state.level + 1 }, (_, i) => i).every(key => state.keys.includes(key))) return false;
  if (state.level === levels.length - 1) state.won = true;
  else { state.level++; state.checkpoint = 'start'; state.phase = 'journey'; }
  return true;
}
export function validateState(data) {
  if (!data || data.version !== 1 || data.contentVersion !== 1 || !Number.isInteger(data.level) || data.level < 0 || data.level >= levels.length ||
    !Array.isArray(data.solved) || !Array.isArray(data.keys) || !data.attempts || typeof data.attempts !== 'object' || Array.isArray(data.attempts) || typeof data.won !== 'boolean') return null;
  const known = new Set(questions.map(q => q.id));
  if (new Set(data.solved).size !== data.solved.length || data.solved.some(id => !known.has(id) || levelForQuestion(id) > data.level)) return null;
  if (new Set(data.keys).size !== data.keys.length || data.keys.some(k => !Number.isInteger(k) || k < 0 || k > data.level)) return null;
  for (let i = 0; i < levels.length; i++) {
    const earned = levels[i].questionIds.slice(0, 3).every(id => data.solved.includes(id));
    if (data.keys.includes(i) !== earned) return null;
    if (i < data.level && !levels[i].questionIds.every(id => data.solved.includes(id))) return null;
  }
  const current = levels[data.level];
  for (const [id, count] of Object.entries(data.attempts)) {
    if (!known.has(id) || levelForQuestion(id) > data.level || !Number.isSafeInteger(count) || count < 1) return null;
  }
  if (data.solved.some(id => !Object.hasOwn(data.attempts, id))) return null;
  // Gates form a mandatory sequence. Forged saves must not skip an earlier gate.
  for (const level of levels) {
    let gap = false;
    for (const id of level.questionIds) {
      if (!data.solved.includes(id)) gap = true;
      else if (gap) return null;
    }
  }
  const checkpoint = current.checkpoints.find(cp => cp.id === data.checkpoint);
  if (!checkpoint || (checkpoint.requiresKeys || 0) > data.keys.length || (checkpoint.requiresQuestion && !data.solved.includes(checkpoint.requiresQuestion))) return null;
  const phase = phaseFor(data);
  // Existing Gundul Warrior v1 saves did not store the derived phase.
  if (data.phase !== undefined && data.phase !== phase) return null;
  const checkpointGate = current.gates.filter(g => g.x < checkpoint.x);
  if (checkpointGate.some(g => !data.solved.includes(g.questionId))) return null;
  if (data.won && (data.level !== 2 || data.solved.length !== questions.length || data.keys.length !== 3)) return null;
  return { version: 1, contentVersion: 1, level: data.level, phase, checkpoint: data.checkpoint, solved: [...data.solved], attempts: { ...data.attempts }, keys: [...data.keys], won: data.won };
}
