import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireMember } from "./books";
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./seed";

/**
 * Mengisi dompet dan kategori bawaan kalau kantong ini masih kosong.
 * Dipanggil otomatis dari aplikasi begitu kantong aktif terbuka.
 */
export const ensurePocketDefaults = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const { userId } = await requireMember(ctx, bookId);
    const now = Date.now();
    let created = 0;

    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .first();
    if (existingWallet === null) {
      for (const wallet of DEFAULT_WALLETS) {
        await ctx.db.insert("wallets", {
          book_id: bookId,
          name: wallet.name,
          type: wallet.type,
          icon: wallet.icon,
          color: wallet.color,
          opening_balance: 0,
          created_by: userId,
          created_at: now,
        });
        created += 1;
      }
    }

    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .first();
    if (existingCategory === null) {
      for (const category of DEFAULT_CATEGORIES) {
        await ctx.db.insert("categories", {
          book_id: bookId,
          name: category.name,
          type: category.type,
          color: category.color,
          created_by: userId,
          created_at: now,
        });
        created += 1;
      }
    }

    return created;
  },
});
