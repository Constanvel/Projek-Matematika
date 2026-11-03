# Polesan visual dan audio — 3 November 2026

Catatan ini merekam polesan awal. Tindak lanjut pengguna memakai ikon dari ZIP
dicatat dalam [Ikon unduhan dan keterlihatan mekanik](UI-ASSETS.md); ikon UI
runtime kini mengikuti dokumen tersebut. Status lisensi sumber tetap belum
terverifikasi. Batas dan hasil uji di bawah adalah kondisi polesan awal.

Implementasi mengikuti audit aset yang disetujui pengguna. Sasaran: lingkungan
lebih beragam, UI kecil lebih jelas, dan musik kurang repetitif, dengan identitas
Gundul serta aturan permainan tetap sama.

## Batas perubahan

- Renderer tetap 480×270, nearest-neighbor, pada koordinat dunia 960×540.
- Tidak mengubah karakter, physics, collision, geometri level, soal, checkpoint,
  aturan skor/health/leaderboard, maupun format progres belajar.
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

Baseline sebelum perubahan: 86 tes unit lulus.

Hasil akhir pada Edge desktop, 3 November 2026:

- `npm test`: 88 tes lulus, tanpa kegagalan.
- `node node_modules/@playwright/test/cli.js test`: 20 tes browser lulus
  dalam sekitar 2,5 menit, termasuk perjalanan keyboard melewati seluruh
  12 soal hingga kemenangan, reload, save, jatuh, health dan leaderboard.
- Background diperiksa pada awal, tengah dan ujung kamera ketiga wilayah;
  scenery jurang berlanjut hingga bawah. Spring, ice dan crumble tetap berbeda.
- Ikon medali tidak mengubah teks rank/nama/kolom. Ikon speaker mengikuti
  preferensi mute; checkbox tetap dapat dioperasikan dengan keyboard.
- Volume utama/musik/efek tersimpan tanpa mengubah progres belajar. Preferensi
  audio lama dipulihkan dengan dua kanal tambahan bernilai 1. Pengujian memakai
  gain Web Audio nyata untuk pause, resume, mute dan perubahan tema.
- Tampilan diperiksa pada desktop dan portrait. Reviewer independen juga
  memeriksa lebar 320/360/390 px dan penggunaan panah keyboard pada slider.
- Diff terhadap baseline memastikan sumber karakter, physics, engine, geometri
  level, soal, state, storage dan aturan run/leaderboard tidak berubah.
- Review independen terhadap tiga commit fitur tidak menemukan bug konkret
  atau risiko material. `git diff --check` bersih.

Tes fitur baru diperiksa gagal sebelum implementasi, kemudian lulus. Pembacaan
gain memakai toleransi float dan menunggu jam audio; bus dijaga aktif selama
pengujian agar optimasi bus senyap tidak menghasilkan nilai parameter yang basi.

Belum diuji: kenyamanan musik lewat speaker/headphone, performa pada HP fisik,
Safari, Firefox, atau deployment publik. Tes audio memeriksa perilaku kanal,
bukan penilaian artistik atau pengukuran keluaran bunyi di perangkat fisik.
