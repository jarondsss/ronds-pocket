import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  logActivity,
  notifyMembers,
  requireMember,
  rupiah,
} from "./books";

function cleanMoney(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`Nominal ${label} sepertinya tidak valid.`);
  }
  const rounded = Math.round(value);
  if (rounded <= 0) {
    throw new Error(`Nominal ${label} harus lebih dari 0 ya.`);
  }
  if (rounded > 1_000_000_000_000) {
    throw new Error(`Nominal ${label} kegedean. Cek lagi ya.`);
  }
  return rounded;
}

function cleanText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} jangan dikosongkan ya.`);
  }
  return trimmed.slice(0, 80);
}

function cleanDate(value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) {
    throw new Error("Tanggalnya sepertinya tidak valid.");
  }
  return Math.round(value);
}

/**
 * Utang & piutang dalam satu kantong, plus ringkasan kekayaan bersih.
 * Net worth = total dompet + tabungan + tujuan - utang + piutang,
 * seperti Wealth Hub di kynan.id.
 */
export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);

    const rows = (
      await ctx.db
        .query("liabilities")
        .withIndex("by_book", (q) => q.eq("book_id", bookId))
        .collect()
    ).sort((a, b) => b.created_at - a.created_at);

    // Total dompet memakai logika yang sama dengan halaman Dompet:
    // saldo awal + transaksi + transfer antar dompet.
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const walletIds = new Set(wallets.map((wallet) => wallet._id));
    const balances = new Map<string, number>();
    for (const wallet of wallets) {
      balances.set(wallet._id, wallet.opening_balance);
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    for (const tx of transactions) {
      if (!tx.wallet_id || !walletIds.has(tx.wallet_id)) continue;
      const current = balances.get(tx.wallet_id) ?? 0;
      balances.set(
        tx.wallet_id,
        current + (tx.type === "income" ? tx.amount : -tx.amount),
      );
    }

    const transfers = await ctx.db
      .query("wallet_transfers")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
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
    const walletTotal = [...balances.values()].reduce(
      (sum, value) => sum + value,
      0,
    );

    // Tabungan: saldo awal + setoran - penarikan.
    const savingsRows = await ctx.db
      .query("savings")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const savingsEntries = await ctx.db
      .query("savings_entries")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const savingsDelta = new Map<string, number>();
    for (const entry of savingsEntries) {
      const delta =
        (savingsDelta.get(entry.savings_id) ?? 0) +
        (entry.type === "deposit" ? entry.amount : -entry.amount);
      savingsDelta.set(entry.savings_id, delta);
    }
    const savingsTotal = savingsRows.reduce(
      (sum, row) => sum + row.principal + (savingsDelta.get(row._id) ?? 0),
      0,
    );

    // Dana tujuan: yang sudah terkumpul dihitung bagian dari kekayaan.
    const goalsTotal = (
      await ctx.db
        .query("goals")
        .withIndex("by_book", (q) => q.eq("book_id", bookId))
        .collect()
    ).reduce((sum, row) => sum + row.saved_amount, 0);

    const liabilities = rows.map((row) => ({
      _id: row._id,
      name: row.name,
      kind: row.kind,
      counterparty: row.counterparty,
      balance: row.balance,
      due_date: row.due_date,
      note: row.note,
      settled_at: row.settled_at,
      created_at: row.created_at,
    }));

    // Yang masih berjalan saja yang ikut hitungan; yang lunas tinggal riwayat.
    const utang = liabilities
      .filter((row) => row.kind === "utang" && row.settled_at === undefined)
      .reduce((sum, row) => sum + row.balance, 0);
    const piutang = liabilities
      .filter((row) => row.kind === "piutang" && row.settled_at === undefined)
      .reduce((sum, row) => sum + row.balance, 0);

    return {
      liabilities,
      summary: {
        wallets: walletTotal,
        savings: savingsTotal,
        goals: goalsTotal,
        utang,
        piutang,
        netWorth: walletTotal + savingsTotal + goalsTotal - utang + piutang,
      },
    };
  },
});

const kindValidator = v.union(v.literal("utang"), v.literal("piutang"));

export const create = mutation({
  args: {
    bookId: v.id("books"),
    name: v.string(),
    kind: kindValidator,
    counterparty: v.string(),
    balance: v.number(),
    dueDate: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    const name = cleanText(args.name, "Namanya");
    const counterparty = cleanText(
      args.counterparty,
      "Nama lawan transaksinya",
    );
    const balance = cleanMoney(args.balance, "Nominalnya");

    const id = await ctx.db.insert("liabilities", {
      book_id: args.bookId,
      name,
      kind: args.kind,
      counterparty,
      balance,
      due_date: cleanDate(args.dueDate),
      note: (args.note ?? "").trim().slice(0, 160),
      created_by: userId,
      created_at: Date.now(),
    });

    await logActivity(ctx, {
      bookId: args.bookId,
      actorId: userId,
      action: "create",
      target: args.kind === "utang" ? "utang" : "piutang",
      label: name,
      detail: rupiah(balance),
    });
    await notifyMembers(ctx, {
      bookId: args.bookId,
      actorId: userId,
      message:
        args.kind === "utang" ? "menambah utang baru" : "menambah piutang baru",
      label: name,
      detail: rupiah(balance),
    });
    return id;
  },
});

/**
 * Ubah catatan utang/piutang, termasuk tandai lunas.
 * Seperti anggaran, catatan ini sengaja boleh disentuh semua anggota
 * karena sifatnya disepakati berdua.
 */
export const update = mutation({
  args: {
    id: v.id("liabilities"),
    name: v.optional(v.string()),
    counterparty: v.optional(v.string()),
    balance: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    note: v.optional(v.string()),
    settled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (row === null) {
      throw new Error("Catatannya sudah tidak ada.");
    }
    const { userId } = await requireMember(ctx, row.book_id);

    const patch: Partial<typeof row> = {};
    if (args.name !== undefined) patch.name = cleanText(args.name, "Namanya");
    if (args.counterparty !== undefined) {
      patch.counterparty = cleanText(
        args.counterparty,
        "Nama lawan transaksinya",
      );
    }
    if (args.balance !== undefined) {
      patch.balance = cleanMoney(args.balance, "Nominalnya");
    }
    if (args.dueDate !== undefined) patch.due_date = cleanDate(args.dueDate);
    if (args.note !== undefined) {
      patch.note = args.note.trim().slice(0, 160);
    }
    if (args.settled !== undefined) {
      patch.settled_at = args.settled ? Date.now() : undefined;
    }

    if (Object.keys(patch).length === 0) return;

    await ctx.db.patch(args.id, patch);
    await logActivity(ctx, {
      bookId: row.book_id,
      actorId: userId,
      action: "update",
      target: row.kind === "utang" ? "utang" : "piutang",
      label: patch.name ?? row.name,
      detail:
        args.settled === true
          ? "ditandai lunas"
          : rupiah(patch.balance ?? row.balance),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("liabilities") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (row === null) return;
    const { userId } = await requireMember(ctx, row.book_id);

    await ctx.db.delete(id);
    await logActivity(ctx, {
      bookId: row.book_id,
      actorId: userId,
      action: "delete",
      target: row.kind === "utang" ? "utang" : "piutang",
      label: row.name,
      detail: rupiah(row.balance),
    });
  },
});
