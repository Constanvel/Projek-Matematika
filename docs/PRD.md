# PRD — Gundul Warrior

- **Versi:** 1.1
- **Status:** Rancangan produk; bukan pernyataan bahwa seluruh fitur telah selesai.
- **Arah produk:** Game edukasi komposisi fungsi berbasis website, berupa platformer 2D side-scrolling dengan pixel art.
- **Bahasa:** Indonesia.
- **Target:** Siswa SMA/SMK yang mempelajari fungsi dan komposisi fungsi.

## 1. Konteks dan keputusan produk

Dokumen ini menerjemahkan laporan ide Function Adventure menjadi kebutuhan produk **Gundul Warrior** yang dapat dikembangkan dan diuji. Petualangan bukan berupa peta top-down atau kumpulan kuis statis: pemain berjalan, melompat, menyeberangi platform, dan memperbaiki mesin matematika untuk membuka jalur.

Istilah **Mario-like** merujuk pada struktur platformer: gerak kiri–kanan, gravitasi, lompatan, kamera horizontal, checkpoint, rintangan, serta tujuan di ujung level. Karakter, nama, musik, sprite, susunan level, dan identitas visual harus orisinal atau berlisensi sesuai penggunaan. Tidak menggunakan aset atau merek Mario/Nintendo.

Nama produk adalah **Gundul Warrior**, konsisten pada menu, identitas HUD, dan kemenangan. Function Adventure adalah asal konsep pendidikan, bukan nama aplikasi. Namespace `gundul-warrior-v1` dipertahankan. Aset sumber tetap disimpan; karakter runtime menggunakan interpretasi pixel art turunan di lokasi terpisah.

**Revisi pengalaman:** game memenuhi viewport, bukan halaman promosi dengan Canvas dalam kartu. Menu dan kemenangan merupakan overlay pada dunia pixel; HUD, jeda, dan kontrol berada di tepi layar. Tombol Layar penuh menggunakan Fullscreen API setelah tindakan pengguna jika tersedia. Rasio dunia tetap dipertahankan saat bermain; portrait boleh memakai letterbox agar medan tidak terpotong.

## 2. Masalah dan tujuan

### Masalah pengguna

- Latihan soal konvensional kurang interaktif.
- Siswa sering tertukar antara f(g(x)) dan g(f(x)).
- Jawaban akhir tanpa pembahasan tidak cukup menjelaskan kesalahan.
- Kontrol permainan yang sulit berpotensi mengalihkan perhatian dari materi.

### Tujuan produk

1. Menghubungkan keberhasilan memahami matematika dengan perubahan nyata di dunia permainan.
2. Melatih substitusi, urutan komposisi, dan komposisi aljabar secara bertahap.
3. Memberikan platforming yang mudah dipelajari, tanpa menghukum kesalahan belajar.
4. Menyediakan permainan single-player tanpa akun atau backend, dengan progres lokal.

### Bukan tujuan MVP

Multiplayer, combat, musuh aktif, nyawa terbatas, batas waktu soal, leaderboard daring, transaksi, editor level, dan penilaian resmi sekolah tidak termasuk MVP. Tidak ada klaim peningkatan hasil belajar sebelum evaluasi pengguna dilakukan.

## 3. Pilar pengalaman

| Pilar | Ketentuan |
| --- | --- |
| Platformer terlebih dahulu | Pemain benar-benar mengendalikan karakter di dunia 2D, bukan berpindah melalui tombol kuis saja. |
| Matematika mengubah dunia | Jawaban benar membuka gerbang, mengaktifkan jembatan, atau menghidupkan mesin fungsi. |
| Aman untuk belajar | Salah menjawab tidak mengurangi skor atau nyawa; jatuh tidak menghapus soal yang selesai. |
| Proses terlihat | Pembahasan menunjukkan fungsi yang dikerjakan dahulu dan hasil antara. |
| Pixel art konsisten | Karakter, tile, objek, dan efek mengikuti grid piksel yang sama. |

## 4. Pengguna dan skenario utama

