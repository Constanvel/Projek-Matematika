# Rencana keterbacaan dunia dan parkour

## Tujuan dan batasan

Papan tidak saling menutup, bendera tidak menutup teks, dan pijakan tetap terbaca. Tantangan meningkat tanpa mengubah kontrol, identitas Gundul, soal, skor maksimum 120, tiga kunci, atau namespace save `gundul-warrior-v1`. Tidak memakai aset, musik, atau salinan level Mario.

## Pelajaran dari referensi

- [Game Maker's Toolkit: Super Mario 3D World's 4 Step Level Design](https://www.youtube.com/watch?v=dBmIkEvEBtA): pengenalan aman, pengembangan, variasi, penutup. Ini analisis desain, bukan spesifikasi physics yang disalin.
- [Koichi Hayashida tentang struktur level, dilaporkan Nintendo Life](https://www.nintendolife.com/news/2012/04/super_mario_3d_land_director_shares_level_design_inspirations): satu gagasan jelas dikembangkan sebelum diberi perubahan. Kutipan diperoleh melalui hasil pencarian; halaman langsung menolak akses (403).
- [Nintendo, Iwata Asks: An Instinctively Good Feeling](https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Super-Mario-3D-World/Super-Mario-3D-World/3-An-Instinctively-Good-Feeling-/3-An-Instinctively-Good-Feeling--829583.html): kamera yang jelas, bahaya terbaca, dan tantangan koleksi tambahan bagi pemain mahir. Halaman dibaca langsung.

Penerapan lokal: tangga awal tetap aman; rangkaian wajib berirama memiliki checkpoint; variasi ketinggian dan ukuran pendaratan muncul bertahap; koleksi rahasia tetap opsional. Tidak menambahkan musuh, platform bergerak, atau timer sebagai kejutan baru dalam pembaruan ini.

## Tahapan atomic commit

1. **docs(plan)**: simpan alasan desain, sumber, batasan, dan penerimaan sebelum implementasi.
2. **fix(renderer)**: satu perencana layout murni untuk papan dan label checkpoint; reservasi area bendera, mesin, badan pemain, dan pijakan; jarak minimal 12 piksel dunia; gabungkan tampilan bendera yang berdekatan tanpa menghapus checkpoint save; kandidat posisi deterministik dan sembunyikan label sekunder bila ruang tidak cukup. Tes layout mencakup semua wilayah dan posisi kamera/pemain, termasuk klaster sebelum parkour.
3. **feat(levels)**: tambah rangkaian wajib lanjutan setelah pemain berlatih, bukan hanya mempersempit satu pijakan. Hutan mengajarkan ritme, gua mengembangkan kenaikan, kastel menguji naik–turun dan pendaratan presisi. Area aman memisahkan rangkaian dan mesin. Metadata route, checkpoint, koleksi, tes physics, serta helper browser harus konsisten dalam commit yang sama.
4. **test/docs**: jalankan unit test dan browser penuh; ambil dan inspeksi tangkapan semua wilayah, parkour, dialog, serta kemenangan; catat hasil dan geometri akhir. Tidak push.

## Kriteria penerimaan

### Keterbacaan

- Persegi panel yang terlihat tidak bertumpang tindih; bendera/label checkpoint tidak melewati panel.
- Panel tidak menutup badan pemain, mesin, atau permukaan pendaratan. Prompt interaksi mendapat prioritas di atas petunjuk sekunder.
- Tidak ada dua bendera visual dalam klaster rapat; ID dan posisi checkpoint asli tetap tersedia untuk save lama.
- Layout deterministik, berada di dalam viewport, dan tidak berpindah acak setiap frame.
- Font pixel, nearest-neighbor 480×270, serta viewport 960×540 dunia tetap dipertahankan.

### Tantangan adil

- Lebih banyak rangkaian wajib daripada versi awal (sebelumnya satu per wilayah, 2/3/3 lompatan).
- Setiap rangkaian memiliki checkpoint aman sebelum celah, tidak memotong spawn lama, gerbang, atau jembatan matematika.
- Berjalan saja dan melewatkan satu lompatan gagal; jalur benar berhasil memakai physics asli dengan toleransi keterlambatan peluncuran hingga 15 piksel.
- Tujuan lompatan terlihat dari area lepas landas; tidak perlu lompatan buta, timing satu frame, atau perubahan physics untuk bot.
- Semua 55 ID koleksi tetap stabil dan bisa dijangkau; koleksi tidak menjadi syarat belajar atau tamat.
- Jatuh tidak menghapus jawaban, skor, kunci, atau koleksi; save lama tetap valid.
- Keyboard dapat mencapai seluruh 12 soal dan kemenangan; kontrol sentuh, jeda, reload, dan dialog tidak regresi.

## Verifikasi

`npm test`, `npm run test:browser`, `git diff --check`; inspeksi screenshot desktop dan portrait. Tes otomatis membuktikan keterjangkauan dan kompatibilitas, bukan bahwa semua pemain akan merasa seru. Kenyamanan dan tingkat kesulitan pada perangkat sentuh nyata tetap memerlukan playtest manusia.

## Hasil implementasi

Diisi setelah verifikasi akhir.
