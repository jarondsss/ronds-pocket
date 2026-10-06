# agents.md

> Panduan kolaborasi AI–manusia untuk desainer UI/UX di **Ronds Pocket**.

Ronds Pocket adalah aplikasi pencatat uang berbahasa Indonesia. Aplikasi ini
menekankan catatan yang cepat, rapi, dan bisa digunakan bareng (kantong/
book berbagi). Halaman-halaman utama sudah ada di `src/pages/dashboard/` dan
tampilan landing ada di `src/pages/Landing.tsx`.

File ini menjelaskan apa yang penting dibaca, dipegang, dan dihindari oleh
desainer yang mengedit tampilan produk ini — baik desainer manusia maupun AI
collaborator.

---

## 1. Poin penting yang harus dibaca dulu

- **Tema bukan `dark:` Tailwind**. Tema gelap/terang dikendalikan lewat class
  CSS pada elemen root dan token di `src/index.css`. Jangan mengandalkan
  prefiks `dark:` sebagai cara utama penyesuaian tema.
- **Utility “clay” adalah bahasa desain utama.** Clay, ClayLoader,
  ClayChip, ClaySunken, ClayNav, ClayFloat, dan sejenisnya adalah pola yang
  sudah jadi. Kalau komponen sudah pakai clay, lanjut pakai itu; jangan
  membuat ulang kartu, input, atau badge dari nol kalau tidak ada alasan kuat.
- **Color tokens**: warna utama income/expense dan nuansa primary/click sudah
  didefinisikan di CSS. Jangan menambahkan palet warna acak di dalam komponen;
  kalau perlu warna baru, masukkan sebagai token di file CSS, bukan inline
  per kasus.
- **Bahasa interface Indonesia**. Label, placeholder, tooltip, toast, dan
  deskripsi form pakai bahasa Indonesia yang wajar untuk aplikasi keuangan
  sehari-hari. Hindari penggunaan bahasa teknis yang terasa seperti aplikasi
  bank internasional yang diterjemahkan kaku.
- **Pertimbangan aksesibilitas sudah jadi bagian dari desain**, bukan afterthink:
  fokus yang terarah, kontras cukup, ukuran target tap memadai, dan label
  form/state terlihat jelas.

---

## 2. Halaman dan pola yang sudah ada

### Halaman utama dashboard (saat ini)
- `Dashboard.tsx` : shell + navigasi + tampilan awal.
- `Ledger.tsx` : lembar catatan bulan berjalan + ringkasan + widget.
- `Wallet.tsx`, `Budget.tsx`, `Goals.tsx`, `Savings.tsx`, `Reports.tsx`,
  `Activity.tsx`, `Partner.tsx`, `Profile.tsx`, `NetWorth.tsx` :
  halaman fungsional yang masing-masing punya pola form, daftar, dan/atau
  ringkasan.

### Widget/dashboard card yang sekarang aktif
- **BudgetSnapshotCard** : ringkasan anggaran bulan berjalan, sisa/lewat,
  kategori terbesar, kategori tanpa jatah.
- **UpcomingBillRemindersCard** : daftar pengingat tagihan terdekat,
  hari ini / besok / N hari lagi, plus tombol tambah.
- **NotificationInsightCard** : kabar terbaru dari anggota pocket + jumlah
  belum dibaca.

### Komponen form dan dialog yang dipakai berulang
- Dialog transaksi, dialog berulang, dialog tagihan/pengingat, dialog
  tujuan/tabungan, dialog kategori, dan sejenisnya kebanyakan pakai pola
  **judul + deskripsi pendek + form bertingkat + footer aksi**.
- RupiahInput, CategoryCombobox, DatePicker, SegmentedChips, dan komponen
  sejenis sudah jadi bagian dari sistem form.

### Pola interaksi yang dikehendaki
- Tindakan utama paling menonjol; aksi sekunder lebih rendah.
- Kartu informasi jangan berisi lebih dari satu tugas utama per layar kecil.
- Untuk daftar transaksi, urutan dan filter harus terlihat jelas, bukan
  sekadar tabel data.
- Keadaan kosong (empty state) harus punya pernyataan dalam bahasa Indonesia
  dan, kalau relevan, ajakan bertindak kecil.

---

## 3. Aturan desain yang dipegang

### Tampilan
- Pertahankan konsistensi bentuk kartu, spacing, dan tipografi antar halaman.
- Jangan mengubah tema warna global hanya untuk menyesuaikan satu halaman.
- Kalau ingin menambah nada warna, masukkan ke sistem token, bukan inline ad-hoc.