- **Siswa:** memulai permainan, mempelajari kontrol, menyelesaikan tiga wilayah, membaca pembahasan, dan kembali melanjutkan progres.
- **Guru:** menggunakan tantangan sebagai latihan pendamping, bukan pengganti penjelasan materi atau asesmen formal.
- **Pengembang siswa PPLG:** memelihara bank soal dan level secara terpisah dari engine.

Satu sesi penuh ditargetkan sekitar 15–25 menit. Durasi ini merupakan hipotesis yang perlu diuji, bukan batas waktu permainan.

## 5. Loop permainan dan struktur dunia

1. Pilih Mulai atau Lanjutkan dari menu.
2. Jelajahi level dengan berjalan dan melompat.
3. Capai checkpoint dan dekati mesin atau gerbang matematika.
4. Tekan Interaksi untuk membuka soal; simulasi dunia berhenti.
5. Baca fungsi, gunakan petunjuk bila perlu, lalu jawab.
6. Jika salah, baca pembahasan dan coba kembali tanpa penalti.
7. Jika benar, dapatkan 10 poin satu kali dan aktifkan perubahan lingkungan.
8. Selesaikan tiga soal utama wilayah untuk mendapatkan satu kunci.
9. Capai pintu keluar untuk berpindah ke wilayah berikutnya.
10. Kumpulkan tiga kunci, selesaikan tantangan akhir di kastel, lalu buka peti kemenangan.

### Struktur level MVP

| Area | Tantangan | Materi | Platforming dan hadiah |
| --- | --- | --- | --- |
| 1. Hutan Fungsi | 3 soal | Nilai fungsi, substitusi positif/negatif, pengenalan fungsi | Jalur aman untuk latihan gerak; platform rendah; mesin membuka gerbang; kunci pertama. |
| 2. Gua Komposisi | 3 soal | f(g(a)), g(f(a)), perbedaan urutan | Celah dan jembatan; mesin berurutan menampilkan masukan dan hasil antara; kunci kedua. |
| 3. Kastel Matematika | 3 soal | Komposisi kuadrat dan bentuk aljabar | Platform bertingkat dan gerbang berantai; kunci ketiga. |
| Final: Harta Fungsi | 3 soal, di dalam kastel | Gabungan nilai fungsi, komposisi, dan penentuan fungsi sederhana | Ruang teka-teki aman; peti terbuka setelah seluruh tantangan selesai. |

Total: **12 soal, 3 kunci, skor maksimal 120**. Final bukan wilayah keempat yang terpisah. Setiap level memiliki geometri berbeda, bukan hanya pergantian warna. Tidak ada jalur lompatan yang dapat melewati gerbang wajib tanpa menjawab soal.

Setiap wilayah memiliki rangkaian parkour wajib: hutan dua lompatan di atas celah 350 piksel, gua tiga lompatan di atas celah 550 piksel dengan kenaikan pijakan, dan kastel tiga lompatan di atas celah 500 piksel dengan pendaratan naik–turun. Angka celah adalah panjang rangkaian yang memiliki pijakan antara, bukan jarak satu lompatan. Checkpoint berada sebelum rangkaian. Berjalan lurus atau melewatkan salah satu lompatan tidak boleh menyelesaikannya. Metadata `parkour` memudahkan pengujian; kontrol tidak melakukan auto-jump untuk pemain.

## 6. Kebutuhan gameplay

