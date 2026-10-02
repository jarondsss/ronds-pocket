import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
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
