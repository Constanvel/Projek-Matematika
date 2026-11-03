# Ikon unduhan dan keterlihatan mekanik

Tindak lanjut 3 November 2026: pengguna meminta ikon dari folder unduhan dipakai
langsung. Sebelumnya UI memakai medali dan speaker SVG orisinal. Kini 13 sprite
turunan dari PNG pengguna digunakan untuk hati penuh/kosong, medali, speaker,
mute, mulai/lanjut, pengaturan, kembali, leaderboard, musik, dan menu utama.

Pembaruan berikutnya menambahkan Game Over pada 0 health. Pemulihan tiga hati
kini memerlukan pilihan Coba lagi dari checkpoint; lihat aturan terbaru di README.

## Sumber dan pengolahan

| Keluaran di `assets/ui/` | Sumber ZIP dan PNG |
| --- | --- |
| `heart-full.png`, `heart-empty.png` | `Nyawa/IMG_7688.zip` → `IMG_7688.png` |
| `gold.png`, `silver.png`, `bronze.png` | `aset leaderboard dll.zip` → `medali emas.png`, `medali perak.png`, `medali perunggu.png` |
| `play.png`, `settings.png`, `back.png` | `tombol dll/IMG_7709.zip` → `IMG_7709.png`, `IMG_7710.png`, `IMG_7712.png` |
| `speaker.png`, `muted.png` | `tombol dll/IMG_7715.zip` → `IMG_7716.png`, `IMG_7717.png` |
| `leaderboard.png`, `music.png`, `home.png` | `tombol dll/IMG_7715.zip` → `IMG_7714.png`, `IMG_7713.png`, `IMG_7715.png` |

Ikon dipotong dari tombol tanpa menyalin tulisan Inggris yang sudah menyatu
dengan gambar. Label bahasa Indonesia tetap berupa teks HTML. Transparansi
dibersihkan, warna dibatasi menjadi 24 per sprite, dan skala memakai
nearest-neighbor. Hati berukuran 16×16; ikon lain 32×32 dan ditampilkan pada
ukuran 32 atau 16 piksel. Outline hati kosong diterangkan agar terlihat di HUD.
Ketiga medali tetap disertai angka peringkat HTML.

`assets/ui/manifest.json` mencatat nama arsip, nama PNG, batas crop, ukuran,
hash sumber, serta hash hasil. Skrip persiapan tidak mengubah arsip pengguna:

```powershell
python scripts/prepare-ui-icons.py --source-root "C:/Users/IDEAPAD SLIM 3/Downloads/drive-download-20261102T233054Z-1-001"
```

Skrip memerlukan Pillow dan hanya membaca PNG bernama eksplisit. Build Vercel
menyalin sprite hasilnya; Pillow dan ZIP sumber tidak dibutuhkan saat build.

Tidak ditemukan LICENSE, README lisensi, atau identitas pembuat dalam ZIP ini.
Status sumber tetap `unverified-user-supplied`, bukan klaim domain publik atau
izin penggunaan komersial. Permintaan pengguna memilih aset dicatat terpisah
dari bukti lisensi yang belum tersedia. Gambar latar, platform, portal, dan
rekaman suara unduhan tidak dimasukkan dalam perubahan ini.

## Mekanik yang dibuat lebih terlihat

- Tiga hati penuh/kosong mengikuti nyawa aktual, termasuk jatuh, reload, dan
  pemulihan tiga nyawa ketika habis. Angka serta label aksesibilitas tetap ada.
- Menu jeda menyediakan Cara bermain. Panduan menjelaskan akar pegas, es licin,
  batu retak, lompat, interaksi, checkpoint, kunci, koin, dan leaderboard.
- Panduan menjeda dunia dan mengembalikan fokus ke permainan saat ditutup.
- Jika ikon gagal dimuat, teks tombol dan angka nyawa tetap dapat dipakai;
  kegagalan hiasan tidak menggagalkan pemuatan atlas karakter.

Tidak ada perubahan pada physics, collision, geometri level, soal, skor,
perolehan kunci, atau format save. Tombol Quit dari ZIP tidak dipakai karena
game web memakai Menu utama; tidak ada tombol hiasan tanpa tujuan.

## Verifikasi

- `npm test`: 88 tes unit lulus.
- Seluruh 22 tes browser lulus pada folder build statis, termasuk perjalanan
  12 soal hingga tamat, mekanik permukaan, checkpoint, reload, sentuhan,
  kesehatan, serta keamanan nama di leaderboard.
- Tes nyawa memeriksa tiga hati, pengurangan ketika jatuh, hati kosong,
  pemulihan setelah habis, dan pemuatan ulang dengan satu nyawa.
- Ikon tombol/medali benar-benar dimuat. Mute mengikuti preferensi tersimpan.
  Pemblokiran semua ikon UI tidak menghalangi permainan atau pengaturan.
- Panduan dari menu jeda tetap menjeda dunia dan mengembalikan kontrol gerak.
- Pemeriksaan visual desktop 1366×768, portrait 390×844 dan 320×568, serta
  landscape 740×360 tidak menunjukkan overflow horizontal pada menu/dialog.
- Seluruh 13 sprite mempunyai alpha biner, paling banyak 24 warna opak,
  hash yang sesuai manifest, dan salinan build yang identik.
- Diff memastikan karakter, renderer dunia, engine, physics, geometri, soal,
  state, storage, serta aturan run/leaderboard tidak berubah.

Pengujian ponsel memakai simulasi browser, bukan perangkat fisik.
