import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  displayNameOf,
  logActivity,
  notifyMembers,
  requireMember,
  requireOwnerOrCreator,
  rupiah,
} from "./books";

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const reminders = await ctx.db
      .query("bill_reminders")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const withAuthors = await Promise.all(
      reminders.map(async (reminder) => {
        const author = await ctx.db.get(reminder.created_by);
        return {
          ...reminder,
          authorName: displayNameOf(author),
        };
      }),
    );

    return withAuthors.sort((a, b) => a.due_date - b.due_date);
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    title: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    due_date: v.number(),
    remind_days_before: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMember(ctx, args.bookId);

    const title = args.title.trim();
    if (!title) {
      throw new Error("Judul reminder tidak boleh kosong.");
    }
    if (args.amount <= 0) {
      throw new Error("Nominal harus lebih dari 0.");
    }
    if (args.remind_days_before < 0) {
      throw new Error("Pengingat tidak valid.");
    }

    const reminderId = await ctx.db.insert("bill_reminders", {
      book_id: args.bookId,
      title: title.slice(0, 100),
      amount: Math.floor(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      due_date: args.due_date,
      remind_days_before: args.remind_days_before,
      enabled: true,
      created_by: userId,
      created_at: Date.now(),
    });

    await logActivity(ctx, {
      bookId: args.bookId,
      actorId: userId,
      action: "create",
      target: "pengingat tagihan",
      label: title,
      detail: `${rupiah(args.amount)} - ${new Date(args.due_date).toLocaleDateString("id-ID")}`,
    });

    return reminderId;
  },
});

export const update = mutation({
  args: {
    id: v.id("bill_reminders"),
    title: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    due_date: v.number(),
    remind_days_before: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Pengingat tidak ditemukan.");
    }
    await requireOwnerOrCreator(ctx, existing.book_id, existing.created_by);

    const title = args.title.trim();
    if (!title) {
      throw new Error("Judul reminder tidak boleh kosong.");
    }
    if (args.amount <= 0) {
      throw new Error("Nominal harus lebih dari 0.");
    }

    await ctx.db.patch(args.id, {
      title: title.slice(0, 100),
      amount: Math.floor(args.amount),
      category: (args.category ?? "").trim().slice(0, 40),
      due_date: args.due_date,
      remind_days_before: args.remind_days_before,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("bill_reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) {
      throw new Error("Pengingat tidak ditemukan.");
    }
    await requireMember(ctx, reminder.book_id);
    await ctx.db.patch(id, { enabled: !reminder.enabled });
  },
});

export const remove = mutation({
  args: { id: v.id("bill_reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) {
      throw new Error("Pengingat tidak ditemukan.");
    }
    const { userId } = await requireOwnerOrCreator(
      ctx,
      reminder.book_id,
      reminder.created_by,
    );

    await logActivity(ctx, {
      bookId: reminder.book_id,
      actorId: userId,
      action: "delete",
      target: "pengingat tagihan",
      label: reminder.title,
      detail: "",
    });

    await ctx.db.delete(id);
  },
});

/**
 * Cron job yang jalan setiap hari, cek reminder yang sudah waktunya dikirim.
 * Kirim notifikasi kalau sudah waktunya (remind_days_before hari sebelum due_date).
 */
export const processReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const reminders = await ctx.db
      .query("bill_reminders")
      .withIndex("by_due_date", (q) => q.eq("enabled", true))
      .collect();

    let processed = 0;

    for (const reminder of reminders) {
      const daysUntilDue = Math.floor(
        (reminder.due_date - now) / oneDayMs,
      );

      // Cek apakah sudah waktunya kirim reminder
      const shouldRemind =
        daysUntilDue <= reminder.remind_days_before &&
        daysUntilDue >= 0 &&
        (!reminder.last_reminded_at ||
          now - reminder.last_reminded_at > 23 * 60 * 60 * 1000); // minimal 23 jam sejak terakhir

      if (shouldRemind) {
        await notifyMembers(ctx, {
          bookId: reminder.book_id,
          actorId: reminder.created_by,
          message:
            daysUntilDue === 0
              ? "Tagihan jatuh tempo hari ini"
              : `Tagihan jatuh tempo dalam ${daysUntilDue} hari`,
          label: reminder.title,
          detail: rupiah(reminder.amount),
        });

        await ctx.db.patch(reminder._id, {
          last_reminded_at: now,
        });

        processed++;
      }

      // Disable reminder yang sudah lewat jatuh tempo
      if (daysUntilDue < -1) {
        await ctx.db.patch(reminder._id, {
          enabled: false,
        });
      }
    }

    return { processed };
  },
});
