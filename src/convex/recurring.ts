import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  logActivity,
  notifyMembers,
  requireMember,
  requireOwnerOrCreator,
  rupiah,
} from "./books";
import { frequencyValidator } from "./schema";

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

async function assertWalletInBook(
  ctx: { db: MutationCtx["db"] },
  bookId: Id<"books">,
  walletId: Id<"wallets"> | undefined,
) {
  if (!walletId) return;
  const wallet = await ctx.db.get(walletId);
  if (wallet === null || wallet.book_id !== bookId) {
    throw new Error("Dompetnya tidak ada di kantong ini.");
  }
}

/** Hitung timestamp next_due berikutnya berdasarkan frekuensi. */
function advanceDue(
  currentDue: number,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
): number {
  const d = new Date(currentDue);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.getTime();
}

function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case "daily":
      return "harian";
    case "weekly":
      return "mingguan";
    case "monthly":
      return "bulanan";
    case "yearly":
      return "tahunan";
    default:
      return frequency;
  }
}

// ───────── Queries ─────────

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("recurring_transactions")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    const walletById = new Map(wallets.map((w) => [w._id, w]));

    return rows
      .map((row) => {
        const wallet = row.wallet_id
          ? walletById.get(row.wallet_id)
          : undefined;
        return {
          ...row,
          walletName: wallet?.name ?? null,
          walletIcon: wallet?.icon ?? null,
        };
      })
      .sort((a, b) => a.next_due - b.next_due);
  },
});

// ───────── Mutations ─────────

export const create = mutation({
  args: {
    bookId: v.id("books"),
    wallet_id: v.optional(v.id("wallets")),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    frequency: frequencyValidator,
    next_due: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);
    await assertWalletInBook(ctx, args.bookId, args.wallet_id);
    const label = (args.note ?? "").trim() || (args.category ?? "").trim() || "Transaksi berulang";
    await logActivity(ctx, {
      bookId: args.bookId,
      actorId: userId,
      action: "create",
      target: "transaksi berulang",
      label,
      detail: `${frequencyLabel(args.frequency)}, ${rupiah(args.amount)}`,
    });
    return await ctx.db.insert("recurring_transactions", {
      book_id: args.bookId,
      wallet_id: args.wallet_id,
      type: args.type,
      amount: cleanAmount(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      note: (args.note ?? "").trim().slice(0, 200),
      frequency: args.frequency,
      next_due: args.next_due,
      enabled: true,
      created_by: userId,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recurring_transactions"),
    wallet_id: v.optional(v.id("wallets")),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    frequency: frequencyValidator,
    next_due: v.number(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing === null) {
      throw new Error("Transaksi berulang ini tidak ketemu.");
    }
    await requireOwnerOrCreator(ctx, existing.book_id, existing.created_by);
    await assertWalletInBook(ctx, existing.book_id, args.wallet_id);
    await ctx.db.patch(args.id, {
      wallet_id: args.wallet_id,
      type: args.type,
      amount: cleanAmount(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      note: (args.note ?? "").trim().slice(0, 200),
      frequency: args.frequency,
      next_due: args.next_due,
      enabled: args.enabled,
    });
  },
});

export const toggle = mutation({
  args: {
    id: v.id("recurring_transactions"),
    enabled: v.boolean(),
  },
  handler: async (ctx, { id, enabled }) => {
    const existing = await ctx.db.get(id);
    if (existing === null) {
      throw new Error("Transaksi berulang ini tidak ketemu.");
    }
    await requireOwnerOrCreator(ctx, existing.book_id, existing.created_by);
    await ctx.db.patch(id, { enabled });
  },
});

export const remove = mutation({
  args: { id: v.id("recurring_transactions") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (existing === null) {
      throw new Error("Transaksi berulang ini tidak ketemu.");
    }
    const { userId } = await requireOwnerOrCreator(
      ctx,
      existing.book_id,
      existing.created_by,
    );
    const label = existing.note.trim() || existing.category.trim() || "Transaksi berulang";
    await logActivity(ctx, {
      bookId: existing.book_id,
      actorId: userId,
      action: "delete",
      target: "transaksi berulang",
      label,
      detail: `${frequencyLabel(existing.frequency)}, ${rupiah(existing.amount)}`,
    });
    await ctx.db.delete(id);
  },
});

// ───────── Cron handler ─────────

/**
 * Proses semua recurring_transactions yang sudah jatuh tempo (next_due <= now).
 * Dipanggil oleh cron setiap jam. Untuk setiap template yang due:
 *   1. Buat transaksi asli
 *   2. Geser next_due ke periode berikutnya
 *   3. Ulangi kalau masih due (misal user baru buka app setelah lama)
 */
export const processDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dueTemplates = await ctx.db
      .query("recurring_transactions")
      .withIndex("by_next_due", (q) =>
        q.eq("enabled", true).lte("next_due", now),
      )
      .collect();

    for (const template of dueTemplates) {
      let nextDue = template.next_due;

      // Buat transaksi untuk setiap periode yang terlewat (catch up)
      while (nextDue <= now) {
        await ctx.db.insert("transactions", {
          book_id: template.book_id,
          wallet_id: template.wallet_id,
          type: template.type,
          amount: template.amount,
          category: template.category,
          note: template.note,
          occurred_at: nextDue,
          created_by: template.created_by,
          created_at: Date.now(),
        });

        await notifyMembers(ctx, {
          bookId: template.book_id,
          actorId: template.created_by,
          message: `transaksi ${frequencyLabel(template.frequency)} otomatis`,
          label: template.note.trim() || template.category.trim() || "Transaksi berulang",
          detail: `${template.type === "income" ? "+" : "\u2212"}${rupiah(template.amount)}`,
        });

        nextDue = advanceDue(nextDue, template.frequency);
      }

      await ctx.db.patch(template._id, { next_due: nextDue });
    }
  },
});
