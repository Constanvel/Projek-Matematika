export const questions = [
  {
    id: 'q1',
    levelId: 0,
    title: 'Nilai fungsi linear',
    prompt: 'Jika f(x) = 2x + 3, berapakah f(4)?',
    functions: 'f(x) = 2x + 3',
    type: 'number',
    answer: 11,
    hint: 'Ganti x dengan 4, lalu lakukan perkalian sebelum penjumlahan.',
    explanation: ['f(4) = 2(4) + 3.', 'Jadi, f(4) = 8 + 3 = 11.'],
  },
  {
    id: 'q2',
    levelId: 0,
    title: 'Nilai fungsi pada bilangan negatif',
    prompt: 'Jika g(x) = 5 − 3x, berapakah g(−2)?',
    functions: 'g(x) = 5 − 3x',
    type: 'number',
    answer: 11,
    hint: 'Perkalian dua bilangan negatif menghasilkan bilangan positif.',
    explanation: ['g(−2) = 5 − 3(−2).', 'Jadi, g(−2) = 5 + 6 = 11.'],
  },
  {
    id: 'q3',
    levelId: 0,
    title: 'Mengenali fungsi',
    prompt: 'Relasi manakah yang merupakan fungsi dari A = {1, 2, 3} ke B = {2, 4, 6}?',
    functions: 'f: A → B; A = {1, 2, 3}, B = {2, 4, 6}',
    type: 'multiple-choice',
    answer: 'b',
    options: [
      { id: 'a', label: '{(1, 2), (1, 4), (2, 6), (3, 2)}' },
      { id: 'b', label: '{(1, 2), (2, 4), (3, 6)}' },
      { id: 'c', label: '{(1, 2), (2, 4)}' },
      { id: 'd', label: '{(1, 2), (2, 4), (3, 2), (3, 6)}' },
    ],
    hint: 'Setiap anggota domain harus memiliki tepat satu pasangan di kodomain.',
    explanation: [
      'Pada pilihan b, setiap anggota A, yaitu 1, 2, dan 3, memiliki tepat satu pasangan di B.',
      'Pilihan a dan d memberi dua pasangan pada satu anggota domain; pilihan c tidak memasangkan anggota 3.',
    ],
  },
  {
    id: 'q4',
    levelId: 1,
    title: 'Menghitung f(g(a))',
    prompt: 'Jika f(x) = 2x + 3 dan g(x) = x − 1, berapakah f(g(4))?',
    functions: 'f(x) = 2x + 3; g(x) = x − 1',
    type: 'number',
    answer: 9,
    hint: 'Hitung g(4) terlebih dahulu, lalu masukkan hasilnya ke f.',
    explanation: ['g(4) = 4 − 1 = 3.', 'Jadi, f(g(4)) = f(3) = 2(3) + 3 = 9.'],
  },
  {
    id: 'q5',
    levelId: 1,
    title: 'Menghitung g(f(a))',
    prompt: 'Jika f(x) = x + 2 dan g(x) = 3x, berapakah g(f(−1))?',
    functions: 'f(x) = x + 2; g(x) = 3x',
    type: 'number',
    answer: 3,
    hint: 'Hitung f(−1) terlebih dahulu, lalu gunakan hasilnya sebagai masukan g.',
    explanation: ['f(−1) = −1 + 2 = 1.', 'Jadi, g(f(−1)) = g(1) = 3(1) = 3.'],
  },
  {
    id: 'q6',
    levelId: 1,
    title: 'Komposisi tidak komutatif',
    prompt: 'Jika f(x) = 2x + 1 dan g(x) = x², berapakah f(g(2)) − g(f(2))?',
    functions: 'f(x) = 2x + 1; g(x) = x²',
    type: 'number',
    answer: -16,
    hint: 'Hitung kedua urutan komposisi secara terpisah, lalu kurangkan sesuai urutan soal.',
    explanation: ['f(g(2)) = f(4) = 2(4) + 1 = 9.', 'g(f(2)) = g(5) = 5² = 25.', 'Jadi, f(g(2)) − g(f(2)) = 9 − 25 = −16; urutan komposisi memengaruhi hasil.'],
  },
  {
    id: 'q7',
    levelId: 2,
    title: 'Komposisi dua fungsi',
    prompt: 'Jika f(x) = 2x + 1 dan g(x) = x², berapakah (f ∘ g)(3)?',
    functions: 'f(x) = 2x + 1; g(x) = x²',
    type: 'number',
    answer: 19,
    hint: 'Hitung g(3) terlebih dahulu, kemudian masukkan hasilnya ke f.',
    explanation: ['(f ∘ g)(3) = f(g(3)).', 'g(3) = 3² = 9.', 'f(9) = 2(9) + 1 = 19.'],
  },
  {
    id: 'q8',
    levelId: 2,
    title: 'Urutan komposisi',
    prompt: 'Jika f(x) = x + 2 dan g(x) = 3x, manakah rumus (g ∘ f)(x)?',
    functions: 'f(x) = x + 2; g(x) = 3x',
    type: 'multiple-choice',
    answer: 'd',
    options: [
      { id: 'a', label: '3x + 2' },
      { id: 'b', label: 'x + 6' },
      { id: 'c', label: '3x² + 6x' },
      { id: 'd', label: '3x + 6' },
    ],
    hint: '(g ∘ f)(x) berarti g(f(x)), bukan f(g(x)).',
    explanation: ['(g ∘ f)(x) = g(x + 2).', 'Dengan rumus g, diperoleh 3(x + 2) = 3x + 6.'],
  },
  {
    id: 'q9',
    levelId: 2,
    title: 'Rumus komposisi aljabar',
    prompt: 'Jika f(x) = x² − 3 dan g(x) = 2x + 1, manakah rumus (f ∘ g)(x)?',
    functions: 'f(x) = x² − 3; g(x) = 2x + 1',
    type: 'multiple-choice',
    answer: 'b',
    options: [
      { id: 'a', label: '2x² − 5' },
      { id: 'b', label: '4x² + 4x − 2' },
      { id: 'c', label: '4x² − 2' },
      { id: 'd', label: '4x² + 4x + 1' },
    ],
    hint: 'Ganti setiap x pada f(x) dengan seluruh bentuk 2x + 1, lalu kembangkan kuadratnya.',
    explanation: ['(f ∘ g)(x) = f(2x + 1) = (2x + 1)² − 3.', 'Jadi, (f ∘ g)(x) = 4x² + 4x + 1 − 3 = 4x² + 4x − 2.'],
  },
  {
    id: 'q10',
    levelId: 3,
    title: 'Gabungan nilai fungsi dan komposisi',
    prompt: 'Jika f(x) = 3x − 2 dan g(x) = x + 4, berapakah f(2) + (g ∘ f)(1)?',
    functions: 'f(x) = 3x − 2; g(x) = x + 4',
    type: 'multiple-choice',
    answer: 'c',
    options: [
      { id: 'a', label: '5' },
      { id: 'b', label: '17' },
      { id: 'c', label: '9' },
      { id: 'd', label: '10' },
    ],
    hint: 'Hitung f(2) dan g(f(1)) secara terpisah, lalu jumlahkan.',
    explanation: ['f(2) = 3(2) − 2 = 4.', '(g ∘ f)(1) = g(3(1) − 2) = g(1) = 5.', 'Jadi, f(2) + (g ∘ f)(1) = 4 + 5 = 9.'],
  },
  {
    id: 'q11',
    levelId: 3,
    title: 'Selisih komposisi dan nilai fungsi',
    prompt: 'Jika f(x) = x² + 1 dan g(x) = 2x − 3, berapakah (f ∘ g)(−1) − g(2)?',
    functions: 'f(x) = x² + 1; g(x) = 2x − 3',
    type: 'number',
    answer: 25,
    hint: 'Hitung g(−1), gunakan hasilnya pada f, lalu kurangi dengan g(2).',
    explanation: ['g(−1) = 2(−1) − 3 = −5, sehingga f(g(−1)) = (−5)² + 1 = 26.', 'g(2) = 2(2) − 3 = 1.', 'Jadi, (f ∘ g)(−1) − g(2) = 26 − 1 = 25.'],
  },
  {
    id: 'q12',
    levelId: 3,
    title: 'Menentukan fungsi dari komposisi',
    prompt: 'Jika f(x) = 2x − 1 dan (f ∘ g)(x) = 6x + 7 untuk setiap x real, berapakah g(2)?',
    functions: 'f(x) = 2x − 1; (f ∘ g)(x) = 6x + 7',
    type: 'number',
    answer: 10,
    hint: 'Gunakan f(g(x)) = 2g(x) − 1 untuk menentukan g(x).',
    explanation: ['2g(x) − 1 = 6x + 7 sehingga 2g(x) = 6x + 8.', 'Maka g(x) = 3x + 4.', 'Jadi, g(2) = 3(2) + 4 = 10.'],
  },
];

export function checkAnswer(question, raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  if (typeof raw === 'string' && raw.trim() === '') return null;
  if (typeof raw === 'number' && !Number.isFinite(raw)) return null;

  if (question.type === 'number') {
    const value = Number(raw);
    return Number.isFinite(value) ? value === question.answer : null;
  }

  if (question.type === 'multiple-choice') {
    const value = String(raw).trim();
    if (!question.options.some((option) => option.id === value)) return null;
    return value === question.answer;
  }

  return null;
}
