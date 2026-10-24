// Authored teaching paths, not inferred from prompt text. Steps run left to right.
export const machineDefinitions = {
  q1: { kind: 'evaluation', paths: [{ input: 4, steps: [{ name: 'f', output: 11 }] }] },
  q2: { kind: 'evaluation', paths: [{ input: -2, steps: [{ name: 'g', output: 11 }] }] },
  q3: { kind: 'relation', labels: ['SETIAP INPUT', 'TEPAT SATU OUTPUT'] },
  q4: { kind: 'composition', paths: [{ label: 'f ∘ g', input: 4, steps: [{ name: 'g', output: 3 }, { name: 'f', output: 9 }] }] },
  q5: { kind: 'composition', paths: [{ label: 'g ∘ f', input: -1, steps: [{ name: 'f', output: 1 }, { name: 'g', output: 3 }] }] },
  q6: {
    kind: 'comparison',
    paths: [
      { label: 'f ∘ g', input: 2, steps: [{ name: 'g', output: 4 }, { name: 'f', output: 9 }] },
      { label: 'g ∘ f', input: 2, steps: [{ name: 'f', output: 5 }, { name: 'g', output: 25 }] },
    ],
    difference: -16,
  },
  q7: { kind: 'composition', paths: [{ label: 'f ∘ g', input: 3, steps: [{ name: 'g', output: 9 }, { name: 'f', output: 19 }] }] },
  q8: { kind: 'composition', paths: [{ label: 'g ∘ f', input: 'x', steps: [{ name: 'f', output: 'x + 2' }, { name: 'g', output: '3x + 6' }] }] },
  q9: { kind: 'composition', paths: [{ label: 'f ∘ g', input: 'x', steps: [{ name: 'g', output: '2x + 1' }, { name: 'f', output: '4x² + 4x − 2' }] }] },
  // Mixed evaluation and inverse reasoning are not a single composition chain.
  q10: { kind: 'mixed', labels: ['PECAHKAN BERTAHAP', 'PERIKSA SETIAP HASIL'] },
  q11: { kind: 'mixed', labels: ['PECAHKAN BERTAHAP', 'PERIKSA SETIAP HASIL'] },
  q12: { kind: 'mixed', labels: ['PECAHKAN BERTAHAP', 'PERIKSA SETIAP HASIL'] },
};

/** Shared presentation model for the dialog and world. Unsolved paths expose no values. */
export function getMachineFlow(questionId, solved = false) {
  const definition = machineDefinitions[questionId] || { kind: 'generic', labels: ['INPUT', 'FUNGSI', 'OUTPUT'] };
  const paths = (definition.paths || []).map(path => {
    let input = path.input;
    const steps = path.steps.map(step => {
      const result = { name: step.name, input: solved ? input : null, output: solved ? step.output : null };
      input = step.output;
      return result;
    });
    return {
      label: path.label || '',
      input: solved ? path.input : null,
      output: solved ? input : null,
      steps,
      tokens: solved
        ? [`INPUT ${path.input}`, ...steps.map(step => `${step.name}(${step.input}) = ${step.output}`), `OUTPUT ${input}`]
        : ['INPUT', ...steps.map(step => step.name), 'OUTPUT'],
    };
  });
  const summary = definition.kind === 'comparison'
    ? solved ? `${paths[0].output} − ${paths[1].output} = ${definition.difference}` : 'BANDINGKAN KEDUA URUTAN · KURANGKAN HASIL'
    : '';
  return { kind: definition.kind, paths, labels: [...(definition.labels || [])], summary };
}
