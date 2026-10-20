# Function Adventure

Game petualangan edukasi untuk siswa SMA/SMK yang mempelajari fungsi dan komposisi fungsi. Dibangun dengan HTML, CSS, dan JavaScript tanpa framework, backend, atau aset eksternal.

## Menjalankan

Memerlukan Node.js 20 atau lebih baru. Tidak perlu menginstal dependensi.

```sh
npm start
```

Buka http://localhost:4173. Hentikan server dengan `Ctrl+C`.

Jangan membuka `index.html` langsung melalui `file://`, karena aplikasi menggunakan ES modules. Server bawaan hanya untuk pengembangan lokal dan tidak untuk deployment publik.

## Pengujian

```sh
npm test
```

Pengujian otomatis mencakup ketepatan soal, validasi jawaban, skor tanpa duplikasi, jalur wajib melewati gerbang, dan validasi penyimpanan.

## Cara bermain

1. Pilih **Mulai petualangan**.
2. Bergerak menggunakan WASD, tombol panah, atau tombol arah di layar.
3. Dekati gerbang bernomor dan tekan E, Enter, atau **Interaksi**.
4. Selesaikan soal untuk membuka gerbang. Pelajari petunjuk dan pembahasan jika kesulitan.
5. Dekati peti di ujung jalur dan berinteraksi setelah tiga gerbang terbuka.
6. Kumpulkan tiga kunci dan selesaikan Harta Fungsi untuk menang.

Jawaban benar memberikan 10 poin sekali per soal. Jawaban salah tidak mengurangi poin. Tidak ada batas waktu atau nyawa. Total 12 soal dengan skor maksimal 120.

## Wilayah

| Wilayah | Materi |
| --- | --- |
| Hutan Fungsi | Substitusi dan pengenalan fungsi |
| Gua Komposisi | Komposisi numerik dan urutan fungsi |
| Kastel Matematika | Komposisi kuadrat dan bentuk aljabar |
| Harta Fungsi | Tantangan akhir gabungan |

## Fitur MVP

- Menu utama, petunjuk, dan informasi game.
- Peta grid dengan gerakan, tembok, gerbang, dan peti.
- Input numerik dan pilihan ganda aljabar.
- Petunjuk dan pembahasan setelah menjawab.
- Skor, kunci, hasil wilayah, dan kemenangan.
- Statistik benar percobaan pertama dan percobaan salah.
- Simpan otomatis dan lanjutkan menggunakan localStorage.
- Konfirmasi sebelum mengganti progres dengan permainan baru.
- Kontrol sentuh, fokus keyboard, dialog native, dan tampilan responsif.

## Struktur

```text
index.html                Struktur antarmuka
css/style.css             Desain, ilustrasi CSS, dan responsivitas
js/main.js                Antarmuka, kontrol, soal, dan perpindahan level
js/state.js               Status, aturan progres, dan validasi
js/storage.js             Simpan dan muat progres
js/data/levels.js         Peta dan metadata wilayah
js/data/questions.js      Bank soal dan pemeriksaan jawaban
tests/                    Pengujian otomatis Node.js
server.js                 Server pengembangan lokal
```

Logika antarmuka, gerakan, dan progres masih digabungkan dalam `main.js` untuk MVP. Pisahkan menjadi modul tambahan ketika kebutuhan berkembang.

## Penyimpanan dan batasan

- Progres hanya tersedia pada browser dan origin yang sama. Menghapus data browser juga menghapus progres.
- Penyimpanan browser yang ditolak tidak menghentikan permainan, tetapi progres tidak dapat dipertahankan.
- localStorage bukan sistem penyimpanan antimanipulasi dan tidak cocok untuk leaderboard terpercaya.
- Empat wilayah menggunakan susunan jalur sama dengan tema berbeda. Variasi geometri peta menjadi pengembangan berikutnya.
- Aplikasi tidak mengirim data pemain ke API. Server lokal memungkinkan bermain tanpa internet selama Node.js tersedia.
- Hosting tidak otomatis dapat dibuka ulang secara offline; service worker belum ditambahkan.
- Efek suara, akun, leaderboard, dan laporan guru belum tersedia.
- Semua ilustrasi dan objek permainan dibuat melalui CSS dan simbol teks, tanpa aset pihak ketiga.

## Hosting statis

Unggah `index.html`, folder `css/`, dan folder `js/` ke layanan hosting statis. GitHub Pages dapat menggunakan branch `main`, folder root. Pengaturan Pages belum diaktifkan oleh proyek ini.

## Pemeriksaan manual sebelum rilis

- Uji mulai baru, pembatalan reset, dan lanjutkan pada browser yang sama.
- Pastikan tembok serta gerbang terkunci tidak dapat dilewati.
- Uji angka kosong, jawaban salah, pilihan ganda, petunjuk, dan pembahasan.
- Pastikan satu soal tidak memberikan hadiah dua kali.
- Muat ulang setelah menjawab, mendapatkan kunci, dan berpindah wilayah.
- Selesaikan seluruh wilayah dan verifikasi skor serta statistik akhir.
- Uji keyboard, tombol sentuh, dialog, dan layar kecil.
- Minta guru memvalidasi materi serta siswa mencoba alur pembelajaran.

Validasi pengembangan: 14 pengujian Node.js lulus; uji browser otomatis melalui Microsoft Edge headless berhasil menyelesaikan 12 soal, reload/lanjutkan, kemenangan, pembatalan reset, dan pemeriksaan overflow pada lebar 390 piksel. Pengujian langsung pada perangkat sentuh serta validasi guru masih diperlukan.