| ID | Kebutuhan MVP | Kriteria penerimaan |
| --- | --- | --- |
| GP-01 | Gerak horizontal dan gravitasi | Karakter dapat berjalan dua arah, mendarat pada platform, dan tertahan dinding/gerbang tertutup. |
| GP-02 | Lompatan responsif | Tersedia variable jump, coyote time sekitar 100 ms, dan jump buffer sekitar 120 ms; lompatan tidak berulang tanpa melepas tombol. |
| GP-03 | Kamera side-scrolling | Kamera mengikuti karakter secara horizontal dan tidak menampilkan area di luar batas dunia. |
| GP-04 | Interaksi terarah | Soal hanya dibuka saat karakter dekat objek dan pemain menekan Interaksi; tidak dibuka otomatis ketika melompat. |
| GP-05 | Checkpoint dan pemulihan | Bendera dan mesin selesai menyimpan titik aman; jatuh mengembalikan karakter tanpa menghapus skor, kunci, atau jawaban selesai. |
| GP-06 | Jalur terkunci | Gerbang/jembatan berubah setelah prasyarat selesai; level berikutnya tidak dapat diakses lebih awal. |
| GP-07 | Jeda | Dunia berhenti saat soal/menu jeda terbuka atau tab kehilangan fokus; tidak ada gerakan tombol yang tersangkut setelah kembali. |
| GP-08 | Penyelesaian | Peti hanya dapat dibuka setelah 12 soal dan tiga kunci; layar kemenangan menampilkan ringkasan serta pilihan bermain kembali. |

**Kontrol desktop:** A/D atau panah kiri/kanan untuk bergerak; Space/W/panah atas untuk melompat; E untuk interaksi; Esc untuk jeda. Saat input soal aktif, tombol ketik tidak menggerakkan karakter.

**Kontrol sentuh:** tombol kiri, kanan, Lompat, dan Interaksi; arah dan lompatan harus mendukung sentuhan simultan. Ukuran area tekan minimal 44 × 44 CSS px, tanpa menutupi soal atau informasi penting.

Platforming mendukung pembelajaran: tidak ada lompatan presisi ekstrem, kematian permanen, atau timer yang memaksa siswa terburu-buru membaca soal.

## 7. Kebutuhan materi dan sistem soal

### Capaian belajar

- Menghitung f(a) melalui substitusi yang benar.
- Menjelaskan bahwa (f ∘ g)(x) = f(g(x)), sehingga g dikerjakan dahulu.
- Membedakan urutan komposisi; komposisi pada umumnya tidak komutatif.
- Menghitung komposisi numerik dan mengenali bentuk aljabar hasil komposisi.

### Contoh acuan matematika

| Tahap | Soal | Pembahasan dan jawaban |
| --- | --- | --- |
| Dasar | f(x) = 2x + 1; tentukan f(3) | 2(3) + 1 = 7. |
| Komposisi | f(x) = 2x + 1, g(x) = x + 3; tentukan (f ∘ g)(2) | g(2) = 5, lalu f(5) = 11. |
| Lanjutan | f(x) = 3x − 2, g(x) = x² + 1; tentukan (f ∘ g)(2) | g(2) = 5, lalu f(5) = 13. |
| Aljabar | f(x) = 3x − 2, g(x) = x² + 1; tentukan (f ∘ g)(x) | 3(x² + 1) − 2 = 3x² + 1. |

Contoh di atas adalah acuan materi, bukan kewajiban mengganti bank soal repositori yang sudah ada.

### Persyaratan soal

- Setiap soal memiliki ID unik, wilayah, tujuan materi, pertanyaan, fungsi, jenis jawaban, jawaban benar, petunjuk, dan pembahasan bertahap.
- Jawaban numerik memakai input angka; bentuk aljabar memakai pilihan ganda agar MVP tidak memerlukan parser simbolik.
- Input kosong/tidak valid tidak dihitung sebagai jawaban salah; tampilkan pesan validasi.
- Jawaban salah memberikan umpan balik dan pembahasan, kemudian mengizinkan percobaan ulang.
- Jawaban benar menampilkan pembahasan sebelum pemain kembali ke dunia.
- Soal yang selesai dapat ditinjau ulang, tanpa memberikan poin atau kunci tambahan.
- Untuk komposisi, tampilkan urutan fungsi dan hasil antara, bukan jawaban akhir saja.
- Tidak menggunakan `eval` untuk memeriksa jawaban. Semua soal dan pengecoh divalidasi manual serta melalui unit test.
- Jumlah jawaban benar pada ringkasan berarti jumlah soal unik selesai, bukan jumlah pengiriman jawaban.

## 8. Arah visual: pixel art 2D

