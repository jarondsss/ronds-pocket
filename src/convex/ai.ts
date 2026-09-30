import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { requireMember } from "./books";

/** Draft transaksi hasil racikan AI. Belum disimpan sampai user konfirmasi. */
export interface AiDraft {
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_at: number;
  wallet_id: Id<"wallets"> | null;
}

const MODEL = "gemini-2.5-flash";
const MAX_INPUT = 500;
const MAX_AMOUNT = 1_000_000_000_000; // 1 triliun, sama seperti transaksi manual
const MAX_CATEGORY = 40;
const MAX_NOTE = 200;

/** Daftar dompet + kategori sebuah kantong, dipakai sebagai konteks prompt AI. */
export const context = internalQuery({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    return {
      wallets: wallets.map((wallet) => ({
        id: wallet._id as string,
        name: wallet.name,
      })),
      expense: categories
        .filter((category) => category.type === "expense")
        .map((category) => category.name),
      income: categories
        .filter((category) => category.type === "income")
        .map((category) => category.name),
    };
  },
});

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ["income", "expense"] },
    amount: { type: "NUMBER" },
    category: { type: "STRING" },
    note: { type: "STRING" },
    date: { type: "STRING", description: "tanggal ISO YYYY-MM-DD" },
    wallet: { type: "STRING", description: "nama dompet atau string kosong" },
  },
  required: ["type", "amount", "category", "note", "date"],
};

function buildPrompt(
  text: string,
  todayIso: string,
  tzOffsetMinutes: number,
  data: {
    wallets: { id: string; name: string }[];
    expense: string[];
    income: string[];
  },
): string {
  const walletList = data.wallets.map((wallet) => wallet.name).join(", ");
  return [
    "Kamu mengubah catatan uang bahasa Indonesia sehari-hari menjadi data transaksi terstruktur.",
    "",
    `Hari ini: ${todayIso} (waktu lokal pengguna, offset ${tzOffsetMinutes} menit dari UTC).`,
    `Dompet yang tersedia: ${walletList || "(belum ada dompet)"}.`,
    `Kategori pengeluaran: ${data.expense.join(", ") || "(bebas)"}.`,
    `Kategori pemasukan: ${data.income.join(", ") || "(bebas)"}.`,
    "",
    "Aturan:",
    "- Kata seperti beli, bayar, jajan, keluar artinya expense. Gaji, terima, masuk, bonus artinya income. Kalau ragu, pilih expense.",
    '- Nominal selalu dalam rupiah utuh: "35rb" = 35000, "5jt" = 5000000, "35.000" = 35000, "1,5 juta" = 1500000.',
    '- Tanggal dalam format YYYY-MM-DD. "hari ini"/"tadi pagi" = hari ini, "kemarin" = 1 hari sebelumnya. Kalau tidak disebut, pakai hari ini.',
    "- Kategori: pilih yang paling cocok dari daftar. Kalau tidak ada, tulis kategori singkat baru dalam bahasa Indonesia.",
    "- Dompet: isi nama dompet persis dari daftar kalau disebut, kalau tidak kosongkan.",
    "- Catatan: ringkasan singkat maksimal 60 karakter, tanpa nominal.",
    "",
    `Catatan pengguna: "${text}"`,
  ].join("\n");
}

function isoToTimestamp(iso: string, tzOffsetMinutes: number, fallback: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return fallback;
  // Tengah hari waktu lokal supaya pergeseran zona tidak mengubah tanggalnya.
  return Date.UTC(year, month - 1, day, 12, 0, 0, 0) + tzOffsetMinutes * 60_000;
}

function clampAmount(value: unknown): number {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(amount, MAX_AMOUNT);
}

function pickCategory(value: unknown, pool: string[]): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return pool[0] ?? "";
  const lower = raw.toLowerCase();
  const known = pool.find((name) => name.toLowerCase() === lower);
  return (known ?? raw).slice(0, MAX_CATEGORY);
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
}

/**
 * Ubah teks bebas jadi draft transaksi. Sengaja TIDAK menyimpan apa pun — draft
 * dikembalikan ke client supaya user mengonfirmasi lewat dialog transaksi.
 */
export const parseTransaction = action({
  args: {
    bookId: v.id("books"),
    text: v.string(),
    todayIso: v.string(),
    tzOffsetMinutes: v.number(),
  },
  handler: async (
    ctx,
    { bookId, text, todayIso, tzOffsetMinutes },
  ): Promise<AiDraft> => {
    const clean = text.trim();
    if (clean.length < 2) {
      throw new Error("Tulis dulu keterangannya, misalnya \"kopi 35rb\".");
    }
    if (clean.length > MAX_INPUT) {
      throw new Error("Keterangannya kepanjangan. Ringkas sedikit ya.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Fitur AI belum aktif. Tambahkan GEMINI_API_KEY di tab Keys/API keys dulu ya.",
      );
    }

    const data = await ctx.runQuery(internal.ai.context, { bookId });
    const today = isoToTimestamp(todayIso, tzOffsetMinutes, Date.now());

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: buildPrompt(clean, todayIso, tzOffsetMinutes, data),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
        },
      );
    } catch {
      throw new Error("AI-nya sedang tidak bisa dihubungi. Coba lagi ya.");
    }

    if (!response.ok) {
      throw new Error(
        response.status === 400 || response.status === 403
          ? "Kunci AI-nya sepertinya tidak valid. Cek GEMINI_API_KEY ya."
          : `AI-nya sedang error (${response.status}). Coba lagi sebentar lagi.`,
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const raw = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join(" ")
      .trim();
    if (!raw) {
      throw new Error("AI-nya tidak bisa membaca catatan itu. Coba tulis ulang ya.");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("Hasil AI-nya tidak bisa dibaca. Coba lagi ya.");
    }

    const type = parsed.type === "income" ? "income" : "expense";
    const walletName =
      typeof parsed.wallet === "string" ? parsed.wallet.trim().toLowerCase() : "";
    const matchedWallet = walletName
      ? data.wallets.find((wallet) => wallet.name.toLowerCase() === walletName)
      : undefined;

    return {
      type,
      amount: clampAmount(parsed.amount),
      category: pickCategory(parsed.category, data[type]),
      note:
        typeof parsed.note === "string"
          ? parsed.note.trim().slice(0, MAX_NOTE)
          : "",
      occurred_at: isoToTimestamp(String(parsed.date ?? ""), tzOffsetMinutes, today),
      wallet_id: (matchedWallet?.id ?? null) as Id<"wallets"> | null,
    };
  },
});
