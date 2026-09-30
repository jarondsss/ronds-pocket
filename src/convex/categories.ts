import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./books";

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("categories")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();
    return rows
      .sort((a, b) => a.created_at - b.created_at)
      .map((row) => ({
        _id: row._id,
        name: row.name,
        type: row.type,
        color: row.color,
      }));
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.bookId);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama kategorinya jangan dikosongkan ya.");
    }
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_book_type", (q) =>
        q.eq("book_id", args.bookId).eq("type", args.type),
      )
      .collect();
    if (existing.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Kategori dengan nama itu sudah ada.");
    }
    return await ctx.db.insert("categories", {
      book_id: args.bookId,
      name: name.slice(0, 40),
      type: args.type,
      color: args.color,
      created_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (category === null) {
      throw new Error("Kategorinya tidak ketemu.");
    }
    await requireMember(ctx, category.book_id);
    const name = args.name.trim();
    if (!name) {
      throw new Error("Nama kategorinya jangan dikosongkan ya.");
    }
    await ctx.db.patch(args.id, {
      name: name.slice(0, 40),
      color: args.color,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const category = await ctx.db.get(id);
    if (category === null) {
      throw new Error("Kategorinya tidak ketemu.");
    }
    await requireMember(ctx, category.book_id);

    // Anggaran yang menempel di kategori ini ikut dibersihkan.
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_book_category", (q) =>
        q.eq("book_id", category.book_id).eq("category", category.name),
      )
      .collect();
    for (const budget of budgets) {
      await ctx.db.delete(budget._id);
    }

    await ctx.db.delete(id);
  },
});
