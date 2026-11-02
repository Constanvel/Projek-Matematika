# Gundul Warrior

Platformer edukasi 2D side-scrolling berbahasa Indonesia. Bergerak ke kiri–kanan, melompat, dan pulihkan mesin matematika untuk membuka jembatan serta gerbang. HTML, CSS, JavaScript ES modules, Canvas 2D, dan localStorage; tanpa framework, backend, atau aset CDN.

## Dokumen produk

[PRD Gundul Warrior](docs/PRD.md) menetapkan kebutuhan platformer pixel art layar penuh, materi matematika, kontrol, dan kriteria penerimaan. Nama Function Adventure hanya asal konsep laporan sekolah. Implementasi memakai Canvas rendah 480×270 yang diperbesar nearest-neighbor, karakter pixel turunan orisinal, tiga wilayah, koleksi opsional, serta musik chiptune lokal.

Menu merupakan overlay di atas dunia, bukan halaman promosi. Permainan memenuhi viewport tanpa memotong rasio medan. Pada ponsel portrait, letterbox menjaga seluruh lebar kamera terlihat dan menyediakan ruang kontrol. Tombol **Layar penuh** menyembunyikan antarmuka browser jika Fullscreen API diizinkan; jika tidak, game tetap mengisi viewport.

## Menjalankan

Node.js 20 atau lebih baru:

```sh
npm start
```

Buka http://localhost:4173. Server hanya untuk pengembangan lokal. Tidak perlu `npm install` untuk memainkan game; dependensi npm hanya untuk pengujian browser. Jangan buka `index.html` melalui `file://` karena memakai ES modules.

## Cara bermain

- **A/D** atau panah kiri/kanan: berjalan.
- **Space**, **W**, atau panah atas: melompat. Tahan untuk lompatan lebih tinggi.
- **E** atau tombol **Interaksi**: gunakan mesin atau peti terdekat.
- **Esc**: jeda. Dunia juga berhenti ketika tab kehilangan fokus.
- **Pengaturan**: mute dan volume musik/efek; audio baru dimulai setelah interaksi.
- Koin emas mendorong eksplorasi dan rahasia; tidak menambah skor matematika atau menjadi syarat tamat.
- Pada layar sentuh, tahan arah sambil menekan **Lompat**.

Dekati mesin untuk menjawab soal. Jawaban benar memberi 10 poin sekali dan membuka pengunci/jembatan. Jawaban salah memberikan pembahasan dan kesempatan mencoba kembali tanpa penalti. Mesin selesai dapat ditinjau ulang. Dunia berhenti saat soal terbuka.

Bendera menyimpan checkpoint. Menyelesaikan mesin juga langsung menyimpan titik aman di dekat terminal. Jatuh mengembalikan karakter ke checkpoint; jawaban dan skor tidak hilang. Dua mesin di gua memperlihatkan urutan fungsi dan hasil antara setelah berhasil. Lanjutkan permainan dari browser dan origin yang sama.

## Wilayah

| Wilayah | Soal | Tujuan |
| --- | --- | --- |
| Hutan Fungsi | q1–q3 | Substitusi dan pengenalan fungsi |
| Gua Komposisi | q4–q6 | Komposisi numerik dan urutan |
| Kastel Matematika | q7–q9 | Komposisi kuadrat dan aljabar |
| Ruang harta di dalam kastel | q10–q12 | Tantangan gabungan |

Tiga wilayah memakai geometri berbeda. Setiap wilayah memiliki parkour wajib di atas lantai yang terputus: dua lompatan berurutan di hutan, tiga di gua, dan tiga dengan variasi ketinggian di kastel. Bendera sebelum rangkaian menyimpan titik aman. Berjalan lurus atau melewatkan salah satu lompatan tidak dapat menyeberang; pijakan disesuaikan dengan physics sebenarnya. Jalur atas dan tiga kantong rahasia tetap opsional, dengan total 55 koin terpisah dari skor matematika.

Tiga soal utama tiap wilayah menghasilkan satu kunci. Tiga kunci membuka ruang harta kastel. Selesaikan 12 soal, lalu berinteraksi dengan peti terakhir untuk menang. Skor maksimal 120.

## Arsitektur

```text
index.html                     Menu, Canvas, HUD, dan dialog
css/style.css                  Tampilan dan responsivitas
js/main.js                     Orkestrasi layar dan progres
js/game/engine.js              Fixed-step loop, kamera, checkpoint
js/game/physics.js             Gerak, gravitasi, swept AABB
js/game/input.js               Keyboard dan multi-pointer
js/game/renderer.js            Tile pixel, lingkungan, gerbang, partikel
js/game/pixel-character.js     Sprite pixel turunan dan tujuh jenis animasi
js/game/menu-scene.js          Pemandangan menu/kemenangan
js/game/audio.js               Musik chiptune dan efek Web Audio orisinal
js/game/assets.js              Preload atlas pixel lokal dan pemulihan gagal muat
js/ui/questions.js             Soal, petunjuk, pembahasan
js/data/levels.js              Geometri dan objek tiga wilayah
js/data/questions.js           12 soal dan validasi jawaban
js/data/machines.js            Urutan mesin dan nilai antara yang ditulis eksplisit
js/state.js                    Skor, prasyarat, validasi progres
js/storage.js                  localStorage
assets/character/original/     PNG asli dari ZIP pengguna
assets/character/processed/    PNG RGBA transparan, anchor seragam
assets/character/manifest.json Metadata dan hash aset
scripts/prepare-character.py  Persiapan aset reproducible
```