### Standar aset dan rendering target

- Perspektif samping; bukan top-down, isometrik, atau 3D.
- Tile lingkungan berbasis grid 16 × 16 piksel; sprite karakter orisinal dapat memakai canvas 32 × 32 atau 32 × 48 piksel dengan anchor kaki konsisten.
- Dunia dirender pada buffer rendah 480 × 270 dan diperbesar dengan nearest-neighbor. Koordinat physics dapat tetap 960 × 540 dengan konversi eksplisit; perubahan resolusi render tidak boleh mengubah jarak lompatan.
- Nonaktifkan image smoothing; posisi gambar dibulatkan ke piksel render untuk mengurangi shimmering.
- Utamakan skala integer saat ruang layar mencukupi; gunakan letterbox. Pada viewport kecil, skala pecahan diperbolehkan agar kontrol dan soal tetap terbaca, lalu diuji secara visual.
- Sprite memiliki pose idle, run, jump, dan fall; transisi animasi tidak mengubah collision box.
- Background berlapis/parallax ringan bersifat dekoratif, bukan permukaan collision. Efek berlebihan dan layar berkedip dihindari.
- Seluruh aset disimpan lokal. Judul memakai logo pixel vektor orisinal; font sistem lokal dipakai untuk UI tanpa unduhan. Teks matematika dan pembahasan harus jelas dan mendukung simbol ∘, −, dan ².

### Identitas wilayah

| Wilayah | Arah visual |
| --- | --- |
| Hutan | Tanah bertile, rumput hijau, pepohonan pixel, langit dan bukit berlapis. |
| Gua | Batu gelap, kristal biru/ungu, mesin fungsi bercahaya, jembatan yang dapat aktif. |
| Kastel | Bata abu-abu, aksen biru tua, pintu emas, bendera, serta ruang harta. |

Palet dasar: biru tua untuk panel, hijau untuk hutan, emas untuk hadiah, putih terang untuk teks, dan abu-abu untuk objek terkunci. Status tidak boleh disampaikan lewat warna saja; sertakan ikon dan label. Pertahankan kontras teks normal minimal 4,5:1.

Aset karakter sumber berasal dari gambar pengguna dengan pose terbatas. Runtime memakai sprite pixel orisinal yang mempertahankan kepala gundul, zirah gelap, bros perak, jubah merah, dan sepatu berat. Animasi ditulis terpisah untuk idle, walk, run, jump, fall, land, dan victory; bukan sekadar tujuh pose sumber. Adaptasi menjaga sumber asli dan hak penggunaan; jangan menimpa aset asli secara destruktif.

## 9. Layar dan antarmuka

1. **Menu utama:** judul, Mulai, Lanjutkan jika save valid, Petunjuk, dan Tentang Game.
2. **Area permainan:** Canvas, HUD skor/kunci/wilayah, progres soal, tombol jeda, serta kontrol sentuh bila diperlukan.
3. **Panel soal:** judul tantangan, fungsi, pertanyaan, input/pilihan, Periksa, Petunjuk, umpan balik, pembahasan, dan Kembali. Gunakan elemen DOM, bukan teks kecil di Canvas.
4. **Hasil wilayah:** jumlah soal selesai, skor, kunci didapat, dan Lanjutkan. Boleh berupa dialog, tidak harus halaman baru.
5. **Kemenangan:** pesan selesai, skor akhir, 12 soal unik selesai, tiga kunci, dan Main Lagi.
6. **Jeda/pengaturan:** Lanjutkan, Petunjuk, kembali ke menu, dan reset progres dengan konfirmasi.

Fokus keyboard masuk ke dialog saat dibuka dan kembali ke pemicu setelah ditutup. Menu, input, dan tombol dapat digunakan dengan keyboard. Game Canvas tetap memerlukan navigasi visual; jangan mengklaim seluruh gameplay dapat diakses pembaca layar.

## 10. Progres, penyimpanan, dan aturan skor

