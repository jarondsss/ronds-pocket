# Ronds Pocket di Figcraft

File revisi terbaru: `Ronds Pocket - Mobile Refactor v2.figcraft`.

File impor awal tetap tersedia: `Ronds Pocket - Mobile Refactor.figcraft`.

## Revisi beranda v2

- Penyelarasan pintasan: semua tombol memakai posisi tengah vertikal/horizontal, gap ikon-label 6 px, slot ikon 16 px, ketebalan garis 1,4 px, dan label berukuran alami tanpa kotak teks kosong. Diterapkan pada tema terang dan gelap. Backup sebelum penyelarasan: `Ronds Pocket - Mobile Refactor v2-before-alignment.figcraft`.
- Beranda terang dan gelap memiliki enam pintasan: Anggaran, Tujuan, Tabungan, Berulang, Rekap, Partner.
- Tabungan dan Rekap menuju layar masing-masing. Berulang menggulir ke ringkasan jadwal di beranda.
- Pemilih tanggal mengikuti hari. Angka Masuk hari ini dan Keluar hari ini memakai contoh transaksi hari terpilih, terpisah dari saldo semua dompet.
- Transaksi berulang ditampilkan sebagai ringkasan dua jadwal. Konten beranda dapat digulir di viewport, sedangkan navigasi bawah tetap terpisah.
- Pemilih hari merupakan gambaran visual untuk implementasi; perubahan data saat tanggal dipilih tidak disimulasikan dalam file desain.
- Preview: `beranda-v2.png`, `beranda-v2-gelap.png`, dan `beranda-v2-konten.png` (konten penuh).
- Revisi ini berfokus pada layar beranda utama. Preview mini produk di landing tetap mengikuti impor awal.

### Acuan repository

Pada 24 Oktober 2026, fetch menemukan lokal tertinggal 9 commit. Branch main disinkronkan dengan fast-forward dari `6fe7944` ke `42c8804`, sama dengan origin/main. File audit dan desain yang belum di-commit tetap dipertahankan.

Perubahan harian terdapat pada commit `a66bee2` tanggal 19 Oktober 2026. Sumber terbaru memakai DayNavigator/dayRange untuk transaksi dan ringkasan, sementara BudgetSnapshotCard tetap memakai rentang bulanan. Dialog catatan baru menerima tanggal hari yang sedang dipilih. Audit desain sebelumnya dibuat sebelum sinkronisasi ini sehingga acuannya adalah checkout lama.

Tidak ada implementasi refactor UI baru pada kode aplikasi dalam revisi ini; perubahan kode lokal berasal dari fast-forward repository.

Diimpor dari salinan lokal Figma pengguna pada 24 Oktober 2026 menggunakan Figcraft CLI. File sumber di Downloads tetap dipertahankan.

## Isi yang diperiksa

- 3 halaman: fondasi/komponen, aplikasi mobile, landing/masuk.
- 25 layar desain: 19 mobile dan 6 landing/autentikasi.
- 1.878 node, 55 variabel, 35 style.
- 124 node memiliki data interaksi prototype. Data tersimpan, tetapi seluruh interaksi belum diuji lewat UI Figcraft.
- Struktur native mencakup layer teks, vector, komponen, dan instance; bukan screenshot yang diratakan.
- Pemeriksaan `info` setelah file native dibuka ulang: tidak ada catatan error impor atau font yang hilang.

Baloo 2 dan Plus Jakarta Sans dipasang untuk pengguna Windows saat ini. Salinan font beserta lisensinya disediakan di `fonts/` untuk pemindahan ke perangkat lain.

## Persentase pertumbuhan tabungan

Layar `08 · Tabungan` diperbarui langsung di `Ronds Pocket - Mobile Refactor v2.figcraft`, tanpa membuat file desain baru. Kartu menampilkan persentase tahunan, estimasi pertambahan, proyeksi saldo setahun lagi, serta contoh 0% tanpa bunga. Ringkasan menampilkan potensi bunga gabungan. Angka merupakan data contoh berdasarkan perhitungan sederhana `balance × interest_rate / 100` di `src/convex/savings.ts`, bukan pertumbuhan aktual. Konten dapat digulir dengan navigasi bawah tetap terpisah.

Preview diperiksa di `tabungan-bertumbuh.png` dan `tabungan-bertumbuh-konten.png`. File native dibuka ulang lewat CLI tanpa catatan error atau font hilang; interaksi gulir belum diuji di GUI.

## Preview

Profil memiliki bagian Dukungan berisi `Kirim masukan` (feedback) dan `Donasi`, sebelum aksi keluar akun. Layar memakai viewport gulir dengan navigasi bawah tetap terpisah. Revisi langsung tersimpan di file v2 yang sama; preview `profil-dukungan.png`.

### Modal Profil dan avatar

Ditambahkan 13 frame modal native pada halaman aplikasi mobile: nama, tema, kantong, bantuan, feedback, donasi, keluar, hapus akun, semua fitur, avatar, dan tiga konfirmasi sukses. Menu Profil membuka overlay tengah dengan latar redup, tombol tutup, dan aksi batal/simpan yang sesuai. Avatar berisi 16 emoji hewan dari `src/lib/avatars.ts`, memakai Segoe UI Emoji. Pemilih mengubah variabel pratinjau; Simpan menyalin pilihan ke avatar Profil. Tema dan kantong menggunakan pilihan sementara sebelum disimpan. Target tap menu pengaturan diperbesar menjadi 44 px. QRIS berasal dari gambar asli repository.

Render modal tersedia sebagai `modal-profil-*.png`. Tinggi modal utama 331–643 px sehingga muat dalam layar 390 × 844. Pemeriksaan dilakukan melalui render dan struktur prototype CLI; interaksi belum diuji langsung di GUI Figcraft. Form nama/pesan/kontak adalah layer desain, bukan input runtime. Pengiriman feedback, pengunduhan QRIS, perubahan tema aplikasi, dan penghapusan data belum diimplementasikan. Tombol konfirmasi keluar/hapus hanya menavigasikan prototype ke desain login. File kode aplikasi tidak berubah.

- `beranda-import.png`
- `landing-import.png`
- `login-import.png`

Preview digunakan untuk memeriksa hasil render; file editable tetap `.figcraft`. Periksa lagi interaksi dan tampilan saat melanjutkan penyuntingan, terutama preview produk berskala kecil pada landing.

`import-info.json` berisi ringkasan struktur hasil impor. Kode aplikasi Ronds Pocket tidak diubah.