Simulasi berjalan pada 1/60 detik; rendering memakai requestAnimationFrame. Ada coyote time 100 ms, jump buffer 120 ms, dan variable jump. Collision terpisah dari gambar. Canvas menggunakan koordinat logis 960×540; kamera horizontal dibatasi ukuran dunia.

## Aset karakter

Tujuh pose berasal dari `karakter.zip` yang diberikan pengguna. ZIP sumber tidak diubah. Gambar original disimpan byte-identik; versi processed menghapus latar terang yang terhubung ke tepi, mempertahankan detail interior, serta menormalkan canvas menjadi 448×544 dengan anchor kaki (224, 528).

Untuk memproses ulang, gunakan Python dengan Pillow, NumPy, dan OpenCV. Lihat opsi `--help` pada script. Dependensi Python tidak diperlukan untuk memainkan game.

Transparansi aset processed direkonstruksi secara heuristik karena sumber RGB tidak memiliki alpha. Sumber dan processed dipertahankan. Runtime tidak menempelkan ilustrasi resolusi tinggi ke dunia pixel: `js/game/pixel-character.js` menggambar interpretasi baru bergrid 32×48 dengan kepala gundul, zirah gelap, bros perak, dan jubah merah. Idle, walk, run, jump, fall, land, dan victory memiliki frame tersendiri. Turunan serta metadata tersedia di `assets/character/pixel/`; hak identitas karakter tetap mengikuti sumber pengguna. Lingkungan, logo pixel, musik tiga wilayah, dan efek suara dibuat secara lokal tanpa aset Mario atau unduhan CDN.

## Penyimpanan dan batasan

- Namespace baru: `gundul-warrior-v1`. Save `function-adventure-v1` tidak ditimpa atau dimigrasikan.
- Save menyimpan checkpoint dan fase perjalanan/ruang harta, bukan posisi melayang atau velocity. Save Gundul Warrior v1 yang belum memiliki fase tetap dapat dipulihkan.
- Koleksi ditambahkan sebagai field opsional `collected`; save lama mendapat daftar kosong tanpa kehilangan soal, skor, atau kunci. Pengaturan audio disimpan terpisah di `gundul-warrior-audio-v1`.
- Save korup, versi tak dikenal, progres melompati gerbang, dan checkpoint tak sah ditolak.
- Storage ditolak browser tidak menghentikan permainan; peringatan ditampilkan.
- Tidak ada akun, sinkronisasi, leaderboard, combat, musuh aktif, atau platform bergerak.
- Audio disintesis melalui Web Audio setelah gesture; browser tanpa dukungan audio tetap dapat memainkan game.
- localStorage bukan penyimpanan antimanipulasi.
- Seluruh aset lokal; server lokal dapat digunakan tanpa internet. Hosting belum memiliki service worker/offline cache.
- Navigasi Canvas memerlukan penglihatan. Menu, input soal, dan pembahasan memakai DOM/keyboard; bukan game yang sepenuhnya dapat dimainkan dengan pembaca layar.
- Sprite dan tile dibuat procedural pada grid piksel; belum memakai editor level atau spritesheet dari seniman eksternal.
- Belum ada klaim efektivitas belajar, benchmark perangkat sekolah, atau dukungan browser yang belum diuji.

## Pengujian

```sh
npm test
```

Unit test meliputi matematika, physics deterministik, input, engine, collision, checkpoint, gerbang, tiga kunci, skor, save lama, koleksi, aset gagal muat, dan pengaturan audio. Pengujian level memakai physics sebenarnya untuk memeriksa semua koleksi, perjalanan penuh, serta bukti bahwa setiap lompatan parkour wajib diperlukan.

Pengujian browser menggunakan Playwright dan Microsoft Edge:

```sh
npm install
npm run test:browser
```

Memerlukan Edge terpasang. Konfigurasi ada di `playwright.config.js`; ubah channel jika menggunakan browser lain. Server pengujian dinyalakan otomatis. Tes mencakup perjalanan nyata dengan keyboard melewati parkour dan seluruh 12 soal hingga kemenangan, jawaban salah, review nilai antara, jeda (termasuk selama loading), jatuh/respawn, reload checkpoint, pembatalan reset, pemulihan kegagalan atlas pixel, preferensi audio, viewport layar penuh, dan kontrol pointer simultan pada layar 390 px. Screenshot kegagalan dan screenshot mobile tersedia di `test-results/` (diabaikan Git).

Sebelum rilis: playtest keyboard dan sentuh pada perangkat nyata, periksa kenyamanan lompatan, minta guru memvalidasi materi, dan pastikan hak penggunaan karakter.

## Hosting statis

Unggah `index.html`, `css/`, `js/`, dan `assets/character/pixel/gundul-sheet.png` dengan struktur sama. Tidak memerlukan server Node pada hosting. Berkas original, scripts, dan tests tidak diperlukan untuk runtime.
