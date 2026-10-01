import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { ActivityAction } from "./schema";

type Ctx = QueryCtx | MutationCtx;

const DEFAULT_BOOK_NAME = "Kantong Utamaku";
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // satu minggu
const REDEEM_WINDOW_MS = 15 * 60 * 1000;
const REDEEM_MAX_ATTEMPTS = 8;
const NOTIFICATION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // satu bulan

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

/**
 * Pemilip boleh mengubah/menghapus apa saja di kantornya. Selain itu, seorang
 * anggota hanya boleh mengelola baris yang dia buat sendiri.
 */
export async function requireOwnerOrCreator(
  ctx: Ctx,
  bookId: Id<"books">,
  createdBy: Id<"users"> | undefined,
) {
  const { userId, role } = await requireMember(ctx, bookId);
  if (role === "owner") return { userId, role };
  if (createdBy !== undefined && createdBy === userId) return { userId, role };
  throw new Error("Ini punya orang lain, jadi cuma pembuatnya yang boleh diubah.");
}

/** Angka acak yang diacak dari sumber kriptografis bila tersedia. */
function randomInt(max: number) {
  const source = globalThis.crypto;
  if (source && typeof source.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    source.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function makeInviteCode() {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

export function rupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

/**
 * Catat satu baris riwayat perubahan. Disimpan di server (bukan dari klien)
 * supaya jejaknya tidak bisa dilewati, dan nama pelakunya ikut disimpan sebagai
 * salinan supaya tetap terbaca walau akunnya dihapus.
 */
export async function logActivity(
  ctx: MutationCtx,
  entry: {
    bookId: Id<"books">;
    actorId: Id<"users">;
    action: ActivityAction;
    target: string;
    label: string;
    detail?: string;
  },
) {
  const actor = await ctx.db.get(entry.actorId);
  await ctx.db.insert("activity", {
    book_id: entry.bookId,
    actor_id: entry.actorId,
    actor_name:
      actor?.name ??
      actor?.email?.split("@")[0] ??
      "Pengguna",
    action: entry.action,
    target: entry.target,
    label: entry.label.slice(0, 80),
    detail: entry.detail?.slice(0, 120),
    created_at: Date.now(),
  });
}

/**
 * Kabari anggota lain (bukan pelakunya) bahwa ada catatan baru di pocket ini.
 * Notifikasi lama dibersihkan biar tabelnya nggak numpuk.
 */
export async function notifyMembers(
  ctx: MutationCtx,
  entry: {
    bookId: Id<"books">;
    actorId: Id<"users">;
    message: string;
    label: string;
    detail?: string;
  },
) {
  const members = await ctx.db
    .query("book_members")
    .withIndex("by_book", (q) => q.eq("book_id", entry.bookId))
    .collect();
  const targets = members.filter((member) => member.user_id !== entry.actorId);
  if (targets.length === 0) return;

  const actor = await ctx.db.get(entry.actorId);
  const actorName =
    actor?.name ?? actor?.email?.split("@")[0] ?? "Temanmu";
  const now = Date.now();

  for (const member of targets) {
    const old = await ctx.db
      .query("notifications")
      .withIndex("by_book_user", (q) =>
        q.eq("book_id", entry.bookId).eq("user_id", member.user_id),
      )
      .collect();
    for (const row of old) {
      if (now - row.created_at > NOTIFICATION_TTL_MS) {
        await ctx.db.delete(row._id);
      }
    }
    await ctx.db.insert("notifications", {
      book_id: entry.bookId,
      user_id: member.user_id,
      actor_id: entry.actorId,
      actor_name: actorName,
      message: entry.message.slice(0, 80),
      label: entry.label.slice(0, 80),
      detail: entry.detail?.slice(0, 120),
      created_at: now,
    });
  }
}

/** Notifikasi milik user yang sedang login, terbaru dulu. */
export const notifications = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const { userId } = await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_book_user_created", (q) =>
        q.eq("book_id", bookId).eq("user_id", userId),
      )
      .order("desc")
      .take(30);
    return rows;
  },
});

/** Tandai semua notifikasi pocket ini sebagai sudah dibaca. */
export const markNotificationsRead = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const { userId } = await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_book_user", (q) =>
        q.eq("book_id", bookId).eq("user_id", userId),
      )
      .collect();
    const now = Date.now();
    for (const row of rows) {
      if (row.read_at === undefined) {
        await ctx.db.patch(row._id, { read_at: now });
      }
    }
    return null;
  },
});

/** 50 perubahan terakhir di sebuah kantong. */
export const activity = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    await requireMember(ctx, bookId);
    const rows = await ctx.db
      .query("activity")
      .withIndex("by_book_created", (q) => q.eq("book_id", bookId))
      .order("desc")
      .take(50);
    return rows;
  },
});

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
    const { role } = await requireMember(ctx, bookId);
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
          // Email hanya perlu dilihat pemilik; teman cukup tahu namanya.
          email: role === "owner" ? email : null,
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

    const now = Date.now();
    return rows
      .filter((row) => row.accepted_by === undefined && row.revoked_at === undefined)
      .sort((a, b) => b.created_at - a.created_at)
      .map((row) => ({
        _id: row._id,
        code: row.code,
        created_at: row.created_at,
        expires_at: row.expires_at ?? null,
        expired: row.expires_at !== undefined && row.expires_at < now,
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
    const userId = await requireOwner(ctx, bookId);
    const clean = name.trim();
    if (!clean) {
      throw new Error("Nama kantongnya jangan dikosongkan ya.");
    }
    await logActivity(ctx, {
      bookId,
      actorId: userId,
      action: "update",
      target: "kantong",
      label: clean.slice(0, 60),
    });
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
      await logActivity(ctx, {
        bookId,
        actorId: userId,
        action: "share",
        target: "undangan",
        label: `Kode ${code}`,
        detail: "Berlaku 7 hari",
      });
      await ctx.db.insert("invites", {
        book_id: bookId,
        code,
        invited_by: userId,
        created_at: Date.now(),
        expires_at: Date.now() + INVITE_TTL_MS,
      });
      return code;
    }
    throw new Error("Kode undangannya gagal dibuat. Coba sekali lagi ya.");
  },
});

