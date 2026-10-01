import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, requireMember, rupiah } from "./books";

/**
 * Anggaran bulanan per kategori. `spent` dihitung dari pengeluaran pada
 * rentang tanggal yang dikirim klien, jadi progress bar selalu ikut bulan
 * yang sedang dibuka.
 */
export const list = query({
  args: {
    bookId: v.id("books"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, { bookId, from, to }) => {
    await requireMember(ctx, bookId);

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const colors = new Map(
      categories.map((category) => [category.name, category.color]),
    );

    const transactions =
      from !== undefined && to !== undefined
        ? await ctx.db
            .query("transactions")
            .withIndex("by_book_occurred", (q) =>
              q
                .eq("book_id", bookId)
                .gte("occurred_at", from)
                .lt("occurred_at", to),
            )
            .collect()
        : await ctx.db
            .query("transactions")
            .withIndex("by_book", (q) => q.eq("book_id", bookId))
            .collect();

    const spentByCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      spentByCategory.set(
        tx.category,
        (spentByCategory.get(tx.category) ?? 0) + tx.amount,
      );
    }

    const rows = budgets
      .map((budget) => ({
        _id: budget._id,
        category: budget.category,
        amount: budget.amount,
        color: colors.get(budget.category) ?? "grape",
        spent: spentByCategory.get(budget.category) ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const budgeted = new Set(budgets.map((budget) => budget.category));
    const unbudgeted = [...spentByCategory.entries()]
      .filter(([category]) => !budgeted.has(category))
      .map(([category, spent]) => ({
        category,
        spent,
        color: colors.get(category) ?? "grape",
      }))
      .sort((a, b) => b.spent - a.spent);

    return {
      budgets: rows,
      unbudgeted,
      totalBudget: rows.reduce((sum, row) => sum + row.amount, 0),
      totalSpent: rows.reduce((sum, row) => sum + row.spent, 0),
      overspent: rows.filter((row) => row.spent > row.amount).length,
    };
  },
});

/**
 * Upsert: menulis 0 berarti anggarannya dihapus.
 * Anggaran sengaja boleh disentuh semua anggota karena sifatnya sudah disepakati
 * berdua, jadi tidak dikunci ke pembuatnya seperti dompet atau catatan.
 */
export const setAmount = mutation({
  args: {
    bookId: v.id("books"),
    category: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const category = args.category.trim();
    if (!category) {
      throw new Error("Pilih kategorinya dulu ya.");
    }
    const amount = Math.max(0, Math.round(args.amount));

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_book_category", (q) =>
        q.eq("book_id", args.bookId).eq("category", category),
      )
      .unique();

    // Jejak riwayat cuma ditulis kalau memang ada yang berubah, supaya
    // penyimpanan yang tidak mengubah apa-apa tidak membanjiri Riwayat.
    if (amount === 0) {
      if (existing === null) return null;
      await logActivity(ctx, {
        bookId: args.bookId,
        actorId: userId,
        action: "delete",
        target: "anggaran",
        label: category,
        detail: "Anggaran dihapus",
      });
      await ctx.db.delete(existing._id);
      return null;
    }

    if (existing !== null) {
      if (existing.amount === amount) return existing._id;
      await logActivity(ctx, {
        bookId: args.bookId,
        actorId: userId,
        action: "update",
        target: "anggaran",
        label: category,
        detail: `${rupiah(existing.amount)} → ${rupiah(amount)} / bulan`,
      });
      await ctx.db.patch(existing._id, { amount, updated_at: Date.now() });
      return existing._id;
    }

    await logActivity(ctx, {
      bookId: args.bookId,
      actorId: userId,
      action: "create",
      target: "anggaran",
      label: category,
      detail: `Jadi ${rupiah(amount)} / bulan`,
    });
    return await ctx.db.insert("budgets", {
      book_id: args.bookId,
      category,
      amount,
      updated_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, { id }) => {
    const budget = await ctx.db.get(id);
    if (budget === null) return null;
    const { userId } = await requireMember(ctx, budget.book_id);
    await logActivity(ctx, {
      bookId: budget.book_id,
      actorId: userId,
      action: "delete",
      target: "anggaran",
      label: budget.category,
      detail: `${rupiah(budget.amount)} / bulan`,
    });
    await ctx.db.delete(id);
    return null;
  },
});