- Jawaban benar pertama untuk setiap soal memberikan 10 poin; salah atau meninjau ulang memberikan 0 poin.
- Tidak ada bonus waktu atau koin bernilai skor dalam MVP, sehingga maksimum tetap 120.
- Tersedia 55 koin eksplorasi opsional dengan tiga kantong rahasia. Jumlah koin terpisah dari skor matematika dan tidak menjadi syarat tamat. Save v1 lama tanpa `collected` dipulihkan dengan daftar koleksi kosong, tanpa mengubah progres belajar.
- Setiap tiga soal utama wilayah memberikan satu kunci, maksimum tiga. Tantangan akhir tidak memberikan kunci keempat.
- Simpan soal selesai, kunci, wilayah/fase, checkpoint aman, status kemenangan, dan versi skema melalui localStorage.
- Skor dan akses wilayah harus konsisten dengan soal selesai; save tidak boleh membuka level lewat data yang tidak sah.
- Save tidak menyimpan posisi saat melayang atau velocity.
- Save korup/versi tidak didukung menampilkan pemberitahuan dan jalur mulai baru; jangan membuat aplikasi berhenti.
- Jika storage tidak tersedia, permainan tetap berjalan dalam sesi aktif dengan peringatan bahwa progres tidak tersimpan.
- localStorage terikat browser dan origin; tidak ada sinkronisasi antarperangkat atau jaminan antimanipulasi.
- Reset membutuhkan konfirmasi. Pembatalan tidak mengubah progres.
- Namespace saat ini `gundul-warrior-v1` tidak boleh diganti atau dihapus hanya karena nama produk pada PRD berubah. Migrasi save memerlukan rancangan dan pengujian terpisah.

## 11. Teknologi dan kebutuhan nonfungsional

**Stack:** HTML, CSS, JavaScript ES modules, Canvas 2D, DOM untuk UI, serta localStorage. Pertahankan pemisahan engine, physics, input, renderer, data level/soal, UI, dan state yang sudah tersedia; tidak perlu menambah framework atau backend.

- Simulasi fixed-step 1/60 detik; rendering memakai requestAnimationFrame dan tidak mengubah kecepatan physics pada refresh rate berbeda.
- Target 60 fps pada laptop sekolah yang disepakati saat pengujian. Catat perangkat, browser, dan hasil; jangan menyatakan target tercapai tanpa pengukuran.
- Uji desktop pada Chromium/Edge dan Firefox, serta kontrol sentuh pada Android Chrome. Dukungan browser lain perlu diverifikasi sebelum dijanjikan.
- Target viewport UI mulai lebar 360 CSS px; soal dapat digulir bila perlu dan tidak bergantung pada orientasi landscape.
- Semua dependensi runtime berupa berkas lokal; tidak ada CDN, akun, atau pengiriman data siswa.
- ES modules memerlukan HTTP server lokal atau hosting statis, bukan membuka `index.html` melalui `file://`.
- Bermain tanpa internet didukung ketika berkas disajikan server lokal. Offline setelah mengunjungi hosting belum dijanjikan tanpa service worker/cache yang diuji.
- Kegagalan memuat aset menampilkan pesan dan pilihan mencoba ulang, bukan layar kosong.

## 12. Kriteria selesai dan pengujian

MVP dinyatakan memenuhi PRD setelah seluruh skenario berikut lulus dan temuan kritis ditutup:

1. Permainan baru dapat diselesaikan dari hutan hingga peti dengan 12 soal, tiga kunci, dan skor 120.
2. Jawaban salah, input kosong, dan pengulangan soal tidak memberi poin atau membuka gerbang secara keliru.
3. Urutan fungsi dan pembahasan semua soal benar menurut pemeriksaan manual dan unit test.
4. Gerbang wajib tidak dapat dilewati melalui lompatan, collision, reload, atau manipulasi urutan interaksi biasa.
5. Jatuh dan reload mengembalikan checkpoint aman tanpa kehilangan progres yang sudah disimpan.
6. Jeda, dialog soal, dan kehilangan fokus menghentikan simulasi; kontrol tidak tersangkut setelah dilanjutkan.
7. Keyboard serta sentuhan arah dan lompat simultan bekerja; dialog dapat dioperasikan dengan keyboard.
8. Save rusak, storage ditolak, dan aset gagal dimuat memiliki pemulihan yang dapat digunakan.
9. Pixel art tetap tajam pada skala integer; tampilan kecil tidak memotong soal, HUD, atau kontrol penting.
10. Reset memerlukan konfirmasi, pembatalan mempertahankan save, dan Main Lagi memulai progres baru sesuai konfirmasi.

