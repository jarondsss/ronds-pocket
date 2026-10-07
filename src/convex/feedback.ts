import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

const MIN_MESSAGE = 4;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 120;

/**
 * Masukan dari pengguna (tombol "Masukan" di top bar).
 *
 * Sengaja disimpan apa adanya di database dulu: belum ada layanan surel yang
 * tersambung, jadi masukan tidak hilang walau pengguna tidak mengirim email.
 */
export const submit = mutation({
  args: {
    message: v.string(),
    mood: v.string(),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, { message, mood, contact }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Kamu perlu masuk dulu ya.");
    }

    const isi = message.trim();
    if (isi.length < MIN_MESSAGE) {
      throw new Error("Tulis masukanmu sedikit lebih panjang ya.");
    }
    if (isi.length > MAX_MESSAGE) {
      throw new Error(`Masukan maksimal ${MAX_MESSAGE} huruf ya.`);
    }

    await ctx.db.insert("feedback", {
      user_id: userId,
      message: isi,
      mood: mood.slice(0, 20),
      contact: contact?.trim().slice(0, MAX_CONTACT) || undefined,
      created_at: Date.now(),
    });
  },
});