/** Owner-only: mencabut kode undangan yang belum dipakai. */
export const revokeInvite = mutation({
  args: { bookId: v.id("books"), inviteId: v.id("invites") },
  handler: async (ctx, { bookId, inviteId }) => {
    const userId = await requireOwner(ctx, bookId);
    const invite = await ctx.db.get(inviteId);
    if (invite === null || invite.book_id !== bookId) {
      throw new Error("Kode undangannya tidak ketemu.");
    }
    if (invite.accepted_by !== undefined) {
      throw new Error("Kode ini sudah dipakai, jadi tidak bisa dicabut.");
    }
    await logActivity(ctx, {
      bookId,
      actorId: userId,
      action: "share",
      target: "undangan",
      label: `Kode ${invite.code}`,
      detail: "Kode dicabut",
    });
    await ctx.db.patch(inviteId, { revoked_at: Date.now() });
    return null;
  },
});

/** Buang percobaan lama milik seorang user, kembalikan sisa yang masih dihitung. */
async function countRecentAttempts(ctx: MutationCtx, userId: Id<"users">, now: number) {
  const rows = await ctx.db
    .query("invite_attempts")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  let active = 0;
  for (const row of rows) {
    if (now - row.at > REDEEM_WINDOW_MS) {
      await ctx.db.delete(row._id);
    } else {
      active += 1;
    }
  }
  return active;
}

/**
 * Any signed-in user can join a book by redeeming an owner's invite code.
 * Percobaan dibatasi supaya kode tidak bisa ditebak, dan kodenya sendiri punya
 * masa berlaku serta bisa dicabut oleh pemilik.
 */
export const redeemInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await requireUserId(ctx);
    const clean = code.trim().toUpperCase();
    if (!clean) {
      throw new Error("Isi kode undangannya dulu ya.");
    }

    const now = Date.now();
    if ((await countRecentAttempts(ctx, userId, now)) >= REDEEM_MAX_ATTEMPTS) {
      throw new Error("Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi ya.");
    }

    const fail = async (message: string): Promise<never> => {
      await ctx.db.insert("invite_attempts", { user_id: userId, at: now });
      throw new Error(message);
    };

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", clean))
      .unique();
    if (invite === null) {
      return await fail("Kode undangannya tidak ketemu. Cek lagi hurufnya ya.");
    }
    if (invite.revoked_at !== undefined) {
      return await fail("Kode undangannya sudah dicabut oleh pemiliknya.");
    }
    if (invite.expires_at !== undefined && invite.expires_at < now) {
      return await fail("Kode undangannya sudah kedaluwarsa. Minta kode baru ya.");
    }
    if (invite.accepted_by !== undefined) {
      return await fail("Kode ini sudah dipakai orang lain.");
    }

    const existing = await getMembership(ctx, invite.book_id, userId);
    if (existing !== null) {
      return await fail("Kamu sudah ada di kantong ini.");
    }

    await ctx.db.insert("book_members", {
      book_id: invite.book_id,
      user_id: userId,
      role: "partner",
    });
    await logActivity(ctx, {
      bookId: invite.book_id,
      actorId: userId,
      action: "share",
      target: "anggota",
      label: "Bergabung pakai kode undangan",
    });
    await ctx.db.patch(invite._id, { accepted_by: userId });
    return invite.book_id;
  },
});

/** Teman boleh keluar sendiri; pemilik tidak bisa meninggalkan kantornya. */
export const leaveBook = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const { userId, role } = await requireMember(ctx, bookId);
    if (role === "owner") {
      throw new Error("Pemilik nggak bisa keluar sendiri. Minta pemilik lainnya ya.");
    }
    const membership = await getMembership(ctx, bookId, userId);
    if (membership === null) return null;
    await logActivity(ctx, {
      bookId,
      actorId: userId,
      action: "share",
      target: "anggota",
      label: "Keluar dari kantong ini",
    });
    await ctx.db.delete(membership._id);
    return null;
  },
});

/** Owner-only: remove a partner from the book. */
export const removeMember = mutation({
  args: { bookId: v.id("books"), userId: v.id("users") },
  handler: async (ctx, { bookId, userId: targetUserId }) => {
    const actorId = await requireOwner(ctx, bookId);
    const membership = await getMembership(ctx, bookId, targetUserId);
    if (membership === null) {
      throw new Error("Orang ini tidak ada di kantong ini.");
    }
    if (membership.role === "owner") {
      throw new Error("Pemilik kantong tidak bisa dihapus.");
    }
    const target = await ctx.db.get(targetUserId);
    await logActivity(ctx, {
      bookId,
      actorId,
      action: "share",
      target: "anggota",
      label: target?.name ?? target?.email?.split("@")[0] ?? "Teman",
      detail: "Dikeluarkan dari kantong ini",
    });
    await ctx.db.delete(membership._id);
  },
});
