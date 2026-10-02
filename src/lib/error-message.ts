import { toast } from "sonner";

/**
 * Semua error dari Convex sudah berupa kalimat bahasa Indonesia yang enak
 * dibaca (lihat `throw new Error(...)` di src/convex). Jadi aturan kita:
 * pakai pesan dari server apa adanya, dan hanya kalau errornya came from
 * jaringan/sesi (yang sampai ke user sebagai kode aneh), ganti dengan
 * kalimat sendiri.
 */
const FRIENDLY: Array<[RegExp, string]> = [
  [
    /failed to fetch|networkerror|network request failed|load failed|koneksi/i,
    "Koneksi kelihatan putus. Cek internetmu lalu coba lagi ya.",
  ],
  [
    /unauthenticated|not authenticated|you must be logged in|need to be signed in|session/i,
    "Sesi kamu sudah habis. Masuk lagi ya.",
  ],
  [
    /convex|must be a convex function|internal server/i,
    "Layanannya sedang ada gangguan. Coba lagi sebentar ya.",
  ],
];

/** Pesan error terakhir yang dipakai kalau tidak ada yang cocok. */
export function friendlyError(
  error: unknown,
  fallback = "Terjadi kesalahan. Coba lagi ya.",
): string {
  if (typeof error === "string" && error.trim()) return error.trim();

  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  const clean = raw.trim();

  if (!clean) return fallback;

  // Pesan dari server sudah ramah -> langsung dipakai, kecuali kelihatan
  // seperti error teknis yang tidak seharusnya muncul ke user.
  const looksTechnical =
    /^[A-Za-z0-9_./-]+(Error|Exception):/.test(clean) ||
    /at\s+\w+\s+\(/.test(clean) ||
    clean.includes("http://") ||
    clean.includes("https://");

  if (!looksTechnical) return clean;

  for (const [pattern, message] of FRIENDLY) {
    if (pattern.test(clean)) return message;
  }

  return fallback;
}

/**
 * Satu pintu untuk menampilkan error ke user: menerjemahkan pesannya lalu
 * memunculkan toast. Dipakai di setiap `catch` supaya ga ada satu pun yang
 * diam-diam gagal.
 */
export function toastError(error: unknown, fallback?: string): string {
  const message = friendlyError(error, fallback);
  if (import.meta.env.DEV) {
    console.error("[Ronds Pocket]", error);
  }
  toast.error(message);
  return message;
}