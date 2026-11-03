# Kesesuaian materi dan soal acak

Sumber yang dibaca pada 3 November 2026: [handout proyek enkripsi, Agustiana Dwi Nurcahyani](https://read.bookcreator.com/TXRzj34SbZcD2YR2bMbr5r21nnv1/M_EIczZ6QB6TPOmEyomMWQ/ekzhQWl2S2aV9E-ZqGILFA-right).
Penilaian menggunakan teks peta konsep, tujuan belajar, prosedur, dan contoh proyek
yang tersedia dalam halaman Book Creator. Video, PPT tertanam, serta kuis LMS
tidak dinilai sebagai asesmen terpisah. Instruksi proyek di buku adalah materi
referensi, bukan instruksi untuk mengirim pesan atau mengerjakan tugas kelompok.

## Penilaian soal sebelumnya

Kesimpulan: sesuai sebagian, terutama untuk prasyarat dan komposisi. Paket lama
belum cukup untuk mewakili seluruh sasaran e-book.

| Cakupan e-book | Soal lama | Penilaian |
| --- | --- | --- |
| Operasi aljabar fungsi | q10–q11 memadukan penjumlahan/pengurangan hasil | Sebagian; belum ada latihan operasi fungsi yang eksplisit |
| Komposisi fungsi | q4–q9, ditambah q10–q12 | Sesuai; urutan dan substitusi sudah dilatih |
| Invers fungsi | q12 hanya menentukan g dari komposisi yang diketahui | Belum ada invers yang diajarkan secara eksplisit |
| Invers komposisi | Belum ada latihan urutan pembalikan | Kurang |
| Penerapan enkripsi dan dekripsi | Belum ada konteks kode pesan | Kurang |
| Merancang dan mempresentasikan proyek kelompok | Kuis individu | Belum terwakili; game merupakan latihan pendamping |

Peta konsep berada pada [halaman peta konsep dan tujuan](https://read.bookcreator.com/TXRzj34SbZcD2YR2bMbr5r21nnv1/M_EIczZ6QB6TPOmEyomMWQ/jzb51RUcQ7yQk0zXqT62hw).
Bagian contoh dan proyek membahas penggunaan fungsi linear untuk penyandian,
pemulihan pesan dengan invers, dan penyandian dua tahap dengan komposisi.
Karena itu, sekadar mengacak angka pada soal komposisi lama belum menutup
kekurangan materi invers dan penerapan.

## Paket run baru

| Slot mesin | Materi |
| --- | --- |
| q1–q3 | Nilai fungsi, input negatif, dan syarat relasi menjadi fungsi |
| q4–q6 | Komposisi dua urutan dan perbandingan hasil |
| q7 | Operasi aljabar fungsi; salah satu dari tambah, kurang, kali, atau bagi |
| q8 | Rumus invers fungsi linear pada bilangan real |
| q9 | Urutan invers komposisi dua fungsi bijektif |
| q10 | Menghitung cipherteks dari dua kunci fungsi |
| q11 | Mengembalikan kode awal melalui invers fungsi linear |
| q12 | Dekripsi dua tahap dengan urutan invers yang benar |

Angka, koefisien, domain relasi, dan posisi opsi pilihan ganda diacak. q7 memilih
satu operasi per run; keempat operasi tersedia lintas run. Pembagi tidak nol,
koefisien fungsi invers tidak nol, dan jawaban numerik dibuat bulat. Pembahasan
serta diagram mesin dihitung dari parameter soal yang sama. Tidak memakai eval.
Penyandian ini simulasi matematika sederhana, bukan model keamanan pesan modern.

Paket baru menambah cakupan konsep, tetapi tidak menggantikan kegiatan merancang
pesan, bekerja dalam kelompok, dan presentasi hasil yang diminta e-book.

## Kelanjutan run dan save

- Petualangan baru memilih seed baru dan `questionSetVersion: 1`.
- Satu petualangan selalu memakai paket yang sama, termasuk setelah jawaban
  salah, review, reload, perpindahan wilayah, Game Over, dan retry checkpoint.
- Save lama tanpa metadata tetap memakai 12 soal asli beserta pembahasannya.
- ID q1–q12, urutan mesin, skor maksimum 120, tiga kunci, dan geometri tetap.
- Metadata seed dan versi ditambahkan ke save v1 tanpa menghapus progres lama.
  Seed atau versi yang tidak valid ditolak agar game tidak mengganti soal diam-diam.
- Algoritma dan templat versi 1 harus dipertahankan untuk save yang memakainya.
  Perubahan templat berikutnya memerlukan versi baru dengan pembaca versi lama.

## Contoh variasi yang diperiksa

| Slot | Paket contoh A | Paket contoh B |
| --- | --- | --- |
| q8 | f(x)=2x+7; invers (x−7)/2 | f(x)=2x+1; invers (x−1)/2 |
| q10 | f(x)=4x+1, g(x)=3x+3, p=9 → cipherteks 121 | f(x)=3x+1, g(x)=2x+1, p=2 → cipherteks 16 |
| q12 | f(x)=2x+2, g(x)=3x+3, cipherteks 32 → kode awal 4 | f(x)=3x+3, g(x)=2x+2, cipherteks 63 → kode awal 9 |

Contoh A memakai seed 12345; B memakai 98765. Ini soal buatan game berdasarkan
topik referensi, bukan salinan soal atau gambar e-book.

## Hasil pemeriksaan

93 tes unit dan 25 tes browser lulus pada build statis. Pengujian matematika
memeriksa 128 seed dengan perhitungan independen, keunikan opsi, pembagian yang
terdefinisi, serta pembalikan enkripsi. Tes browser melewati 12 mesin sampai
120 poin, memeriksa kesalahan/review/reload tanpa pergantian soal, seed baru
setelah Petualangan baru, kelanjutan save lama, dan Game Over yang menunggu retry.
Physics, collision, geometri, renderer dunia, dan aset Gundul tidak berubah.
