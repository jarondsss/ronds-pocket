import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";

const MAX_NAME_LENGTH = 24;

/**
 * Profil user: nama tampilan dan maskot avatar.
 *
 * Disimpan di baris user yang sama (bukan tabel terpisah) supaya nama yang
 * sudah diubah langsung ikut terpakai di notifikasi dan riwayat perubahan,
 * yang memang menyimpan salinan nama pelakunya.
 */
export const update = mutation({
  args: { displayName: v.string(), avatar: v.optional(v.string()) },
  handler: async (ctx, { displayName, avatar }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Kamu perlu masuk dulu ya.");
    }

    const name = displayName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      throw new Error("Nama minimal 2 huruf ya.");
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new Error(`Nama maksimal ${MAX_NAME_LENGTH} huruf ya.`);
    }

    const patch: { display_name: string; avatar?: string } = {
      display_name: name,
    };

    // Avatar opsional: kalau tidak dikirim, inisial nama yang dipakai.
    // Disimpan sebagai emoji maskot, jadi cukup dijaga pendek dan tanpa spasi.
    // Daftar pilihannya ada di src/lib/avatars.ts.
    if (avatar !== undefined) {
      const emblem = avatar.trim();
      if (emblem.length > 8 || /\s/.test(emblem)) {
        throw new Error("Pilih avatar dari daftar ya.");
      }
      patch.avatar = emblem.length === 0 ? undefined : emblem;
    }

    await ctx.db.patch(userId, patch);
    return { displayName: name, avatar: patch.avatar ?? null };
  },
});

/** Hapus semua baris dari sebuah tabel yang terkait dengan satu buku. */
async function deleteBookRows(
  ctx: MutationCtx,
  table:
    | "transactions"
    | "wallets"
    | "wallet_transfers"
    | "categories"
    | "budgets"
    | "goals"
    | "savings"
    | "savings_entries"
    | "activity"
    | "invites"
    | "book_members"
    | "recurring_transactions"
    | "transaction_comments"
    | "bill_reminders",
  bookId: Id<"books">,
) {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_book", (q) => q.eq("book_id", bookId))
    .collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}

/**
 * Hapus akun beserta seluruh data yang terkait:
 * - Buku yang dimiliki (dan seluruh isinya)
 * - Keanggotaan di buku orang lain
 * - Sesi auth
 * - Baris user itu sendiri
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Kamu perlu masuk dulu ya.");
    }

    // 1. Cari semua keanggotaan user
    const memberships = await ctx.db
      .query("book_members")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();

    for (const membership of memberships) {
      if (membership.role === "owner") {
        // Hapus seluruh isi buku yang dimiliki
        const bookId = membership.book_id;

        // Hapus savings_entries lebih dulu (FK ke savings)
        const savingsRows = await ctx.db
          .query("savings")
          .withIndex("by_book", (q) => q.eq("book_id", bookId))
          .collect();
        for (const saving of savingsRows) {
          const entries = await ctx.db
            .query("savings_entries")
            .withIndex("by_savings", (q) => q.eq("savings_id", saving._id))
            .collect();
          for (const entry of entries) {
            await ctx.db.delete(entry._id);
          }
        }

        // Hapus invite_attempts per user pada buku ini (tidak punya index by_book,
        // tapi jumlahnya kecil; skip untuk sekarang karena tabel invite_attempts
        // per-user bukan per-book)

        await deleteBookRows(ctx, "transactions", bookId);
        await deleteBookRows(ctx, "transaction_comments", bookId);
        await deleteBookRows(ctx, "wallet_transfers", bookId);
        await deleteBookRows(ctx, "wallets", bookId);
        await deleteBookRows(ctx, "categories", bookId);
        await deleteBookRows(ctx, "budgets", bookId);
        await deleteBookRows(ctx, "goals", bookId);
        await deleteBookRows(ctx, "savings", bookId);
        await deleteBookRows(ctx, "recurring_transactions", bookId);
        await deleteBookRows(ctx, "bill_reminders", bookId);
        await deleteBookRows(ctx, "activity", bookId);
        // Notifications: tidak punya index by_book, jadi hapus per-member
        const members = await ctx.db
          .query("book_members")
          .withIndex("by_book", (q) => q.eq("book_id", bookId))
          .collect();
        for (const member of members) {
          const notifs = await ctx.db
            .query("notifications")
            .withIndex("by_book_user", (q) =>
              q.eq("book_id", bookId).eq("user_id", member.user_id),
            )
            .collect();
          for (const notif of notifs) {
            await ctx.db.delete(notif._id);
          }
        }
        await deleteBookRows(ctx, "invites", bookId);
        await deleteBookRows(ctx, "book_members", bookId);

        await ctx.db.delete(bookId);
      } else {
        // Partner: cukup hapus keanggotaan
        await ctx.db.delete(membership._id);
      }
    }

    // 2. Hapus invite_attempts milik user ini
    const attempts = await ctx.db
      .query("invite_attempts")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // 3. Hapus sesi auth (tabel authSessions)
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      // Hapus refresh tokens terkait sesi
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // 4. Hapus auth accounts (tabel authAccounts)
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      // Hapus verification codes terkait akun
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      // Hapus rate limits terkait akun
      const rateLimits = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", (q) => q.eq("identifier", account._id))
        .collect();
      for (const rl of rateLimits) {
        await ctx.db.delete(rl._id);
      }
      await ctx.db.delete(account._id);
    }

    // 5. Hapus user
    await ctx.db.delete(userId);
  },
});