**Metode:** unit test matematika/state/physics, pengujian browser alur penuh, review visual pada beberapa viewport, playtest keyboard dan sentuh pada perangkat nyata, serta validasi materi oleh guru.

**Indikator evaluasi awal:** sedikitnya 4 dari 5 siswa uji dapat bergerak, melompat, dan membuka soal pertama tanpa bantuan setelah membaca petunjuk; sedikitnya 4 dari 5 dapat menjelaskan fungsi mana yang dikerjakan dahulu pada contoh f(g(x)) setelah sesi. Ini target evaluasi formatif, bukan hasil penelitian atau klaim efektivitas.

## 13. Tahapan pengembangan dan atomic commit

Perubahan implementasi berikutnya dibagi berdasarkan satu tujuan yang dapat ditinjau dan diuji secara mandiri:

| Urutan | Lingkup | Contoh commit |
| --- | --- | --- |
| 1 | Tetapkan kebutuhan produk | `docs(prd): define pixel platformer product requirements` |
| 2 | Hubungkan dokumentasi utama | `docs(readme): link Function Adventure PRD` |
| 3 | Fondasi render pixel tanpa mengubah physics | `feat(renderer): add low-resolution pixel rendering` |
| 4 | Aset pixel orisinal dan metadata lisensi | `feat(assets): add original pixel environment tiles` |
| 5 | Sprite dan animasi karakter | `feat(character): add pixel movement animations` |
| 6 | Penyelarasan level dan mesin pembelajaran | `feat(levels): align platform routes with math gates` |
| 7 | Penyempurnaan UI dan aksesibilitas | `feat(ui): improve question dialog and touch controls` |

Urutan 3–7 merupakan rencana, bukan pekerjaan yang sudah dilaksanakan. Tambahkan/perbaiki tes bersama perubahan perilaku terkait. Jangan memisahkan tes sehingga commit fitur sengaja gagal. Jangan menggabungkan rename produk, migrasi save, penggantian aset, dan perubahan physics ke satu commit besar. Setiap commit harus memiliki satu tujuan, diff yang relevan, dan pemeriksaan sesuai lingkupnya.

## 14. Risiko dan pengembangan lanjutan

| Risiko | Mitigasi |
| --- | --- |
| Platforming mengalahkan fokus belajar | Jalur mudah, checkpoint dekat mesin, tanpa timer soal atau nyawa. |
| Materi/validator salah | Pemeriksaan guru, jawaban eksplisit, unit test setiap soal. |
| Pixel art tidak konsisten dengan aset lama | Audit aset, buat turunan terpisah, tetapkan grid dan anchor; simpan sumber asli. |
| Perubahan render merusak lompatan/collision | Pisahkan koordinat simulasi dan render; jalankan tes physics dan perjalanan penuh. |
| Rebranding menghapus progres | Jangan ubah namespace otomatis; siapkan migrasi berversi jika disetujui. |
| Kesulitan berbeda antar siswa | Materi bertahap, petunjuk, pembahasan, dan percobaan tanpa penalti. |

Musik chiptune orisinal tiga wilayah dan efek suara lokal termasuk lingkup saat ini, dengan mute/volume terpisah dari save belajar dan aktivasi setelah interaksi pengguna. Setelah versi ini stabil: mode latihan, karakter tambahan, wilayah baru, ringkasan kesalahan belajar, dan pengujian offline cache. Leaderboard daring, nyawa, atau batas waktu memerlukan evaluasi tujuan belajar dan spesifikasi terpisah sebelum ditambahkan.
