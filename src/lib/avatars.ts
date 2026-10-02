/**
 * Maskot hewan buat avatar profil.
 *
 * Dipilih emoji, bukan file gambar, supaya tidak perlu menambah aset baru dan
 * tetap satu bahasa dengan bagian lain app ini (kategori dan dompet juga pakai
 * emoji). Server cuma menyimpan string-nya, jadi tidak ada validasi yang perlu
 * disinkronkan.
 */
export const ANIMAL_AVATARS = [
  { emoji: "🦊", label: "Rubah" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🐨", label: "Koala" },
  { emoji: "🐯", label: "Macan" },
  { emoji: "🦁", label: "Singa" },
  { emoji: "🐸", label: "Katak" },
  { emoji: "🐙", label: "Gurita" },
  { emoji: "🦉", label: "Burung hantu" },
  { emoji: "🐧", label: "Penguin" },
  { emoji: "🐢", label: "Kura-kura" },
  { emoji: "🐝", label: "Lebah" },
  { emoji: "🐰", label: "Kelinci" },
  { emoji: "🐷", label: "Babi" },
  { emoji: "🐵", label: "Monyet" },
  { emoji: "🐳", label: "Paus" },
  { emoji: "🦕", label: "Dino" },
] as const;

/** Nama manusiawi untuk satu emoji maskot, kalau emojinya ada di daftar. */
export function avatarLabel(emoji: string | null | undefined) {
  if (!emoji) return null;
  return ANIMAL_AVATARS.find((item) => item.emoji === emoji)?.label ?? null;
}

/** Huruf pertama nama, dipakai kalau user belum memilih maskot. */
export function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
