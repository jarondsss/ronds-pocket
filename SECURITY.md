# SECURITY.md

Catatan keamanan Ronds Pocket. Dibuat setelah insiden `.env.keys` ter-commit
ke riwayat git (2026-09-30). Baca ini sebelum mengubah apa pun yang
berhubungan dengan secret.

---

## Insiden 2026-09-30 — `.env.keys` ter-commit

| Hal | Detail |
|-----|--------|
| File | `.env.keys` (berisi `DOTENV_PRIVATE_KEY_LOCAL`) |
| Commit | `1336296f79200eb9a4533f64b38ef2ba30468828`, 2026-09-30 18:48 UTC |
| Status | Key harus dianggap **bocor**. Rotasi belum dikonfirmasi — kerjakan checklist di bawah. |

### Temuan saat audit (2026-10-09)

1. **`.gitignore` sebelumnya tidak melindungi apa pun selain `.env.local`.**
   Isinya hanya empat baris (`.env.local`, `node_modules`, `dist`,
   `src/convex/_generated`), jadi `.env.keys` memang tidak pernah di-ignore.
   Sudah diperbaiki: sekarang `.env`, `.env.*`, `.env.keys`, `*.pem`, dan
   `*.key` di-ignore, dengan `!.env.example` dikecualikan supaya template tetap
   bisa di-commit.
2. **Enkripsi dotenvx tidak dipakai di kode ini.** Tidak ada referensi
   `dotenvx` di `package.json` maupun di script npm, jadi `.env.keys` tidak
   mendekripsi apa pun saat dev/prod berjalan. Artinya file itu bisa dihapus
   langsung tanpa mengubah perilaku aplikasi.
3. **Menghapus file tidak cukup.** Git menyimpan riwayat, jadi `.env.keys` tetap
   bisa dibaca dari commit lama walau file-nya sudah dihapus. Perlu
   `git rm --cached` + rewrite history (lihat di bawah).

---

## Environment variable yang dipakai kode (terverifikasi)

Daftar ini hasil pembacaan langsung ke kode, bukan template. Pakai ini sebagai
acuan saat mengisi Keys/API keys, jangan menyalin daftar dari dokumen lain.

Dibaca server-side (Convex action, `process.env`):

| Variable | Dipakai di | Wajib? |
|----------|-----------|--------|
| `VLY_INTEGRATION_KEY` | OTP email + auth (`src/convex/auth/emailOtp.ts`, `src/convex/auth.config.ts`, `src/lib/vly-integrations.ts`) | Ya, untuk login |
| `VLY_INTEGRATION_BASE_URL` | sama seperti di atas | Ya, untuk login |
| `VLY_CONVEX_AUTH_ISSUER` | sama seperti di atas | Ya, untuk login |
| `RESEND_API_KEY` | Email masukan (`src/convex/feedback.ts`) | Opsional |
| `FEEDBACK_INBOX` | Tujuan email masukan | Opsional (ada default di kode) |
| `FEEDBACK_TO_EMAIL` | Fallback tujuan email masukan | Opsional |
| `FEEDBACK_FROM` | Alamat pengirim email masukan | Opsional (default `onboarding@resend.dev`) |
| `GEMINI_API_KEY` | Composer AI (`src/convex/ai.ts`) | Opsional |
| `CONVEX_SITE_URL` | Konfigurasi Convex | Ya |
| `NODE_ENV` | Perilaku dev/prod | Ya (otomatis) |

Dibaca di browser (Vite, `import.meta.env`) — nilai ini **terlihat publik**,
jangan taruh secret di sini:

`VITE_CONVEX_URL`, `VITE_VLY_APP_ID`, `VITE_VLY_MONITORING_URL`

Kalau email atau AI belum diatur, fitur terkait tetap jalan tapi mengembalikan
`emailed: false` / mode tanpa AI — bukan error fatal.

---

## Checklist pemulihan

Dikerjakan pemilik akun, karena butuh akses dashboard penyedia dan riwayat git.

- [ ] Putar ulang `VLY_INTEGRATION_KEY` di dashboard VLY, lalu revoke key lama.
- [ ] Putar ulang `RESEND_API_KEY` di https://resend.com/api-keys, lalu hapus
      key lama.
- [ ] Putar ulang `GEMINI_API_KEY` di https://aistudio.google.com/apikey, lalu
      hapus key lama.
- [ ] Hapus file lokal `.env.keys` (tidak dipakai lagi oleh kode).
- [ ] Isi ulang `.env.local` dengan key **plaintext** yang baru. Perlu dicatat:
      `convex dev` ikut membaca `.env.local`, jadi kalau isinya masih ciphertext
      dotenvx, Convex akan menerima teks terenkripsi itu sebagai nilai key dan
      OTP/email akan gagal.
- [ ] Env var produksi diatur lewat Environment Variables di dashboard Convex
      (bukan dari file lokal).
- [ ] Berhentikan pelacakan file-nya oleh git, lalu bersihkan riwayat:
      `git rm --cached .env.keys`, lanjut `git filter-repo --path .env.keys
      --invert-paths` (atau BFG), lalu `git push --force` bila remote sudah
      menerima commit lama. **Vly memegang version control repo ini**, jadi
      langkah ini dikerjakan lewat Vly, bukan dari sesi ini.
- [ ] Pastikan `.gitignore` yang baru sudah ikut ter-commit.
- [ ] Uji ulang: login OTP, kirim masukan, buka composer AI.

---

## Aturan seterusnya

- Secret hanya lewat tab **Keys/API keys** (local) dan Environment Variables
  Convex/Vercel (produksi). Jangan pernah menulis nilai secret ke file kode,
  dokumen, atau commit.
- Jangan pakai enkripsi file `.env` di repo ini. Kalau perlu secret lokal,
  cukup `.env.local` + `.gitignore`.
- Sebelum commit, cek `git status` tidak memuat file `.env*` selain
  `.env.example`.
- Kalau menemukan secret yang bocor: revoke dulu di penyedia, baru bersihkan
  riwayat. Mengganti riwayat tanpa revoke tidak mengamankan apa pun.
