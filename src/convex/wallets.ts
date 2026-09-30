import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./books";

type Ctx = QueryCtx | MutationCtx;

const MAX_AMOUNT = 1_000_000_000_000;

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

async function requireWalletInBook(
  ctx: Ctx,
  bookId: Id<"books">,
  walletId: Id<"wallets">,
) {
  const wallet = await ctx.db.get(walletId);
  if (wallet === null || wallet.book_id !== bookId) {
    throw new Error("Dompetnya tidak ada di kantong ini.");
  }
  return wallet;
}

/** Saldo tiap dompet = saldo awal + transaksi + transfer masuk/keluar. */
async function computeBalances(
  ctx: Ctx,
  bookId: Id<"books">,
  wallets: Doc<"wallets">[],
): Promise<Map<string, number>> {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_book", (q) => q.eq("book_id", bookId))
    .collect();
  const transfers = await ctx.db
    .query("wallet_transfers")
    .withIndex("by_book", (q) => q.eq("book_id", bookId))
    .collect();

  const balances = new Map<string, number>();
  for (const wallet of wallets) {
    balances.set(wallet._id, wallet.opening_balance);
  }

  for (const tx of transactions) {
    if (!tx.wallet_id) continue;
    const current = balances.get(tx.wallet_id);
    if (current === undefined) continue;
    balances.set(
      tx.wallet_id,
      current + (tx.type === "income" ? tx.amount : -tx.amount),
    );
  }

  for (const move of transfers) {
    if (move.from_wallet_id) {
      const current = balances.get(move.from_wallet_id);
      if (current !== undefined) {
        balances.set(move.from_wallet_id, current - move.amount);
      }
    }
    if (move.to_wallet_id) {
      const current = balances.get(move.to_wallet_id);
      if (current !== undefined) {
        balances.set(move.to_wallet_id, current + move.amount);
      }
    }
  }

  return balances;
}

/** Semua dompet di kantong ini beserta saldonya, plus total saldo. */
export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const wallets = (
      await ctx.db
        .query("wallets")
        .withIndex("by_book", (q) => q.eq("book_id", bookId))
        .collect()
    ).sort((a, b) => a.created_at - b.created_at);

    const balances = await computeBalances(ctx, bookId, wallets);
    const withBalances = wallets.map((wallet) => ({
      _id: wallet._id,
      name: wallet.name,
      type: wallet.type,
      icon: wallet.icon,
      color: wallet.color,
      opening_balance: wallet.opening_balance,
      balance: balances.get(wallet._id) ?? wallet.opening_balance,
    }));

    return {
      wallets: withBalances,
      total: withBalances.reduce((sum, wallet) => sum + wallet.balance, 0),
    };
  },
});

/** Riwayat transfer & penyesuaian saldo, terbaru dulu. */
export const transfers = query({
  args: { bookId: v.id("books"), limit: v.optional(v.number()) },
  handler: async (ctx, { bookId, limit }) => {
    await requireMember(ctx, bookId);
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const names = new Map(wallets.map((wallet) => [wallet._id, wallet]));

    const rows = await ctx.db
      .query("wallet_transfers")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    return rows
      .sort((a, b) => b.occurred_at - a.occurred_at)
      .slice(0, limit ?? 12)
      .map((row) => ({
        _id: row._id,
        amount: row.amount,
        note: row.note,
        occurred_at: row.occurred_at,
        from: row.from_wallet_id
          ? {
              name: names.get(row.from_wallet_id)?.name ?? "Dompet terhapus",
              icon: names.get(row.from_wallet_id)?.icon ?? "❔",
            }
          : null,
        to: row.to_wallet_id
          ? {
              name: names.get(row.to_wallet_id)?.name ?? "Dompet terhapus",
              icon: names.get(row.to_wallet_id)?.icon ?? "❔",
            }
          : null,
      }));
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    name: v.string(),
    type: v.string(),
    icon: v.string(),
    color: v.string(),
    opening_balance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama dompetnya jangan dikosongkan ya.");
    }
    const opening = Math.round(args.opening_balance ?? 0);
    return await ctx.db.insert("wallets", {
      book_id: args.bookId,
      name: name.slice(0, 40),
      type: args.type,
      icon: args.icon,
      color: args.color,
      opening_balance: opening,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("wallets"),
    name: v.string(),
    type: v.string(),
    icon: v.string(),
    color: v.string(),
    opening_balance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.id);
    if (wallet === null) {
      throw new Error("Dompetnya tidak ketemu.");
    }
    await requireMember(ctx, wallet.book_id);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama dompetnya jangan dikosongkan ya.");
    }
    await ctx.db.patch(args.id, {
      name: name.slice(0, 40),
      type: args.type,
      icon: args.icon,
      color: args.color,
      opening_balance: Math.round(args.opening_balance ?? 0),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("wallets") },
  handler: async (ctx, { id }) => {
    const wallet = await ctx.db.get(id);
    if (wallet === null) {
      throw new Error("Dompetnya tidak ketemu.");
    }
    await requireMember(ctx, wallet.book_id);
    await ctx.db.delete(id);
  },
});

/**
 * Pindah uang antar dompet, atau tambah/kurangi saldo manual:
 * isi dua dompet untuk pindah, satu saja untuk menyesuaikan saldo.
 */
export const transfer = mutation({
  args: {
    bookId: v.id("books"),
    from_wallet_id: v.optional(v.id("wallets")),
    to_wallet_id: v.optional(v.id("wallets")),
    amount: v.number(),
    note: v.optional(v.string()),
    occurred_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const { from_wallet_id: from, to_wallet_id: to } = args;

    if (!from && !to) {
      throw new Error("Pilih dompet asal atau dompet tujuannya dulu ya.");
    }
    if (from && to && from === to) {
      throw new Error("Dompet asal dan tujuannya tidak boleh sama.");
    }
    if (from) await requireWalletInBook(ctx, args.bookId, from);
    if (to) await requireWalletInBook(ctx, args.bookId, to);

    return await ctx.db.insert("wallet_transfers", {
      book_id: args.bookId,
      from_wallet_id: from,
      to_wallet_id: to,
      amount: cleanAmount(args.amount),
      note: (args.note ?? "").trim().slice(0, 120),
      occurred_at: args.occurred_at,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const removeTransfer = mutation({
  args: { id: v.id("wallet_transfers") },
  handler: async (ctx, { id }) => {
    const move = await ctx.db.get(id);
    if (move === null) {
      throw new Error("Catatan perpindahannya tidak ketemu.");
    }
    await requireMember(ctx, move.book_id);
    await ctx.db.delete(id);
  },
});
