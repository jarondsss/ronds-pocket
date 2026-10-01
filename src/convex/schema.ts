import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Ronds Pocket domain validators
export const bookRoleValidator = v.union(
  v.literal("owner"),
  v.literal("partner"),
);
export type BookRole = Infer<typeof bookRoleValidator>;

export const transactionTypeValidator = v.union(
  v.literal("income"),
  v.literal("expense"),
);
export type TransactionType = Infer<typeof transactionTypeValidator>;

export const activityActionValidator = v.union(
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("share"),
);
export type ActivityAction = Infer<typeof activityActionValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ---- Ronds Pocket: pockets, members, transactions, invites ----
    books: defineTable({
      name: v.string(),
      created_by: v.id("users"),
      created_at: v.number(),
    }).index("by_created_by", ["created_by"]),

    book_members: defineTable({
      book_id: v.id("books"),
      user_id: v.id("users"),
      role: bookRoleValidator,
    })
      .index("by_book", ["book_id"])
      .index("by_user", ["user_id"])
      .index("by_book_user", ["book_id", "user_id"]),

    transactions: defineTable({
      book_id: v.id("books"),
      wallet_id: v.optional(v.id("wallets")),
      type: transactionTypeValidator,
      amount: v.number(), // integer rupiah
      category: v.string(),
      note: v.string(),
      occurred_at: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    })
      .index("by_book", ["book_id"])
      .index("by_book_occurred", ["book_id", "occurred_at"]),

    invites: defineTable({
      book_id: v.id("books"),
      code: v.string(),
      invited_by: v.id("users"),
      accepted_by: v.optional(v.id("users")),
      created_at: v.number(),
      // opsional supaya kode lama yang sudah terlanjur tersimpan tetap terbaca
      expires_at: v.optional(v.number()),
      revoked_at: v.optional(v.number()),
    })
      .index("by_code", ["code"])
      .index("by_book", ["book_id"]),

    // Percobaan menebak kode undangan, buat membatasi brute force per akun.
    invite_attempts: defineTable({
      user_id: v.id("users"),
      at: v.number(),
    }).index("by_user", ["user_id"]),

    // Jejak perubahan supaya zusammen tahu siapa ngapain, termasuk yang dihapus.
    activity: defineTable({
      book_id: v.id("books"),
      actor_id: v.id("users"),
      actor_name: v.string(), // disimpan sebagai salinan, biar tetap terbaca
      action: activityActionValidator,
      target: v.string(), // "transaksi", "dompet", "kategori", ...
      label: v.string(), // nama objeknya, misal "Kopi susu"
      detail: v.optional(v.string()),
      created_at: v.number(),
    })
      .index("by_book", ["book_id"])
      .index("by_book_created", ["book_id", "created_at"]),

    // Notifikasi buat anggota lain saat temannya nambah catatan baru.
    notifications: defineTable({
      book_id: v.id("books"),
      user_id: v.id("users"), // penerima
      actor_id: v.id("users"),
      actor_name: v.string(),
      message: v.string(),
      label: v.string(),
      detail: v.optional(v.string()),
      read_at: v.optional(v.number()),
      created_at: v.number(),
    })
      .index("by_book_user", ["book_id", "user_id"])
      .index("by_book_user_created", ["book_id", "user_id", "created_at"]),

    // Dompet: tempat uang fisik/digital disimpan
    wallets: defineTable({
      book_id: v.id("books"),
      name: v.string(),
      type: v.string(), // cash | bank | ewallet | credit | investment | saving | other
      icon: v.string(), // emoji
      color: v.string(), // tone key
      opening_balance: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    }).index("by_book", ["book_id"]),

    // Perpindahan uang antar dompet, plus tambah/kurangi saldo manual.
    // from kosong = uang masuk dari luar; to kosong = uang keluar.
    wallet_transfers: defineTable({
      book_id: v.id("books"),
      from_wallet_id: v.optional(v.id("wallets")),
      to_wallet_id: v.optional(v.id("wallets")),
      amount: v.number(),
      note: v.string(),
      occurred_at: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    }).index("by_book", ["book_id"]),

    categories: defineTable({
      book_id: v.id("books"),
      name: v.string(),
      type: transactionTypeValidator,
      color: v.string(), // tone key
      // diisi mulai sekarang; kategori lama dianggap milik pemilik
      created_by: v.optional(v.id("users")),
      created_at: v.number(),
    })
      .index("by_book", ["book_id"])
      .index("by_book_type", ["book_id", "type"]),

    // Anggaran bulanan per kategori
    budgets: defineTable({
      book_id: v.id("books"),
      category: v.string(),
      amount: v.number(),
      updated_at: v.number(),
    })
      .index("by_book", ["book_id"])
      .index("by_book_category", ["book_id", "category"]),

    goals: defineTable({
      book_id: v.id("books"),
      name: v.string(),
      target_amount: v.number(),
      saved_amount: v.number(),
      deadline: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    }).index("by_book", ["book_id"]),

    savings: defineTable({
      book_id: v.id("books"),
      name: v.string(),
      kind: v.string(), // umum | deposito | reksa_dana | emas | lainnya
      principal: v.number(), // saldo awal
      interest_rate: v.number(), // persen per tahun
      started_at: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    }).index("by_book", ["book_id"]),

    savings_entries: defineTable({
      book_id: v.id("books"),
      savings_id: v.id("savings"),
      type: v.union(v.literal("deposit"), v.literal("withdraw")),
      amount: v.number(),
      occurred_at: v.number(),
      created_by: v.id("users"),
      created_at: v.number(),
    })
      .index("by_savings", ["savings_id"])
      .index("by_book", ["book_id"]),
  },
  {
    schemaValidation: true,
  },
);

export default schema;
