export const levels = [
  { name: 'Hutan Fungsi', subtitle: 'Setiap perjalanan dimulai dari satu langkah.', theme: 'forest', lesson: 'Kenali fungsi dan substitusi nilai.', symbol: '01' },
  { name: 'Gua Komposisi', subtitle: 'Temukan urutan yang membuka jalan.', theme: 'cave', lesson: 'Kerjakan fungsi bagian dalam terlebih dahulu.', symbol: '02' },
  { name: 'Kastel Matematika', subtitle: 'Buktikan kemampuanmu di balik gerbang kastel.', theme: 'castle', lesson: 'Perhatikan substitusi dan bentuk aljabar.', symbol: '03' },
  { name: 'Harta Fungsi', subtitle: 'Tiga tantangan terakhir. Satu petualangan luar biasa.', theme: 'treasure', lesson: 'Gabungkan semua yang telah kamu pelajari.', symbol: '04' }
];
// A single winding corridor makes every gate mandatory, including on touch devices.
export const map = [
  '###############',
  '#S..A.........#',
  '#############.#',
  '#....B........#',
  '#.#############',
  '#....C......T.#',
  '###############'
];
export const spawn = { x: 1, y: 1 };
export const gateIndex = tile => typeof tile === 'string' && tile.length === 1 ? 'ABC'.indexOf(tile) : -1;
