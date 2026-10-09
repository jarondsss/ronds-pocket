import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { action, internalMutation } from "./_generated/server";
import { isProduction } from "./env";

const MIN_MESSAGE = 4;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 120;

const moodValidator = v.union(
  v.literal("senang"),
  v.literal("lumayan"),
  v.literal("masalah"),
);

const MOOD_LABEL: Record<string, string> = {
  senang: "Suka",
  lumayan: "Lumayan",
  masalah: "Ada masalah",
};

/**
 * Kotak masuk pemilik aplikasi. Bisa ditimpa lewat env `FEEDBACK_INBOX`,
 * tapi defaultnya sudah terisi supaya jalan tanpa pengaturan tambahan.
 * (Alamat email bukan rahasia, jadi aman ditulis di kode.)
 */
function inboxAddress(): string {
  const env = (
    process.env.FEEDBACK_INBOX ??
    process.env.FEEDBACK_TO_EMAIL ??
    ""
  ).trim();
  return env || "jajangworj@gmail.com";
}

/** Pengirim default Resend bisa dipakai tanpa memverifikasi domain sendiri. */
function senderAddress(): string {
  const custom = (process.env.FEEDBACK_FROM ?? "").trim();
  return custom || "Ronds Pocket <onboarding@resend.dev>";
}

const waktuWib = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function insertFeedback(
  ctx: MutationCtx,
  args: {
    message: string;
    mood: string;
    contact?: string;
    page?: string;
  },
) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Kamu perlu masuk dulu ya.");
  }

  const isi = args.message.trim();
  if (isi.length < MIN_MESSAGE) {
    throw new Error("Tulis masukanmu sedikit lebih panjang ya.");
  }
  if (isi.length > MAX_MESSAGE) {
    throw new Error(`Masukan maksimal ${MAX_MESSAGE} huruf ya.`);
  }

  const contact = args.contact?.trim().slice(0, MAX_CONTACT) || undefined;
  const created_at = Date.now();

  await ctx.db.insert("feedback", {
    user_id: userId,
    message: isi,
    mood: args.mood,
    contact,
    page: args.page?.slice(0, 120) || undefined,
    created_at,
  });

  const user = await ctx.db.get(userId);
  return {
    name: user?.display_name ?? user?.name ?? "Tanpa nama",
    email: user?.email ?? null,
    message: isi,
    mood: args.mood,
    contact: contact ?? null,
    page: args.page ?? null,
    created_at,
  };
}

/**
 * Simpan masukan ke database. Dipakai action di bawah lewat `runMutation`.
 */
export const store = internalMutation({
  args: {
    message: v.string(),
    mood: moodValidator,
    contact: v.optional(v.string()),
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => insertFeedback(ctx, args),
});

/**
 * Masukan pengguna: disimpan ke database, lalu disalin ke email pemilik
 * aplikasi supaya tidak perlu rajin membuka dashboard.
 *
 * Kalau email belum diatur (env belum diisi) atau layanannya sedang gagal,
 * masukan tetap tersimpan; hasilnya dikembalikan sebagai `emailed: false`.
 */
export const submitAndEmail = action({
  args: {
    message: v.string(),
    mood: moodValidator,
    contact: v.optional(v.string()),
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.runMutation(internal.feedback.store, args);

    const apiKey = process.env.RESEND_API_KEY;
    const to = inboxAddress();
    if (!apiKey || !to) {
      if (isProduction()) {
        console.error("[Security] RESEND_API_KEY not configured for feedback emails");
      } else {
        console.warn("[Config] Feedback saved but email not sent. Configure RESEND_API_KEY to enable email notifications.");
      }
      return { emailed: false };
    }

    const moodLabel = MOOD_LABEL[saved.mood] ?? saved.mood;
    const waktu = `${waktuWib.format(saved.created_at)} WIB`;
    const pengirim = saved.email ? `${saved.name} (${saved.email})` : saved.name;
    const baris = [
      `Nada: ${moodLabel}`,
      `Dari: ${pengirim}`,
      saved.contact ? `Kontak: ${saved.contact}` : null,
      saved.page ? `Halaman: ${saved.page}` : null,
      `Waktu: ${waktu}`,
      "",
      "Pesan:",
      saved.message,
    ].filter((line) => line !== null);

    const html = `
      <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#2a2340">
        <h2 style="margin:0 0 12px">Masukan baru: ${escapeHtml(moodLabel)}</h2>
        <p style="margin:0 0 16px;color:#5b5478">
          Dari <strong>${escapeHtml(pengirim)}</strong><br />
          ${escapeHtml(waktu)}${saved.page ? `<br />Halaman ${escapeHtml(saved.page)}` : ""}${saved.contact ? `<br />Kontak ${escapeHtml(saved.contact)}` : ""}
        </p>
        <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #a78bfa;background:#f6f2ff;border-radius:8px;white-space:pre-wrap">${escapeHtml(saved.message)}</blockquote>
        <p style="margin:16px 0 0;color:#8b86a3;font-size:13px">Dikirim otomatis dari formulir Masukan di dalam aplikasi Ronds Pocket. Balas email ini untuk membalas pengirimnya.</p>
      </div>
    `;

    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderAddress(),
          to: [to],
          subject: `Masukan Ronds Pocket (${moodLabel})`,
          reply_to: saved.email ?? undefined,
          text: `${baris.join("\n")}\n\nDikirim otomatis dari formulir Masukan di dalam aplikasi Ronds Pocket.`,
          html,
        }),
      });
    } catch (error) {
      console.error("Email masukan gagal: layanannya tidak bisa dihubungi.", error);
      return { emailed: false };
    }

    if (!response.ok) {
      console.error(
        `Email masukan gagal (${response.status}):`,
        (await response.text()).slice(0, 400),
      );
      return { emailed: false };
    }

    return { emailed: true };
  },
});
