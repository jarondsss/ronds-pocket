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

// Buku Kas domain validators
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

    // ---- Buku Kas ----
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
    })
      .index("by_code", ["code"])
      .index("by_book", ["book_id"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
