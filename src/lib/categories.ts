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
};

export function categoryEmoji(category: string): string {
  if (!category) return "🧾";
  return EMOJI[category] ?? "🧾";
}

const AVATAR_TONES = [
  "oklch(0.62 0.15 168)",
  "oklch(0.66 0.17 42)",
  "oklch(0.585 0.2 288)",
  "oklch(0.7 0.13 238)",
  "oklch(0.68 0.19 12)",
];

export function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Soft pastel wash of the category tone, used behind transaction icons. */
export function toneBackground(seed: string, strength = 18): string {
  return `color-mix(in oklab, ${toneFor(seed)} ${strength}%, transparent)`;
}
