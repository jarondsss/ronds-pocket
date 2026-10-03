import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireMember } from "./books";

/**
 * Menghitung siapa yang harus bayar siapa dalam satu buku.
 * Return: { youOwe, theyOwe, partnerName, partnerId }
 * - youOwe: nominal yang kamu harus bayar ke partner
 * - theyOwe: nominal yang partner harus bayar ke kamu
 * - netBalance: youOwe - theyOwe (positif = kamu hutang, negatif = kamu piutang)
 */
export const getBalance = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const { userId } = await requireMember(ctx, bookId);

    // Cari partner di buku ini
    const members = await ctx.db
      .query("book_members")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const partner = members.find((m) => m.user_id !== userId);
    if (!partner) {
      return null; // tidak ada partner, tidak ada split
    }

    const partnerId = partner.user_id;
    const partnerUser = await ctx.db.get(partnerId);

    // Ambil semua transaksi dengan split
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .filter((q) => q.neq(q.field("split_with"), undefined))
      .collect();

    let youOwe = 0; // berapa yang kamu harus bayar ke partner
    let theyOwe = 0; // berapa yang partner harus bayar ke kamu

    for (const tx of transactions) {
      if (!tx.split_with || !tx.split_amount) continue;

      // Kalau partner yang bayar, dan split_with = kamu, maka kamu hutang
      if (tx.paid_by === partnerId && tx.split_with === userId) {
        youOwe += tx.split_amount;
      }
      // Kalau kamu yang bayar, dan split_with = partner, maka partner hutang
      else if (tx.paid_by === userId && tx.split_with === partnerId) {
        theyOwe += tx.split_amount;
      }
    }

    return {
      partnerId,
      partnerName: partnerUser?.name || "Partner",
      partnerAvatar: partnerUser?.avatar || null,
      youOwe,
      theyOwe,
      netBalance: youOwe - theyOwe,
    };
  },
});
