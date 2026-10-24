import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  assertUsersInBook,
  cleanTimestamp,
  displayNameOf,
  logActivity,
  notifyMembers,
  requireMember,
  requireOwnerOrCreator,
  rupiah,
  sanitizeInput,
} from "./books";

/** Nama singkat buat jejak riwayat: catatannya dulu, lalu kategorinya. */
function describeTransaction(category?: string, note?: string) {
  const cleanNote = (note ?? "").trim();
  if (cleanNote) return cleanNote;
  const cleanCategory = (category ?? "").trim();
  return cleanCategory || "Transaksi";
}

const MAX_AMOUNT = 1_000_000_000_000; // 1 triliun rupiah, guard against typos

/**
 * Hitung total pengeluaran kategori tertentu di bulan tertentu.
 * Lebih efisien dari load semua transaksi lalu filter manual.
 */
async function getMonthlySpending(
  ctx: QueryCtx,
  bookId: Id<"books">,
  category: string,
  monthStart: number,
  monthEnd: number,
): Promise<number> {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_book_occurred", (q) =>
      q.eq("book_id", bookId).gte("occurred_at", monthStart).lt("occurred_at", monthEnd),
    )
    .collect();

  return transactions
    .filter((tx) => tx.type === "expense" && tx.category === category)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

async function assertWalletInBook(
  ctx: QueryCtx,
  bookId: Id<"books">,
  walletId: Id<"wallets"> | undefined,
) {
  if (!walletId) return;
  const wallet = await ctx.db.get(walletId);
  if (wallet === null || wallet.book_id !== bookId) {
    throw new Error("Dompetnya tidak ada di kantong ini.");
  }
}

async function loadTransactions(
  ctx: QueryCtx,
  bookId: Id<"books">,
  from?: number,
  to?: number,
  limit?: number,
): Promise<Doc<"transactions">[]> {
  const maxResults = limit ?? 500; // default max 500 transaksi
  
  if (from !== undefined && to !== undefined) {
    return await ctx.db
      .query("transactions")
      .withIndex("by_book_occurred", (q) =>
        q.eq("book_id", bookId).gte("occurred_at", from).lt("occurred_at", to),
      )
      .order("desc")
      .take(maxResults);
  }
  return await ctx.db
    .query("transactions")
    .withIndex("by_book_occurred", (q) => q.eq("book_id", bookId))
    .order("desc")
    .take(maxResults);
}

function cleanAmount(amount: number) {
  if (!Number.isFinite(amount)) {
    throw new Error("Nominalnya sepertinya tidak valid.");
  }
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    throw new Error("Nominalnya harus lebih dari 0 ya.");
  }
  if (rounded > MAX_AMOUNT) {
    throw new Error("Nominalnya kegedean. Cek lagi ya.");
  }
  return rounded;
}

