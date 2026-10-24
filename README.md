# Gundul Warrior

Platformer edukasi 2D side-scrolling berbahasa Indonesia. Bergerak ke kiri–kanan, melompat, dan pulihkan mesin matematika untuk membuka jembatan serta gerbang. HTML, CSS, JavaScript ES modules, Canvas 2D, dan localStorage; tanpa framework, backend, atau aset CDN.

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

Tiga wilayah memakai geometri berbeda. Tiga soal utama tiap wilayah menghasilkan satu kunci. Tiga kunci membuka ruang harta kastel. Selesaikan 12 soal, lalu berinteraksi dengan peti terakhir untuk menang. Skor maksimal 120.

## Arsitektur

```text
index.html                     Menu, Canvas, HUD, dan dialog
css/style.css                  Tampilan dan responsivitas
js/main.js                     Orkestrasi layar dan progres
js/game/engine.js              Fixed-step loop, kamera, checkpoint
js/game/physics.js             Gerak, gravitasi, swept AABB
js/game/input.js               Keyboard dan multi-pointer
js/game/renderer.js            Lingkungan, karakter, efek
js/game/assets.js              Preload gambar
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

Transparansi direkonstruksi secara heuristik karena sumber RGB tidak memiliki alpha. Pose bukan spritesheet animasi lengkap; gameplay menggunakan pergantian pose dan bob ringan. Kepemilikan/lisensi karakter tetap mengikuti sumber pengguna. Lingkungan dibuat melalui kode Canvas tanpa aset pihak ketiga.

## Penyimpanan dan batasan

- Namespace baru: `gundul-warrior-v1`. Save `function-adventure-v1` tidak ditimpa atau dimigrasikan.
- Save menyimpan checkpoint dan fase perjalanan/ruang harta, bukan posisi melayang atau velocity. Save Gundul Warrior v1 yang belum memiliki fase tetap dapat dipulihkan.
- Save korup, versi tak dikenal, progres melompati gerbang, dan checkpoint tak sah ditolak.
- Storage ditolak browser tidak menghentikan permainan; peringatan ditampilkan.
- Tidak ada akun, sinkronisasi, leaderboard, audio, combat, musuh, atau platform bergerak.
- localStorage bukan penyimpanan antimanipulasi.
- Seluruh aset lokal; server lokal dapat digunakan tanpa internet. Hosting belum memiliki service worker/offline cache.
- Navigasi Canvas memerlukan penglihatan. Menu, input soal, dan pembahasan memakai DOM/keyboard; bukan game yang sepenuhnya dapat dimainkan dengan pembaca layar.
- Ilustrasi lingkungan masih procedural dan animasi karakter terbatas pada pose yang tersedia.

## Pengujian

```sh
npm test
```

Unit test meliputi matematika, physics deterministik, input, engine, collision, checkpoint, gerbang, tiga kunci, skor, save, dan kegagalan storage.

Pengujian browser menggunakan Playwright dan Microsoft Edge:

```sh
npm install
npm run test:browser
```

Memerlukan Edge terpasang. Konfigurasi ada di `playwright.config.js`; ubah channel jika menggunakan browser lain. Server pengujian dinyalakan otomatis. Tes mencakup perjalanan nyata melewati seluruh 12 soal hingga kemenangan, jawaban salah, review nilai antara, jeda (termasuk selama loading), reload checkpoint, pembatalan reset, pemulihan kegagalan aset, dan kontrol pointer simultan pada layar 390 px. Screenshot kegagalan dan screenshot mobile tersedia di `test-results/` (diabaikan Git).

Sebelum rilis: playtest keyboard dan sentuh pada perangkat nyata, periksa kenyamanan lompatan, minta guru memvalidasi materi, dan pastikan hak penggunaan karakter.

## Hosting statis

Unggah `index.html`, `css/`, `js/`, dan `assets/character/processed/` dengan struktur sama. Tidak memerlukan server Node pada hosting. Berkas original, scripts, dan tests tidak diperlukan untuk runtime.
