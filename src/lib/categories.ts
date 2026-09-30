import { TONES, toneValue } from "@/lib/palette";

export const EXPENSE_CATEGORIES = [
  "Makan & Minum",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Kesehatan",
  "Hiburan",
  "Rumah",
  "Pendidikan",
  "Lainnya",
] as const;

export const INCOME_CATEGORIES = [
  "Gaji",
  "Bonus",
  "Usaha",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;

const EMOJI: Record<string, string> = {
  "Makan & Minum": "🍜",
  Transportasi: "🛵",
  Belanja: "🛍️",
  Tagihan: "💡",
  Kesehatan: "💊",
  Hiburan: "🎬",
  Rumah: "🏠",
  Pendidikan: "📚",
  Gaji: "💼",
  Bonus: "🎁",
  Usaha: "🏪",
  Investasi: "📈",
  Hadiah: "🤝",
  Lainnya: "✨",
  Tabungan: "🐖",
  "Kopi & Jajan": "☕",
};

export function categoryEmoji(category: string): string {
  if (!category) return "🧾";
  return EMOJI[category] ?? "🧾";
}

function hash(seed: string): number {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) % 9973;
  }
  return value;
}

/** Warna tetap untuk kategori yang belum punya warna sendiri. */
export function categoryTone(seed: string): string {
  if (!seed) return TONES[0].key;
  return TONES[hash(seed) % TONES.length].key;
}

/** Warna mentah untuk seed apa pun, dipakai grafik. */
export function toneFor(seed: string): string {
  return toneValue(categoryTone(seed));
}

/** Latar pastel lembut dari sebuah tone key. */
export function toneBackground(toneKey: string, strength = 20): string {
  return `color-mix(in oklab, ${toneValue(toneKey)} ${strength}%, transparent)`;
}
