import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

const DEFAULT_BOOK_NAME = "Kantong Utamaku";
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Every request must resolve to a signed-in user. */
export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Kamu perlu masuk dulu ya.");
  }
  return userId;
}

async function getMembership(
  ctx: Ctx,
  bookId: Id<"books">,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("book_members")
    .withIndex("by_book_user", (q) =>
      q.eq("book_id", bookId).eq("user_id", userId),
    )
    .unique();
}

/**
 * Reads *and* writes on a book go through here: a user who is not a member of
 * the book can never read or mutate its transactions.
 */
export async function requireMember(ctx: Ctx, bookId: Id<"books">) {
  const userId = await requireUserId(ctx);
  const membership = await getMembership(ctx, bookId, userId);
  if (membership === null) {
    throw new Error("Kantong ini bukan punyamu.");
  }
  return { userId, role: membership.role };
}

async function requireOwner(ctx: Ctx, bookId: Id<"books">) {
  const { userId, role } = await requireMember(ctx, bookId);
  if (role !== "owner") {
    throw new Error("Cuma pemilik kantong yang bisa melakukan ini.");
  }
  return userId;
}

function makeInviteCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

async function createBookFor(
  ctx: MutationCtx,
  userId: Id<"users">,
  name: string,
) {
  const now = Date.now();
  const bookId = await ctx.db.insert("books", {
    name,
    created_by: userId,
    created_at: now,
  });
  await ctx.db.insert("book_members", {
    book_id: bookId,
    user_id: userId,
    role: "owner",
  });
  return bookId;
}

/** Books the signed-in user belongs to, with their role in each one. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const memberships = await ctx.db
      .query("book_members")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    const books = await Promise.all(
      memberships.map(async (membership) => {
        const book = await ctx.db.get(membership.book_id);
        if (book === null) return null;
        const members = await ctx.db
          .query("book_members")
          .withIndex("by_book", (q) => q.eq("book_id", membership.book_id))
          .collect();
        return {
          _id: book._id,
          name: book.name,
          role: membership.role,
          created_at: book.created_at,
          memberCount: members.length,
          partnerCount: members.filter((m) => m.role === "partner").length,
        };
      }),
    );

    return books
      .filter((book): book is NonNullable<typeof book> => book !== null)
      .sort((a, b) => a.created_at - b.created_at);
  },
});

export const members = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("book_members")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    const people = await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.user_id);
        const email = user?.email ?? null;
        return {
          userId: row.user_id,
          role: row.role,
          name: user?.name ?? (email ? email.split("@")[0] : "Pengguna"),
          email,
        };
      }),
    );

    return people.sort((a, b) =>
      a.role === b.role ? 0 : a.role === "owner" ? -1 : 1,
    );
  },
});

/** Owner-only: pending invite codes for a book. */
export const invites = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireOwner(ctx, bookId);
    const rows = await ctx.db
      .query("invites")
      .withIndex("by_book", (q) => q.eq("book_id", bookId))
      .collect();

    return rows
      .filter((row) => row.accepted_by === undefined)
      .sort((a, b) => b.created_at - a.created_at)
      .map((row) => ({
        _id: row._id,
        code: row.code,
        created_at: row.created_at,
      }));
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUserId(ctx);
    const clean = name.trim();
    if (!clean) {
      throw new Error("Nama kantongnya jangan dikosongkan ya.");
    }
    return await createBookFor(ctx, userId, clean.slice(0, 60));
  },
});

/**
 * Called once when a signed-in user lands with no pockets at all, so signing up
 * always leaves the user with a default pocket they own.
 */
export const ensureDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("book_members")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();
    if (existing !== null) return existing.book_id;
    return await createBookFor(ctx, userId, DEFAULT_BOOK_NAME);
  },
});

export const rename = mutation({
  args: { bookId: v.id("books"), name: v.string() },
  handler: async (ctx, { bookId, name }) => {
    await requireOwner(ctx, bookId);
    const clean = name.trim();
    if (!clean) {
      throw new Error("Nama kantongnya jangan dikosongkan ya.");
    }
    await ctx.db.patch(bookId, { name: clean.slice(0, 60) });
  },
});

/** Owner-only: mint a fresh invite code. */
export const createInvite = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const userId = await requireOwner(ctx, bookId);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = makeInviteCode();
      const clash = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (clash !== null) continue;
      await ctx.db.insert("invites", {
        book_id: bookId,
        code,
        invited_by: userId,
        created_at: Date.now(),
      });
      return code;
    }
    throw new Error("Kode undangannya gagal dibuat. Coba sekali lagi ya.");
  },
});

/** Any signed-in user can join a book by redeeming an owner's invite code. */
export const redeemInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await requireUserId(ctx);
    const clean = code.trim().toUpperCase();
    if (!clean) {
      throw new Error("Isi kode undangannya dulu ya.");
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", clean))
      .unique();
    if (invite === null) {
      throw new Error("Kode undangannya tidak ketemu. Cek lagi hurufnya ya.");
    }
    if (invite.accepted_by !== undefined) {
      throw new Error("Kode ini sudah dipakai orang lain.");
    }

    const existing = await getMembership(ctx, invite.book_id, userId);
    if (existing !== null) {
      throw new Error("Kamu sudah ada di kantong ini.");
    }

    await ctx.db.insert("book_members", {
      book_id: invite.book_id,
      user_id: userId,
      role: "partner",
    });
    await ctx.db.patch(invite._id, { accepted_by: userId });
    return invite.book_id;
  },
});

/** Owner-only: remove a partner from the book. */
export const removeMember = mutation({
  args: { bookId: v.id("books"), userId: v.id("users") },
  handler: async (ctx, { bookId, userId }) => {
    await requireOwner(ctx, bookId);
    const membership = await getMembership(ctx, bookId, userId);
    if (membership === null) {
      throw new Error("Orang ini tidak ada di kantong ini.");
    }
    if (membership.role === "owner") {
      throw new Error("Pemilik kantong tidak bisa dihapus.");
    }
    await ctx.db.delete(membership._id);
  },
});
