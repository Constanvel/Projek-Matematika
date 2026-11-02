# Polesan visual dan audio — 3 November 2026

Implementasi mengikuti audit aset yang disetujui pengguna. Sasaran: lingkungan
lebih beragam, UI kecil lebih jelas, dan musik kurang repetitif, dengan identitas
Gundul serta aturan permainan tetap sama.

## Batas perubahan

- Renderer tetap 480×270, nearest-neighbor, pada koordinat dunia 960×540.
- Tidak mengubah karakter, physics, collision, geometri level, soal, checkpoint,
  skor, health, leaderboard, maupun format progres belajar.
- Background tetap berlapis, tersambung, dan mengisi jurang hingga bawah layar.
- Dekorasi tidak menjadi pijakan semu dan tidak menutupi tanda spring/ice/crumble.
- Tidak memasang PNG atau audio unduhan yang lisensinya belum terverifikasi.

## Urutan commit

1. Lingkungan: variasi kanopi hutan, air terjun jauh di gua, arsitektur kastel,
   serta detail permukaan di dalam batas terrain lama.
2. UI: medali tiga peringkat dan ikon speaker aktif/mute yang dibuat orisinal;
   teks, fokus keyboard, ukuran sentuh, dan seluruh kolom leaderboard tetap DOM.
3. Audio: frasa musik bergantian dan volume musik/efek terpisah; preferensi lama
   tetap diterima dan mute/jeda tetap bekerja.
4. Verifikasi dan dokumentasi hasil: tes unit, perjalanan browser, background,
   permukaan khusus, UI desktop/portrait, dan kompatibilitas penyimpanan.

## Asal aset

Semua bentuk baru digambar langsung menggunakan Canvas/SVG dengan grid yang sama
seperti game. Musik baru berupa susunan nada lokal, tanpa sampel atau rekaman
eksternal. Paket unduhan hanya diperiksa sebagai referensi kategori suasana;
gambar, potongan gambar, melodi, dan rekamannya tidak disalin ke runtime.

Paket yang belum memiliki bukti lisensi: `mtk 1.zip`, `aset leaderboard dll.zip`,
`portal, map 45.zip`, `Nyawa/IMG_7688.zip`, dua ZIP di `tombol dll/`, serta
`sound 1.mpeg` sampai `sound 6.mpeg`. Bukti sumber dan izin masih diperlukan
sebelum salah satunya dapat dimasukkan ke build.

Desain sumber Gundul tetap mengikuti aset pengguna yang tercatat dalam
`assets/character/manifest.json`; dokumen ini tidak mengubah status hak sumbernya.

## Pemeriksaan

Baseline sebelum perubahan: 86 tes unit lulus. Hasil akhir dan batas pemeriksaan
ditambahkan setelah implementasi selesai.
