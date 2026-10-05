import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { displayNameOf, notifyMembers, requireMember } from "./books";

const MAX_COMMENT_LENGTH = 500;

export const list = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const transaction = await ctx.db.get(transactionId);
    if (transaction === null) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    await requireMember(ctx, transaction.book_id);

    const comments = await ctx.db
      .query("transaction_comments")
      .withIndex("by_transaction", (q) => q.eq("transaction_id", transactionId))
      .collect();

    const withAuthors = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.user_id);
        return {
          ...comment,
          authorName: displayNameOf(user),
          authorAvatar: user?.avatar ?? null,
        };
      }),
    );

    return withAuthors.sort((a, b) => a.created_at - b.created_at);
  },
});

export const add = mutation({
  args: {
    transactionId: v.id("transactions"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (transaction === null) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    const { userId } = await requireMember(ctx, transaction.book_id);

    const text = args.text.trim();
    if (!text) {
      throw new Error("Komentarnya kosong.");
    }
    if (text.length > MAX_COMMENT_LENGTH) {
      throw new Error("Komentarnya terlalu panjang.");
    }

    const commentId = await ctx.db.insert("transaction_comments", {
      transaction_id: args.transactionId,
      book_id: transaction.book_id,
      user_id: userId,
      text: text.slice(0, MAX_COMMENT_LENGTH),
      created_at: Date.now(),
    });

    // Notifikasi partner tentang komentar baru
    await notifyMembers(ctx, {
      bookId: transaction.book_id,
      actorId: userId,
      message: "berkomentar di transaksi",
      label: transaction.note || transaction.category || "Transaksi",
      detail: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
    });

    return commentId;
  },
});

export const remove = mutation({
  args: { id: v.id("transaction_comments") },
  handler: async (ctx, { id }) => {
    const comment = await ctx.db.get(id);
    if (comment === null) {
      throw new Error("Komentar tidak ditemukan.");
    }
    const { userId } = await requireMember(ctx, comment.book_id);
    
    // Hanya pembuat komentar yang bisa menghapus
    if (comment.user_id !== userId) {
      throw new Error("Kamu hanya bisa menghapus komentarmu sendiri.");
    }

    await ctx.db.delete(id);
  },
});
