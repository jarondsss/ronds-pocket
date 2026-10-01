import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireOwnerOrCreator } from "./books";

function cleanMoney(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`Nominal ${label} sepertinya tidak valid.`);
  }
  const rounded = Math.round(value);
  if (rounded < 0) {
    throw new Error(`Nominal ${label} tidak boleh minus.`);
  }
  return rounded;
}

function cleanRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

/** Tabungan + saldo berjalan (setoran awal + setor - tarik) + proyeksi bunga. */
export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);

    const accounts = (
      await ctx.db
        .query("savings")
        .withIndex("by_book", (q) => q.eq("book_id", bookId))
        .collect()
    ).sort((a, b) => b.created_at - a.created_at);

    const entries = await ctx.db
      .query("savings_entries")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const byAccount = new Map<string, { deposit: number; withdraw: number; count: number }>();
    for (const entry of entries) {
      const bucket = byAccount.get(entry.savings_id) ?? {
        deposit: 0,
        withdraw: 0,
        count: 0,
      };
      if (entry.type === "deposit") bucket.deposit += entry.amount;
      else bucket.withdraw += entry.amount;
      bucket.count += 1;
      byAccount.set(entry.savings_id, bucket);
    }

    const rows = accounts.map((account) => {
      const bucket = byAccount.get(account._id) ?? {
        deposit: 0,
        withdraw: 0,
        count: 0,
      };
      const balance = account.principal + bucket.deposit - bucket.withdraw;
      return {
        _id: account._id,
        name: account.name,
        kind: account.kind,
        principal: account.principal,
        interest_rate: account.interest_rate,
        started_at: account.started_at,
        balance,
        deposited: bucket.deposit,
        withdrawn: bucket.withdraw,
        entryCount: bucket.count,
        /** Proyeksi sederhana: saldo + bunga setahun. */
        projected: Math.round(balance * (1 + account.interest_rate / 100)),
        yearlyInterest: Math.round((balance * account.interest_rate) / 100),
      };
    });

    return {
      accounts: rows,
      total: rows.reduce((sum, row) => sum + row.balance, 0),
      potentialInterest: rows.reduce((sum, row) => sum + row.yearlyInterest, 0),
    };
  },
});

export const entries = query({
  args: { savingsId: v.id("savings") },
  handler: async (ctx, { savingsId }) => {
    const account = await ctx.db.get(savingsId);
    if (account === null) {
      throw new Error("Tabungannya tidak ketemu.");
    }
    await requireMember(ctx, account.book_id);
    const rows = await ctx.db
      .query("savings_entries")
      .withIndex("by_savings", (q) => q.eq("savings_id", savingsId))
      .collect();
    return rows
      .sort((a, b) => b.occurred_at - a.occurred_at)
      .map((row) => ({
        _id: row._id,
        type: row.type,
        amount: row.amount,
        occurred_at: row.occurred_at,
      }));
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    name: v.string(),
    kind: v.string(),
    principal: v.number(),
    interest_rate: v.number(),
    started_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama tabungannya jangan dikosongkan ya.");
    }
    return await ctx.db.insert("savings", {
      book_id: args.bookId,
      name: name.slice(0, 60),
      kind: args.kind,
      principal: cleanMoney(args.principal, "awal"),
      interest_rate: cleanRate(args.interest_rate),
      started_at: args.started_at,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("savings"),
    name: v.string(),
    kind: v.string(),
    principal: v.number(),
    interest_rate: v.number(),
    started_at: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (account === null) {
      throw new Error("Tabungannya tidak ketemu.");
    }
    await requireOwnerOrCreator(ctx, account.book_id, account.created_by);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama tabungannya jangan dikosongkan ya.");
    }
    await ctx.db.patch(args.id, {
      name: name.slice(0, 60),
      kind: args.kind,
      principal: cleanMoney(args.principal, "awal"),
      interest_rate: cleanRate(args.interest_rate),
      started_at: args.started_at,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("savings") },
  handler: async (ctx, { id }) => {
    const account = await ctx.db.get(id);
    if (account === null) return null;
    await requireOwnerOrCreator(ctx, account.book_id, account.created_by);
    const rows = await ctx.db
      .query("savings_entries")
      .withIndex("by_savings", (q) => q.eq("savings_id", id))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(id);
    return null;
  },
});

export const deposit = mutation({
  args: {
    id: v.id("savings"),
    amount: v.number(),
    occurred_at: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (account === null) {
      throw new Error("Tabungannya tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(ctx, account.book_id, account.created_by);
    const amount = Math.round(args.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Nominal setornya harus lebih dari 0 ya.");
    }
    await ctx.db.insert("savings_entries", {
      book_id: account.book_id,
      savings_id: args.id,
      type: "deposit",
      amount,
      occurred_at: args.occurred_at,
      created_by: userId,
      created_at: Date.now(),
    });
    return null;
  },
});

export const withdraw = mutation({
  args: {
    id: v.id("savings"),
    amount: v.number(),
    occurred_at: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (account === null) {
      throw new Error("Tabungannya tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(ctx, account.book_id, account.created_by);
    const amount = Math.round(args.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Nominal tariknya harus lebih dari 0 ya.");
    }

    const rows = await ctx.db
      .query("savings_entries")
      .withIndex("by_savings", (q) => q.eq("savings_id", args.id))
      .collect();
    const balance = rows.reduce(
      (sum, row) => sum + (row.type === "deposit" ? row.amount : -row.amount),
      account.principal,
    );
    if (amount > balance) {
      throw new Error("Saldo tabungannya tidak cukup untuk ditarik segitu.");
    }

    await ctx.db.insert("savings_entries", {
      book_id: account.book_id,
      savings_id: args.id,
      type: "withdraw",
      amount,
      occurred_at: args.occurred_at,
      created_by: userId,
      created_at: Date.now(),
    });
    return null;
  },
});

export const removeEntry = mutation({
  args: { id: v.id("savings_entries") },
  handler: async (ctx, { id }) => {
    const entry = await ctx.db.get(id);
    if (entry === null) return null;
    await requireOwnerOrCreator(ctx, entry.book_id, entry.created_by);
    await ctx.db.delete(id);
    return null;
  },
});
