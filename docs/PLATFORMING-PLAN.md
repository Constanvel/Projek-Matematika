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

- Empat rangkaian hutan/gua dan tujuh rangkaian kastel, total 12/16/24 lompatan (sebelumnya satu per wilayah, 2/3/3 lompatan). Lebar dunia bertambah menjadi 5.500/6.300/8.900.
- Setiap rangkaian memiliki checkpoint aman sebelum celah, tidak memotong spawn lama, gerbang, atau jembatan matematika.
- Berjalan saja dan melewatkan satu lompatan gagal; jalur benar berhasil memakai physics asli dengan toleransi keterlambatan peluncuran hingga 15 piksel.
- Tujuan lompatan terlihat dari area lepas landas; tidak perlu lompatan buta, timing satu frame, atau perubahan physics untuk bot.
- Semua 55 ID koleksi tetap stabil dan bisa dijangkau; koleksi tidak menjadi syarat belajar atau tamat.
- Jatuh tidak menghapus jawaban, skor, kunci, atau koleksi; save lama tetap valid.
- Keyboard dapat mencapai seluruh 12 soal dan kemenangan; kontrol sentuh, jeda, reload, dan dialog tidak regresi.

## Verifikasi

`npm test`, `npm run test:browser`, `git diff --check`; inspeksi screenshot desktop dan portrait. Tes otomatis membuktikan keterjangkauan dan kompatibilitas, bukan bahwa semua pemain akan merasa seru. Kenyamanan dan tingkat kesulitan pada perangkat sentuh nyata tetap memerlukan playtest manusia.

## Perluasan permintaan selama implementasi

- Tiap wilayah harus memiliki gimmick mekanis, bukan hanya warna atau template geometri: akar pegas hutan (lompat manual lebih tinggi), es gua (momentum dan pengereman), serta batu retak kastel (runtuh setelah peringatan lalu pulih).
- Gimmick diperkenalkan di atas lantai aman, lalu diterapkan dalam rangkaian lanjut. Kontrol pemain tetap langsung; pegas tidak melompat otomatis.
- Durasi ditambah melalui bagian akhir baru dan checkpoint istirahat, bukan memperlebar jalan kosong. Target minimal empat rangkaian per wilayah; exit dan lebar dunia boleh bergeser, posisi checkpoint dan gerbang lama tidak.
- Panel alur fungsi besar di medan dihapus. Detail tetap di dialog. Penanda mesin hanya muncul saat dekat; blok tanda tanya dan panel melayang dihapus; teks papan dipindahkan ke petunjuk CSS 12px, tidak ikut membesar bersama Canvas. HUD ringkas dan petunjuk bawah tidak terlihat ketika tidak relevan.
- Tes tambahan membuktikan efek permukaan, runtuh/pulih/jeda, pemulihan seluruh checkpoint baru, dan footprint HUD desktop/portrait.
- Dither hitam bawah layar dihapus. Semua tema memiliki scenery kedalaman sampai tepi bawah: akar/batu, kristal/dinding gua, fondasi/lengkungan kastel. Perbaikan kedua memperpanjang siluet pohon/gunung/dinding hingga melewati viewport, menghilangkan baseline datar y438/480/490, dan memulai detail kedalaman di belakang lantai, bukan hanya 40px terakhir. Dinding belakang gua diberi bidang batu bersegi untuk menghilangkan pita polos di antara stalaktit dan kristal. Tes piksel memeriksa empat pita tinggi di 12 posisi kamera, bukan sekadar jumlah warna pada dasar jurang.

## Hasil implementasi

- Hutan: lebar 3.400 menjadi 5.500; empat rangkaian, 12 lompatan wajib. Finale akar pegas naik ke mahkota lalu turun–naik.
- Gua: lebar 3.700 menjadi 6.300; empat rangkaian, 16 lompatan wajib. Finale dua rute lima lompatan dengan kristal licin dan variasi elevasi.
- Kastel: lebar 5.700 menjadi 8.900; tujuh rangkaian, 24 lompatan wajib. Tiga bagian tengah baru antara q9–q12 memakai pendaratan y370/y330/y410 dan ritme berbeda; finale dua rute enam lompatan di batu retak. Treasure x3140, core x4500, dan semua checkpoint mesin tetap aman.
- Total 52 lompatan wajib dibanding delapan sebelumnya. Checkpoint sebelum setiap rangkaian dan area pulih di antaranya.
- 55 ID koleksi, seluruh posisi checkpoint lama, gerbang, soal, dan skor dipertahankan. Exit bergeser ke ujung perluasan.
- Health tiga poin, kehilangan satu saat jatuh dan pulih saat habis; progres belajar tidak terhapus. Leaderboard lokal sepuluh hasil, urutan skor/jatuh/waktu aktif; form nama opsional pada kemenangan. Run/leaderboard terpisah dari save belajar.
- `npm test`: 86 lulus, termasuk regresi checkpoint gua; mencakup jalur melalui engine dinamis pada keterlambatan peluncuran 0/5/10/15px, kebutuhan setiap lompatan, serta efek permukaan.
- Tes kedalaman terbaru lulus pada 12 posisi kamera × empat pita tinggi. Galeri enam tampilan gameplay hutan/gua/kastel diinspeksi; siluet lama tidak lagi berhenti pada garis datar dan detail berlanjut hingga bawah.
- Screenshot HUD desktop/portrait, seluruh checkpoint parkour, serta galeri lima state permukaan diinspeksi. Tidak ada panel alur besar atau bidang polos bawah; batas platform tetap terbaca.
- Putaran browser awal menemukan kegagalan traversal finale hutan dan pemilihan checkpoint gua; investigasi runtime dilanjutkan, bukan melonggarkan geometri atau physics. Verifikasi akhir dicatat setelah selesai.
- Tes browser terfokus health/leaderboard/HUD/rendering: lima lulus, termasuk tiga jatuh, health habis, reload, waktu jeda, nama aman, urutan peringkat, kegagalan tulis storage, dan pencegahan simpan ganda. Putaran regresi lebih luas: 13 lulus, satu timeout keseluruhan pada reload. Uji ulang kasus yang sama secara terpisah lulus (14,7 detik), tanpa perubahan kode atau pelonggaran timeout. Screenshot leaderboard desktop/portrait dan HUD tanpa blok tanda tanya diinspeksi.