/** Transactions for a book, newest first, optionally limited to one month. */
export const list = query({
  args: {
    bookId: v.id("books"),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { bookId, from, to, limit }) => {
    await requireMember(ctx, bookId);
    const rows = await loadTransactions(ctx, bookId, from, to, limit);

    const people = new Map<string, { name: string; avatar: string | null }>();
    const readPerson = async (userId: Id<"users">) => {
      const cached = people.get(userId);
      if (cached !== undefined) return cached;
      const user = await ctx.db.get(userId);
      const person = {
        name: displayNameOf(user),
        avatar: user?.avatar ?? null,
      };
      people.set(userId, person);
      return person;
    };

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const walletById = new Map(wallets.map((wallet) => [wallet._id, wallet]));

    const withNames = await Promise.all(
      rows.map(async (row) => {
        const wallet = row.wallet_id
          ? walletById.get(row.wallet_id)
          : undefined;
        return {
          _id: row._id,
          type: row.type,
          amount: row.amount,
          category: row.category,
          note: row.note,
          occurred_at: row.occurred_at,
          created_by: row.created_by,
          created_at: row.created_at,
          createdByName: (await readPerson(row.created_by)).name,
          createdByAvatar: (await readPerson(row.created_by)).avatar,
          wallet_id: row.wallet_id ?? null,
          walletName: wallet?.name ?? null,
          walletIcon: wallet?.icon ?? null,
        };
      }),
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

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const colors = new Map(
      categories.map((category) => [category.name, category.color]),
    );

    const toBreakdown = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([category, total]) => ({
          category,
          total,
          color: colors.get(category) ?? null,
        }))
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
    wallet_id: v.optional(v.id("wallets")),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    occurred_at: v.number(),
    paid_by: v.optional(v.id("users")),
    split_with: v.optional(v.id("users")),
    split_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    await assertWalletInBook(ctx, args.bookId, args.wallet_id);
    // Pembagian tagihan hanya boleh menunjuk anggota kantong ini.
    await assertUsersInBook(ctx, args.bookId, [args.paid_by, args.split_with]);
    const amount = cleanAmount(args.amount);
    const splitAmount = args.split_amount
      ? cleanAmount(args.split_amount)
      : undefined;
    
    // Validasi: kalau split_with diisi, split_amount wajib
    if (args.split_with && !splitAmount) {
      throw new Error("Isi berapa yang harus dibayar temanmu.");
    }
    
    if (splitAmount !== undefined && splitAmount > amount) {
      throw new Error("Bagian yang dibagi tidak boleh lebih besar dari totalnya.");
    }
    
    // Validasi: expense dari wallet harus cukup saldo (kecuali credit card)
    // Note: Ini optional validation — user bisa pilih gak pake wallet
    if (args.type === "expense" && args.wallet_id) {
      // Import validateSufficientBalance dari wallets module
      // Tapi karena circular dependency, gua compute inline aja
      const wallet = await ctx.db.get(args.wallet_id);
      if (wallet && wallet.type !== "credit") {
        const allWallets = await ctx.db
          .query("wallets")
          .withIndex("by_book", (q) => q.eq("book_id", args.bookId))
          .collect();
        
        // Compute current balance (simplified inline)
        const transactions = await ctx.db
          .query("transactions")
          .withIndex("by_book", (q) => q.eq("book_id", args.bookId))
          .collect();
        const transfers = await ctx.db
          .query("wallet_transfers")
          .withIndex("by_book", (q) => q.eq("book_id", args.bookId))
          .collect();
        
        let balance = wallet.opening_balance;
        for (const tx of transactions) {
          if (tx.wallet_id === args.wallet_id) {
            balance += tx.type === "income" ? tx.amount : -tx.amount;
          }
        }
        for (const move of transfers) {
          if (move.from_wallet_id === args.wallet_id) balance -= move.amount;
          if (move.to_wallet_id === args.wallet_id) balance += move.amount;
        }
        
        if (balance < amount) {
          const shortfall = amount - balance;
          throw new Error(
            `Saldo ${wallet.name} tidak cukup. Kurang ${rupiah(shortfall)}.`
          );
        }
      }
    }
    
    await logActivity(ctx, {
      bookId: args.bookId,
      actorId: userId,
      action: "create",
      target: "transaksi",
      label: describeTransaction(args.category, args.note),
      detail: `${args.type === "income" ? "Masuk" : "Keluar"} ${rupiah(args.amount)}`,
    });
    await notifyMembers(ctx, {
      bookId: args.bookId,
      actorId: userId,
      message:
        args.type === "income" ? "nambah pemasukan" : "nambah pengeluaran",
      label: describeTransaction(args.category, args.note),
      detail: `${args.type === "income" ? "+" : "−"}${rupiah(args.amount)}`,
    });
    const txId =    await ctx.db.insert("transactions", {
      book_id: args.bookId,
      wallet_id: args.wallet_id,
      type: args.type,
      amount,
      category: sanitizeInput(args.category).slice(0, 40),
      note: sanitizeInput(args.note).slice(0, 200),
      occurred_at: cleanTimestamp(args.occurred_at),
      created_by: userId,
      created_at: Date.now(),
      paid_by: args.paid_by ?? userId,
      split_with: args.split_with,
      split_amount: splitAmount,
    });

    // Cek overspend: kalau transaksi ini expense dan ada anggaran untuk kategorinya,
    // hitung total pengeluaran bulan ini dan kirim notifikasi kalau lewat batas.
    if (args.type === "expense" && args.category) {
      const category = (args.category ?? "").trim();
      if (category) {
        const budget = await ctx.db
          .query("budgets")
          .withIndex("by_book_category", (q) =>
            q.eq("book_id", args.bookId).eq("category", category),
          )
          .unique();

        if (budget !== null) {
          // Hitung total pengeluaran kategori ini di bulan transaksi
          const txDate = new Date(args.occurred_at);
          const monthStart = new Date(
            txDate.getFullYear(),
            txDate.getMonth(),
            1,
            0,
            0,
            0,
            0,
          ).getTime();
          const monthEnd = new Date(
            txDate.getFullYear(),
            txDate.getMonth() + 1,
            1,
            0,
            0,
            0,
            0,
          ).getTime();

          const spent = await getMonthlySpending(
            ctx,
            args.bookId,
            category,
            monthStart,
            monthEnd,
          );

          if (spent > budget.amount) {
            const excess = spent - budget.amount;
            await notifyMembers(ctx, {
              bookId: args.bookId,
              actorId: userId,
              message: `anggaran ${category} terlampaui`,
              label: category,
              detail: `Lewat ${rupiah(excess)} dari ${rupiah(budget.amount)}`,
            });
          }
        }
      }
    }

    return txId;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    wallet_id: v.optional(v.id("wallets")),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    occurred_at: v.number(),
    paid_by: v.optional(v.id("users")),
    split_with: v.optional(v.id("users")),
    split_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing === null) {
      throw new Error("Catatannya tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(
      ctx,
      existing.book_id,
      existing.created_by,
    );
    await assertWalletInBook(ctx, existing.book_id, args.wallet_id);
    await assertUsersInBook(ctx, existing.book_id, [
      args.paid_by,
      args.split_with,
    ]);
    const amount = cleanAmount(args.amount);
    const splitAmount = args.split_amount
      ? cleanAmount(args.split_amount)
      : undefined;
    if (splitAmount !== undefined && splitAmount > amount) {
      throw new Error("Bagian yang dibagi tidak boleh lebih besar dari totalnya.");
    }
    await logActivity(ctx, {
      bookId: existing.book_id,
      actorId: userId,
      action: "update",
      target: "transaksi",
      label: describeTransaction(existing.category, existing.note),
      detail: `Jadi ${rupiah(args.amount)}`,
    });
    await ctx.db.patch(args.id, {
      wallet_id: args.wallet_id,
      type: args.type,
      amount,
      category: sanitizeInput(args.category).slice(0, 40),
      note: sanitizeInput(args.note).slice(0, 200),
      occurred_at: cleanTimestamp(args.occurred_at),
      paid_by: args.paid_by,
      split_with: args.split_with,
      split_amount: splitAmount,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (existing === null) {
      throw new Error("Catatannya tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(
      ctx,
      existing.book_id,
      existing.created_by,
    );
    await logActivity(ctx, {
      bookId: existing.book_id,
      actorId: userId,
      action: "delete",
      target: "transaksi",
      label: describeTransaction(existing.category, existing.note),
      detail: rupiah(existing.amount),
    });
    await ctx.db.delete(id);
  },
});