### Bau bahasa
- Gunakan istilah yang sudah ada di produk: kantong, dompet, anggaran, tujuan,
  tabungan, rekap, riwayat, partner, profil, dan sejenisnya.
- Hindari dua padanan untuk satu makna dalam satu layar.
- Kalimat pendek lebih diprioritaskan untuk label dan status.

### Form
- Label form lebih diprioritaskan daripada placeholder sebagai penunjuk makna.
- Input nominal sebaiknya memudahkan pembacaan cepat dan konsisten dengan pola
  RupiahInput yang sudah ada.
- Error dan konfirmasi sebaiknya dibicarakan dalam bahasa yang menenangkan dan
  jelas, bukan bahasa yang menakutkan atau terlalu teknis.

### Interaksi
- Memakai loading state yang sesuai: jangan biarkan tombol utama beraksi
  berganda saat proses belum selesai.
- Membuat keadaan loading, kosong, error, dan sukses tetap terbaca jelas
  tanpa mengubah sistem desain secara besar-besaran.
- Animasi kecil diperbolehkan, tapi jangan mengganggu kecepatan penggunaan
  sehari-hari.

---

## 4. Hal yang dihindari

- Menambah palet warna baru tanpa alasan sistem.
- Membuat komponen UI baru hanya karena “rasa”, sementara komponen existing
  sudah mencukupi.
- Mengubah identitas tema secara global lewat perubahan lokal sembarangan.
- Copy-paste struktur form atau kartu dari produk lain tanpa menyesuaikan
  dengan istilah dan pola Ronds Pocket.
- Biarkan pengguna sampai pada keadaan yang ambigu tanpa label, status, atau
  langkah berikutnya yang jelas.

---

## 5. Cara mengedit dengan aman

- Edit file satu per satu, jangan mengubah banyak halaman sekaligus tanpa
  alasan fungsional.
- Jika menambah komponen baru, cek dulu apakah sudah ada komponen serupa di
  `src/components/ui/` atau `src/components/dashboard/`.
- Jika menambah warna atau variasi visual, usahakan tetap bisa dijelaskan dalam
  satu paragraf: apa peran warna itu, kapan muncul, dan bagaimana hubungannya
  dengan income/expense atau primary palette.
- Setelah mengedit tampilan, cek bahwa bahasa Indonesia di layar tetap masuk
  akal bila dibaca berurutan di halaman yang relevan.

---

## 6. Verifikasi visual singkat untuk desainer

Setelah mengubah tampilan, cek hal ini secara manual:

1. Apakah label dan teks masih terbaca jelas di mode terang dan gelap?
2. Apakah warna income/expense masih dibedakan dengan benar?
3. Apakah status penting (lewat batas, hampir mentok, belum ada data,
   proses sedang berjalan) tetap terlihat berbeda dari teks biasa?
4. Apakah tombol utama tidak hilang di antara elemen lain?
5. Apakah empty state tetap punya makna, bukan sekadar kotak kosong?
6. Apakah halaman tidak terasa terlalu padat atau terlalu sepi dibanding
   halaman serupa di produk yang sama?

Jika ada hal yang gagal, perbaiki di komponen atau token terkait, jangan
memperbaiki hanya di satu tempat.

---

## 7. Tema dan aksesibilitas

- Tema gelap/terang sudah dikelola sistem. Desain sebaiknya tidak mengasumsikan
  satu tema saja.
- Pastikan kontras teks dan elemen aktif cukup, terutama untuk badge, chip,
  dan text-small.
- Pastikan elemen yang bisa diklik/taped memiliki ukuran yang wajar dan area
  perpindahan yang jelas.

---

## 8. Catatan kolaborasi

- AI collaborator dan manusia bisa saling menandai: perubahan yang kecil
  sebaiknya tetap menjelaskan “mengapa” dalam komentar atau catatan singkat.
- Kalau ada pendekatan desain yang belum yakin, lebih baik ditulis sebagai
  pilihan terbuka daripada langsung dibekukan jadi satu keputusan tanpa
  konteks.
- Deskripsi perubahan sebaiknya fokus pada outcome pengguna, bukan hanya warna
  atau class.

---

## 9. Nama file yang sering jadi acuan

- `src/index.css` : token tema dan utility clay.
- `src/components/ui/*` : komponen dasar UI.
- `src/components/dashboard/*` : komponen khusus halaman dashboard dan form.
- `src/pages/dashboard/*` : halaman dashboard.
- `src/pages/Landing.tsx` : tampilan depan/landing.

File-file di atas adalah tempat utama kalau desain ingin memahami apa yang
sudah ada sebelum menambah sesuatu yang baru.