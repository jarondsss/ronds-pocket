import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireOwnerOrCreator } from "./books";

function cleanTarget(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Nominalnya sepertinya tidak valid.");
  }
  const rounded = Math.round(value);
  if (rounded <= 0) {
    throw new Error("Targetnya harus lebih dari 0 ya.");
  }
  return rounded;
}

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("goals")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    return rows
      .sort((a, b) => a.deadline - b.deadline)
      .map((row) => ({
        _id: row._id,
        name: row.name,
        target_amount: row.target_amount,
        saved_amount: row.saved_amount,
        deadline: row.deadline,
        created_at: row.created_at,
      }));
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    name: v.string(),
    target_amount: v.number(),
    deadline: v.number(),
    saved_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama targetnya jangan dikosongkan ya.");
    }
    return await ctx.db.insert("goals", {
      book_id: args.bookId,
      name: name.slice(0, 60),
      target_amount: cleanTarget(args.target_amount),
      saved_amount: Math.max(0, Math.round(args.saved_amount ?? 0)),
      deadline: args.deadline,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.string(),
    target_amount: v.number(),
    deadline: v.number(),
    saved_amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (goal === null) {
      throw new Error("Targetnya tidak ketemu.");
    }
    await requireOwnerOrCreator(ctx, goal.book_id, goal.created_by);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama targetnya jangan dikosongkan ya.");
    }
    await ctx.db.patch(args.id, {
      name: name.slice(0, 60),
      target_amount: cleanTarget(args.target_amount),
      deadline: args.deadline,
      saved_amount: Math.max(0, Math.round(args.saved_amount)),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, { id }) => {
    const goal = await ctx.db.get(id);
    if (goal === null) return null;
    await requireOwnerOrCreator(ctx, goal.book_id, goal.created_by);
    await ctx.db.delete(id);
    return null;
  },
});

/**
 * Tambah atau tarik dana dari target. Kalau dompet dipilih, saldo dompet
 * ikut disesuaikan supaya buku kas tetap konsisten.
 */
export const adjustFunds = mutation({
  args: {
    id: v.id("goals"),
    amount: v.number(), // positif = menabung, negatif = menarik
    wallet_id: v.optional(v.id("wallets")),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (goal === null) {
      throw new Error("Targetnya tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(ctx, goal.book_id, goal.created_by);

    if (!Number.isFinite(args.amount) || args.amount === 0) {
      throw new Error("Isi nominalnya dulu ya.");
    }
    const amount = Math.round(args.amount);
    const nextSaved = goal.saved_amount + amount;
    if (nextSaved < 0) {
      throw new Error("Dananya tidak cukup untuk ditarik sebanyak itu.");
    }

    await ctx.db.patch(args.id, { saved_amount: nextSaved });

    if (args.wallet_id) {
      const wallet = await ctx.db.get(args.wallet_id);
      if (wallet === null || wallet.book_id !== goal.book_id) {
        throw new Error("Dompetnya tidak ada di kantong ini.");
      }
      await ctx.db.insert("wallet_transfers", {
        book_id: goal.book_id,
        from_wallet_id: amount > 0 ? args.wallet_id : undefined,
        to_wallet_id: amount > 0 ? undefined : args.wallet_id,
        amount: Math.abs(amount),
        note: `${amount > 0 ? "Setor" : "Tarik"} target: ${goal.name}`,
        occurred_at: Date.now(),
        created_by: userId,
        created_at: Date.now(),
      });
    }

    return nextSaved;
  },
});
