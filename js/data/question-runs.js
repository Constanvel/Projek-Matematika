import { questions as legacyQuestions } from './questions.js';

export const QUESTION_SET_VERSION = 1;
export const validQuestionSeed = seed => Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff;

export function newQuestionSeed(previous) {
  const bytes = new Uint32Array(1);
  try { globalThis.crypto.getRandomValues(bytes); }
  catch { bytes[0] = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0; }
  return bytes[0] && bytes[0] !== previous ? bytes[0] : ((previous || 0) + 1) >>> 0 || 1;
}

/** Versioned, deterministic variants: never reroll a question on retry or reload. */
export function generateRunQuestions(seed, version = QUESTION_SET_VERSION) {
  if (!validQuestionSeed(seed) || version !== QUESTION_SET_VERSION) throw new RangeError('Unknown question run');
  let cursor = seed >>> 0;
  const integer = (min, max) => {
    // Mulberry32; keep this algorithm stable for saved version-1 question sets.
    let value = cursor += 0x6d2b79f5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return min + Math.floor(((value ^ value >>> 14) >>> 0) / 4294967296 * (max - min + 1));
  };
  const bank = [];
  const add = (title, prompt, functions, answer, hint, explanation, machine, distractors) => {
    const index = bank.length;
    const question = { id: `q${index + 1}`, levelId: Math.floor(index / 3), title, prompt,
      functions, type: distractors ? 'multiple-choice' : 'number', answer, hint, explanation, machine };
    if (distractors) {
      const labels = [String(answer), ...new Set(distractors.map(String).filter(value => value !== String(answer)))].slice(0, 4);
      if (labels.length !== 4) throw new Error('Question requires four distinct choices');
      for (let i = labels.length - 1; i > 0; i--) {
        const j = integer(0, i); [labels[i], labels[j]] = [labels[j], labels[i]];
      }
      question.options = labels.map((label, i) => ({ id: 'abcd'[i], label }));
      question.answer = question.options.find(option => option.label === String(answer)).id;
    }
    bank.push(question);
  };
  const linear = (name, a, b) => `${name}(x) = ${a === 1 ? '' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
  const path = (input, steps, label = '') => ({ input, steps: steps.map(([name, output]) => ({ name, output })), label });
  const generic = labels => ({ kind: 'mixed', labels });

  {
    const a = integer(2, 5), b = integer(1, 7), n = integer(1, 6), answer = a * n + b;
    const functions = linear('f', a, b);
    add('Nilai fungsi linear', `Jika ${functions}, berapakah f(${n})?`, functions, answer,
      `Ganti x dengan ${n}; kerjakan perkalian sebelum penjumlahan.`,
      [`f(${n}) = ${a}(${n}) + ${b}.`, `f(${n}) = ${a * n} + ${b} = ${answer}.`],
      { kind: 'evaluation', paths: [path(n, [['f', answer]])] });
  }
  {
    const a = integer(2, 5), b = integer(5, 12), n = -integer(1, 4), answer = b - a * n;
    const functions = `g(x) = ${b} − ${a}x`;
    add('Nilai fungsi pada bilangan negatif', `Jika ${functions}, berapakah g(${n})?`, functions, answer,
      'Perkalian dua bilangan negatif menghasilkan bilangan positif.',
      [`g(${n}) = ${b} − ${a}(${n}).`, `g(${n}) = ${b} + ${-a * n} = ${answer}.`],
      { kind: 'evaluation', paths: [path(n, [['g', answer]])] });
  }
  {
    const a = integer(1, 6), b = a + 1, c = a + 2, r = integer(2, 5);
    const correct = `{(${a}, ${r}), (${b}, ${2 * r}), (${c}, ${3 * r})}`;
    const functions = `f: A → B; A = {${a}, ${b}, ${c}}, B = {${r}, ${2 * r}, ${3 * r}}`;
    add('Mengenali fungsi', `Relasi manakah yang merupakan fungsi dari A ke B?`, functions, correct,
      'Setiap anggota domain harus memiliki tepat satu pasangan di kodomain.',
      ['Periksa setiap anggota A, bukan hanya banyaknya pasangan.', 'Relasi yang benar memasangkan setiap anggota A tepat satu kali; keluaran boleh sama.'],
      { kind: 'relation', labels: ['SETIAP INPUT', 'TEPAT SATU OUTPUT'] },
      [`{(${a}, ${r}), (${a}, ${2 * r}), (${b}, ${3 * r}), (${c}, ${r})}`,
        `{(${a}, ${r}), (${b}, ${2 * r})}`, `{(${a}, ${r}), (${b}, ${2 * r}), (${c}, ${r}), (${c}, ${3 * r})}`]);
  }
  {
    const a = integer(2, 4), b = integer(1, 5), c = integer(1, 2), n = integer(3, 6);
    const middle = n - c, answer = a * middle + b;
    const functions = `${linear('f', a, b)}; ${linear('g', 1, -c)}`;
    add('Menghitung f(g(a))', `Jika ${functions}, berapakah f(g(${n}))?`, functions, answer,
      `Hitung g(${n}) dahulu, lalu masukkan hasilnya ke f.`,
      [`g(${n}) = ${n} − ${c} = ${middle}.`, `f(g(${n})) = f(${middle}) = ${a}(${middle}) + ${b} = ${answer}.`],
      { kind: 'composition', paths: [path(n, [['g', middle], ['f', answer]], 'f ∘ g')] });
  }
  {
    const a = integer(2, 4), b = integer(2, 5), c = integer(1, 5), n = -integer(1, 3);
    const middle = n + b, answer = a * middle + c;
    const functions = `${linear('f', 1, b)}; ${linear('g', a, c)}`;
    add('Menghitung g(f(a))', `Jika ${functions}, berapakah g(f(${n}))?`, functions, answer,
      `Hitung f(${n}) terlebih dahulu, kemudian gunakan hasilnya sebagai input g.`,
      [`f(${n}) = ${n} + ${b} = ${middle}.`, `g(f(${n})) = ${a}(${middle}) + ${c} = ${answer}.`],
      { kind: 'composition', paths: [path(n, [['f', middle], ['g', answer]], 'g ∘ f')] });
  }
  {
    const a = integer(2, 4), b = integer(1, 4), n = integer(2, 4), fg = a * n * n + b, gf = (a * n + b) ** 2;
    const functions = `${linear('f', a, b)}; g(x) = x²`;
    add('Komposisi tidak komutatif', `Jika ${functions}, berapakah f(g(${n})) − g(f(${n}))?`, functions, fg - gf,
      'Hitung kedua urutan komposisi secara terpisah, lalu kurangkan.',
      [`f(g(${n})) = ${a}(${n ** 2}) + ${b} = ${fg}.`, `g(f(${n})) = (${a * n + b})² = ${gf}.`, `${fg} − ${gf} = ${fg - gf}; urutan komposisi memengaruhi hasil.`],
      { kind: 'comparison', paths: [path(n, [['g', n ** 2], ['f', fg]], 'f ∘ g'),
        path(n, [['f', a * n + b], ['g', gf]], 'g ∘ f')], difference: fg - gf });
  }
  {
    const op = ['+', '−', '×', '÷'][integer(0, 3)], n = integer(1, 4), c = integer(1, 3), d = integer(1, 4);
    const multiplier = integer(2, 4), a = op === '÷' ? c * multiplier : integer(2, 4);
    const b = op === '÷' ? d * multiplier : integer(1, 6), f = a * n + b, g = c * n + d;
    const answer = op === '+' ? f + g : op === '−' ? f - g : op === '×' ? f * g : f / g;
    const functions = `${linear('f', a, b)}; ${linear('g', c, d)}`;
    add('Operasi aljabar fungsi', `Jika ${functions}, berapakah (f ${op} g)(${n})?${op === '÷' ? ` Gunakan g(${n}) ≠ 0.` : ''}`, functions, answer,
      'Hitung nilai kedua fungsi pada input yang sama, lalu lakukan operasi yang diminta.',
      [`f(${n}) = ${f}; g(${n}) = ${g}.`, `(f ${op} g)(${n}) = ${f} ${op} ${g} = ${answer}.${op === '÷' ? ' Penyebut tidak nol.' : ''}`],
      generic(['HITUNG KEDUA FUNGSI', 'GUNAKAN OPERASI YANG DIMINTA']));
  }
  {
    const a = integer(2, 5), b = integer(1, 8), functions = linear('f', a, b), answer = `(x − ${b}) / ${a}`;
    add('Invers fungsi linear', `Untuk x real, jika ${functions}, manakah rumus f⁻¹(x)?`, functions, answer,
      'Misalkan y = f(x), lalu nyatakan x dalam y. Invers bukan 1/f(x).',
      [`y = ${a}x + ${b}, sehingga y − ${b} = ${a}x.`, `x = (y − ${b}) / ${a}; jadi f⁻¹(x) = ${answer}.`],
      generic(['OUTPUT LAMA', 'BALIKKAN OPERASI', 'INPUT SEMULA']),
      [`(x + ${b}) / ${a}`, `${a}x − ${b}`, `x / ${a} − ${b}`]);
  }
  {
    const a = integer(2, 5), b = integer(1, 6), c = integer(1, 6);
    const functions = `${linear('f', a, b)}; ${linear('g', 1, c)}`;
    add('Invers komposisi fungsi', `Fungsi f dan g bijektif pada bilangan real. Jika ${functions} dan h = f ∘ g, manakah h⁻¹(x)?`, functions, 'g⁻¹(f⁻¹(x))',
      'Enkripsi g lalu f dibatalkan dengan invers f terlebih dahulu, kemudian invers g.',
      ['h(x) = f(g(x)): input melewati g kemudian f.', 'Urutan pembaliknya adalah f⁻¹ kemudian g⁻¹; jadi h⁻¹ = g⁻¹ ∘ f⁻¹.'],
      generic(['BALIKKAN F TERLEBIH DAHULU', 'KEMUDIAN BALIKKAN G']),
      ['f⁻¹(g⁻¹(x))', 'f(g(x))', 'g(f(x))']);
  }
  {
    const a = integer(2, 4), b = integer(1, 5), c = integer(2, 3), d = integer(1, 4), p = integer(2, 9);
    const middle = c * p + d, cipher = a * middle + b, reverse = c * (a * p + b) + d;
    const functions = `${linear('f', a, b)}; ${linear('g', c, d)}; E = f ∘ g`;
    add('Enkripsi dua tahap', `Satu karakter memiliki kode bilangan p = ${p}. Dengan ${functions}, berapakah cipherteks E(p)?`, functions, cipher,
      'Ini simulasi enkripsi matematika: gunakan kunci g dahulu, lalu kunci f.',
      [`g(${p}) = ${c}(${p}) + ${d} = ${middle}.`, `E(${p}) = f(${middle}) = ${a}(${middle}) + ${b} = ${cipher}.`],
      { kind: 'composition', paths: [path(p, [['g', middle], ['f', cipher]], 'E = f ∘ g')] },
      [reverse, cipher + a, cipher - c, cipher + 1, cipher + 2]);
  }
  {
    const a = integer(2, 5), b = integer(1, 7), p = integer(1, 15), cipher = a * p + b;
    const functions = linear('E', a, b);
    add('Dekripsi dengan invers', `Kode pesan dienkripsi menggunakan ${functions}. Jika diterima cipherteks c = ${cipher}, berapakah kode awalnya?`, functions, p,
      'Batalkan penjumlahan terlebih dahulu, kemudian batalkan perkalian.',
      [`E⁻¹(x) = (x − ${b}) / ${a}.`, `E⁻¹(${cipher}) = (${cipher} − ${b}) / ${a} = ${p}.`],
      { kind: 'inverse', paths: [path(cipher, [['E⁻¹', p]], 'Dekripsi')] });
  }
  {
    const a = integer(2, 4), b = integer(1, 5), c = integer(2, 3), d = integer(1, 4), p = integer(2, 9);
    const middle = c * p + d, cipher = a * middle + b;
    const functions = `${linear('f', a, b)}; ${linear('g', c, d)}; E = f ∘ g`;
    add('Dekripsi enkripsi ganda', `Sebuah kode dienkripsi memakai ${functions}. Jika diterima cipherteks c = ${cipher}, berapakah kode awalnya?`, functions, p,
      'Balikkan f terlebih dahulu, kemudian g; urutan dekripsi berlawanan dengan enkripsi.',
      [`Batalkan f: (${cipher} − ${b}) / ${a} = ${middle}.`, `Batalkan g: (${middle} − ${d}) / ${c} = ${p}.`, `Kode awal ${p} kembali menjadi ${cipher} setelah dienkripsi g lalu f.`],
      { kind: 'inverse-composition', paths: [path(cipher, [['f⁻¹', middle], ['g⁻¹', p]], 'Dekripsi E')] });
  }
  return bank;
}

/** Old saves have no seed and keep their original questions and worked answers. */
export function questionsForState(state) {
  return state.questionSeed === undefined && state.questionSetVersion === undefined
    ? legacyQuestions : generateRunQuestions(state.questionSeed, state.questionSetVersion);
}
