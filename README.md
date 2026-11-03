# Gundul Warrior

Platformer edukasi 2D side-scrolling berbahasa Indonesia. Bergerak ke kiri–kanan, melompat, dan pulihkan mesin matematika untuk membuka jembatan serta gerbang. HTML, CSS, JavaScript ES modules, Canvas 2D, dan localStorage; tanpa framework, backend, atau aset CDN.

## Dokumen produk

[Rencana keterbacaan dan platforming](docs/PLATFORMING-PLAN.md) mencatat referensi desain Mario, tahapan atomic commit, dan kriteria tantangan yang adil. Prinsip yang dipakai adalah pengenalan aman, pengembangan pola, variasi, dan area pemulihan; bukan penyalinan aset atau level.

[PRD Gundul Warrior](docs/PRD.md) menetapkan kebutuhan platformer pixel art layar penuh, materi matematika, kontrol, dan kriteria penerimaan. Nama Function Adventure hanya asal konsep laporan sekolah. Implementasi memakai Canvas rendah 480×270 yang diperbesar nearest-neighbor, karakter pixel turunan orisinal, tiga wilayah, koleksi opsional, serta musik chiptune lokal.

[Catatan polesan aset](docs/ASSET-POLISH.md) menjelaskan variasi kanopi hutan, air terjun di dinding gua, lapisan arsitektur kastel, ikon pixel orisinal, serta batas penggunaan kandidat unduhan yang lisensinya belum terverifikasi. Semua perubahan tersebut memakai geometri level dan progres belajar yang sama.

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
- **Pengaturan**: mute, volume utama, volume musik, dan volume efek suara secara terpisah; audio baru dimulai setelah interaksi. Preferensi audio lama tetap diterima dengan level kanal musik/efek 100%, sehingga volume utama lama tetap berlaku.
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

Tiga wilayah memakai geometri dan mekanik permukaan berbeda: akar pegas hutan memperkuat lompatan manual, es gua mengurangi pengereman, dan batu retak kastel runtuh 0,7 detik setelah diinjak lalu pulih setelah 2,5 detik. Gimmick diajarkan di atas lantai aman sebelum bagian lanjut. Rangkaian wajib dipisahkan area istirahat dan checkpoint; lantai terputus memerlukan lompatan yang disengaja, bukan berjalan lurus. Jalur rahasia tetap opsional, dengan total 55 koin terpisah dari skor matematika.

| Wilayah | Lebar dunia lama → baru | Rangkaian wajib | Total lompatan wajib |
| --- | --- | --- | --- |
| Hutan | 3.400 → 5.500 | 4 | 12 |
| Gua | 3.700 → 6.300 | 4 | 16 |
| Kastel | 5.700 → 8.900 | 7 | 24 |

Kastel mendapat tiga rangkaian tengah baru: kubah naik, menara inti tinggi, dan langkah rendah; masing-masing dua lompatan wajib dengan pulau istirahat sebelum mesin. Bagian akhir hutan memakai dua rangkaian empat lompatan; gua dua rangkaian lima lompatan; kastel dua rangkaian enam lompatan dengan batu runtuh. Ketinggian, jarak, dan ukuran pendaratan bervariasi. Checkpoint lama dan urutan gerbang tetap; exit berpindah ke ujung perluasan.

Panel alur fungsi besar tidak lagi menutupi medan; detail berada dalam dialog yang menjeda dunia. Blok tanda tanya dan panel melayang di atas jalur dihapus; teks petunjuk tetap kontekstual dengan ukuran CSS, sehingga tidak membesar mengikuti Canvas. Bendera rapat dikelompokkan secara visual tanpa menghapus posisi checkpoint save. HUD kecil tetap menampilkan health, skor, koin, serta kunci; petunjuk bawah hanya tampil saat relevan. Background bawah kini diisi scenery kedalaman sesuai tema sampai tepi layar, tanpa bidang polos atau efek titik hitam menimpa medan. Siluet pohon, gunung, gua, dan dinding kastel berlanjut melewati viewport; detail akar, batu, retakan, serta fondasi dimulai di belakang lantai sehingga tidak meninggalkan garis putus atau pita warna kosong di jurang.

### Health dan leaderboard lokal

- Mulai dengan 3 health; jatuh mengurangi satu. Health habis memulihkan 3 health pada checkpoint, tanpa menghapus jawaban, skor, kunci, atau koin. Jawaban salah tidak mengurangi health.
- Health, jumlah jatuh, serta waktu bermain aktif tersimpan terpisah dari progres belajar. Waktu tidak berjalan di menu, loading, dialog, atau jeda. Petualangan baru mereset run, bukan leaderboard.
- Setelah tamat, masukkan nama opsional dan simpan hasil satu kali. Leaderboard menampilkan 10 hasil lokal: skor tertinggi, jatuh tersedikit, lalu waktu aktif tercepat. Tersedia dari menu dan layar kemenangan.
- Tidak ada backend, akun, sinkronisasi lintas perangkat, atau perlindungan manipulasi skor lokal. Jika penyimpanan browser diblokir, gameplay tetap berjalan dan penyimpanan hasil menampilkan kegagalan.

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
js/game/world-labels.js        Metadata petunjuk dan pengelompokan bendera
js/game/run-records.js         Health, run aktif, dan leaderboard lokal terpisah
js/game/pixel-character.js     Sprite pixel turunan dan tujuh jenis animasi
js/game/menu-scene.js          Pemandangan menu/kemenangan
js/game/audio.js               Musik chiptune dan efek Web Audio orisinal
js/ui/pixel-icons.js           Medali peringkat dan ikon speaker pixel orisinal
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
- Tidak ada akun, sinkronisasi lintas perangkat, combat, musuh aktif, atau platform bergerak. Leaderboard hanya disimpan lokal.
- Audio disintesis melalui Web Audio setelah gesture; browser tanpa dukungan audio tetap dapat memainkan game.
- Musik tiap wilayah memakai dua frasa bergantian; kanal musik dan efek mempunyai volume terpisah di bawah volume utama. Preferensi tambahan tetap di namespace audio, bukan save progres belajar.
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
