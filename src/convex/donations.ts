import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

/**
 * Hitungan dukungan: berapa orang yang bilang "udah donasi".
 *
 * Ini metrik semangat (social proof), bukan pencatatan pembayaran. Angkanya
 * cuma dipakai buat nunjukin bahwa aplikasinya memang dipakai dan didukung.
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("donations").collect();
    return rows.length;
  },
});

/**
 * Simpan satu dukungan dari user yang sedang masuk.
 *
 * Satu user hanya dihitung sekali (dicek lewat index `by_user`), jadi tombol
 * "Udah Donasi" boleh ditekan berulang tanpa bikin angka naik-terus.
 */
export const thank = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Kamu perlu masuk dulu ya.");
    }

    const existing = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();

    if (!existing) {
      await ctx.db.insert("donations", {
        user_id: userId,
        created_at: Date.now(),
      });
    }

    const rows = await ctx.db.query("donations").collect();
    return rows.length;
  },
});
