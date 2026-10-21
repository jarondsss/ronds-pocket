import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { requireMember } from "./books";

/**
 * Daftar dompet + kategori sebuah kantong, dipakai sebagai konteks prompt AI.
 *
 * Dipisah dari `ai.ts` karena file itu memakai runtime Node (untuk gateway AI),
 * dan file Node hanya boleh mendefinisikan action.
 */
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
