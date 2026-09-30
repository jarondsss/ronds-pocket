export interface Tone {
  key: string;
  label: string;
  value: string;
}

/** 15 pilihan warna untuk kategori dan dompet. */
export const TONES: Tone[] = [
  { key: "grape", label: "Anggur", value: "oklch(0.56 0.2 305)" },
  { key: "violet", label: "Violet", value: "oklch(0.63 0.185 295)" },
  { key: "indigo", label: "Indigo", value: "oklch(0.58 0.18 275)" },
  { key: "blue", label: "Biru", value: "oklch(0.62 0.16 255)" },
  { key: "sky", label: "Langit", value: "oklch(0.7 0.13 235)" },
  { key: "cyan", label: "Cyan", value: "oklch(0.72 0.12 210)" },
  { key: "teal", label: "Tosca", value: "oklch(0.68 0.12 190)" },
  { key: "mint", label: "Mint", value: "oklch(0.72 0.14 168)" },
  { key: "green", label: "Hijau", value: "oklch(0.7 0.16 150)" },
  { key: "lime", label: "Lime", value: "oklch(0.78 0.16 128)" },
  { key: "lemon", label: "Lemon", value: "oklch(0.85 0.15 100)" },
  { key: "amber", label: "Amber", value: "oklch(0.8 0.15 80)" },
  { key: "orange", label: "Oranye", value: "oklch(0.74 0.16 58)" },
  { key: "coral", label: "Koral", value: "oklch(0.7 0.17 35)" },
  { key: "pink", label: "Pink", value: "oklch(0.72 0.17 350)" },
];

const TONE_BY_KEY = new Map(TONES.map((tone) => [tone.key, tone]));

export function toneValue(key: string): string {
  return TONE_BY_KEY.get(key)?.value ?? TONES[0].value;
}

export function toneLabel(key: string): string {
  return TONE_BY_KEY.get(key)?.label ?? TONES[0].label;
}

/** 7 tipe dompet, masing-masing dengan ikon bawaan. */
export interface WalletType {
  key: string;
  label: string;
  icon: string;
}

export const WALLET_TYPES: WalletType[] = [
  { key: "cash", label: "Tunai", icon: "💵" },
  { key: "bank", label: "Bank", icon: "🏦" },
  { key: "ewallet", label: "E-Wallet", icon: "📱" },
  { key: "credit", label: "Kartu Kredit", icon: "💳" },
  { key: "investment", label: "Investasi", icon: "📈" },
  { key: "saving", label: "Celengan", icon: "🐖" },
  { key: "other", label: "Lainnya", icon: "✨" },
];

const WALLET_TYPE_BY_KEY = new Map(WALLET_TYPES.map((type) => [type.key, type]));

export function walletTypeOf(key: string): WalletType {
  return WALLET_TYPE_BY_KEY.get(key) ?? WALLET_TYPES[WALLET_TYPES.length - 1];
}

export interface SavingKind {
  key: string;
  label: string;
  icon: string;
}

export const SAVING_KINDS: SavingKind[] = [
  { key: "umum", label: "Umum", icon: "🌱" },
  { key: "deposito", label: "Deposito", icon: "🏦" },
  { key: "reksa_dana", label: "Reksa Dana", icon: "📈" },
  { key: "emas", label: "Emas", icon: "🪙" },
  { key: "lainnya", label: "Lainnya", icon: "✨" },
];

const SAVING_KIND_BY_KEY = new Map(
  SAVING_KINDS.map((kind) => [kind.key, kind]),
);

export function savingKindOf(key: string): SavingKind {
  return SAVING_KIND_BY_KEY.get(key) ?? SAVING_KINDS[0];
}
