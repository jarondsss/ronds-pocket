/**
 * Seed data for a fresh pocket. Kept server-side so a new pocket always has a
 * usable set of wallets and categories without a round trip from the client.
 */

export const DEFAULT_WALLETS = [
  { name: "Tunai", type: "cash", icon: "💵", color: "mint" },
  { name: "BCA", type: "bank", icon: "🏦", color: "sky" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "Makan & Minum", type: "expense", color: "coral" },
  { name: "Transportasi", type: "expense", color: "sky" },
  { name: "Belanja", type: "expense", color: "pink" },
  { name: "Tagihan", type: "expense", color: "amber" },
  { name: "Kesehatan", type: "expense", color: "mint" },
  { name: "Hiburan", type: "expense", color: "violet" },
  { name: "Rumah", type: "expense", color: "teal" },
  { name: "Pendidikan", type: "expense", color: "indigo" },
  { name: "Lainnya", type: "expense", color: "grape" },
  { name: "Gaji", type: "income", color: "green" },
  { name: "Bonus", type: "income", color: "lime" },
  { name: "Usaha", type: "income", color: "teal" },
  { name: "Investasi", type: "income", color: "cyan" },
  { name: "Hadiah", type: "income", color: "lemon" },
  { name: "Lainnya", type: "income", color: "grape" },
] as const;
