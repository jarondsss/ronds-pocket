import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./books";

const MAX_AMOUNT = 1_000_000_000_000; // 1 triliun rupiah, guard against typos

async function loadTransactions(
  ctx: QueryCtx,
  bookId: Id<"books">,
  from?: number,
  to?: number,
): Promise<Doc<"transactions">[]> {
  if (from !== undefined && to !== undefined) {
    return await ctx.db
      .query("transactions")
      .withIndex("by_book_occurred", (q) =>
        q.eq("book_id", bookId).gte("occurred_at", from).lt("occurred_at", to),
      )
      .collect();
  }
  return await ctx.db
    .query("transactions")
    .withIndex("by_book_occurred", (q) => q.eq("book_id", bookId))
    .collect();
}

function cleanAmount(amount: number) {
  if (!Number.isFinite(amount)) {
    throw new Error("Nominal tidak valid.");
  }
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    throw new Error("Nominal harus lebih dari 0.");
  }
  if (rounded > MAX_AMOUNT) {
    throw new Error("Nominal terlalu besar.");
  }
  return rounded;
}

/** Transactions for a book, newest first, optionally limited to one month. */
export const list = query({
  args: {
    bookId: v.id("books"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, { bookId, from, to }) => {
    await requireMember(ctx, bookId);
    const rows = await loadTransactions(ctx, bookId, from, to);

    const names = new Map<string, string>();
    const readName = async (userId: Id<"users">) => {
      const cached = names.get(userId);
      if (cached !== undefined) return cached;
      const user = await ctx.db.get(userId);
      const email = user?.email ?? null;
      const name = user?.name ?? (email ? email.split("@")[0] : "Pengguna");
      names.set(userId, name);
      return name;
    };

    const withNames = await Promise.all(
      rows.map(async (row) => ({
        _id: row._id,
        type: row.type,
        amount: row.amount,
        category: row.category,
        note: row.note,
        occurred_at: row.occurred_at,
        created_by: row.created_by,
        created_at: row.created_at,
        createdByName: await readName(row.created_by),
      })),
    );

    return withNames.sort((a, b) => b.occurred_at - a.occurred_at);
  },
});

/** Saldo + totals + breakdown per category for a period. */
export const summary = query({
  args: {
    bookId: v.id("books"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, { bookId, from, to }) => {
    await requireMember(ctx, bookId);
    const rows = await loadTransactions(ctx, bookId, from, to);

    let income = 0;
    let expense = 0;
    const expenseByCategory = new Map<string, number>();
    const incomeByCategory = new Map<string, number>();

    for (const row of rows) {
      if (row.type === "income") {
        income += row.amount;
        incomeByCategory.set(
          row.category,
          (incomeByCategory.get(row.category) ?? 0) + row.amount,
        );
      } else {
        expense += row.amount;
        expenseByCategory.set(
          row.category,
          (expenseByCategory.get(row.category) ?? 0) + row.amount,
        );
      }
    }

    const toBreakdown = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

    return {
      income,
      expense,
      balance: income - expense,
      count: rows.length,
      expenseByCategory: toBreakdown(expenseByCategory),
      incomeByCategory: toBreakdown(incomeByCategory),
    };
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    occurred_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    return await ctx.db.insert("transactions", {
      book_id: args.bookId,
      type: args.type,
      amount: cleanAmount(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      note: (args.note ?? "").trim().slice(0, 200),
      occurred_at: args.occurred_at,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    occurred_at: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing === null) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    await requireMember(ctx, existing.book_id);
    await ctx.db.patch(args.id, {
      type: args.type,
      amount: cleanAmount(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      note: (args.note ?? "").trim().slice(0, 200),
      occurred_at: args.occurred_at,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (existing === null) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    await requireMember(ctx, existing.book_id);
    await ctx.db.delete(id);
  },
});
