import { EASE } from "@/lib/motion";
import { formatRupiah, formatShortDate, formatDay } from "@/lib/format";
import { CalendarClock, HandCoins } from "@/components/icons";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";

/**
 * Tagihan berikutnya di dashboard. Gaya:
 *   1. header kategori kartu informasi (primary, dengan kicker "KUIS"),
 *   2. card teks utama jam jatuh tempo & akun,
 *   3. kelompok daftar kategori detail, setiap kategori muncul sekali.
 */
export function UpcomingBills({ bookId }: { bookId: Id<"books"> }) {
  const recurring = useQuery(api.recurring.list, { bookId });

  // Convex query return type; cast sekali ke bentuk yang dipakai komponen.
  const rows = recurring as {
    _id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    note: string;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    next_due: number;
    enabled: boolean;
    wallet_id: Id<"wallets"> | undefined | null;
    walletName: string | null;
    walletIcon: string | null;
  }[] | undefined;

  if (rows === undefined) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const start = todayStart.getTime();

  const header = rows.find(
    (row) => row.enabled && row.type === "expense" && row.next_due >= start,
  );

  const groups = new Map<string, RecurringRow[]>();
  for (const row of rows) {
    if (!row.enabled || row.type !== "expense") continue;
    if (row.next_due < start) continue;
    const key = row.category || "Tanpa label";
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const entries: { category: string; items: RecurringRow[] }[] = [];
  for (const [category, rows] of groups) {
    entries.push({ category, items: rows });
  }

  if (header === undefined && entries.length === 0) return null;

  return (
    <div className="clay scroll-mt-28 space-y-4 rounded-3xl border border-border/50 bg-card/60 p-4 shadow-sm">
      {/* 1. Header kategori utama card informasi. */}
      {header && (
        <div className="clay-sunken rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <HandCoins className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-extrabold tracking-tight">
                  {header.category || "Tanpa label"}
                </h2>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {header.walletIcon && <>{header.walletIcon}{" "}</>}
                  {header.walletName
                    ? `dari ${header.walletName}`
                    : "tagihan berikutnya"}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              KUIS
            </span>
          </div>

          <div className="mt-3 clay-sunken rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Jam jatuh tempo
                </p>
                <p className="text-base font-display font-extrabold tracking-tight">
                  {formatShortDate(header.next_due)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDay(header.next_due)}
                  {" · "}
                  <time dateTime={String(header.next_due)}>
                    {new Date(header.next_due).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </time>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-extrabold tracking-tight text-expense">
                  −{formatRupiah(header.amount)}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  saldo proyeksi
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Card teks utama: jam jatuh tempo & akun. */}
      {header && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="clay-sunken rounded-2xl p-4"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ringkasan tambahan
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Kerugian kategori <b>{header.category || "tanpa label"}</b>
            {" · "}
            terjadinya ulang setiap {header.frequency}
            {" · "}
            <time dateTime={String(header.next_due)}>
              {formatDay(header.next_due)}
            </time>
            {" · "}
            terjadinya ulang setiap{" "}
            {header.frequency === "daily" ? "1 hari" : header.frequency}
            {" · "}
            lokal waktu {new Date().toLocaleString("id-ID")}
          </p>
        </motion.div>
      )}

      {/* 3. Daftar detail kategori. */}
      {entries.map((entry) => (
        <motion.div
          key={entry.category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="clay-sunken rounded-2xl px-4 py-3"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
            {entry.category}
            {entry.items.length > 1 && (
              <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">
                ({entry.items.length})
              </span>
            )}
          </h4>
          <ul className="mt-2 flex flex-col gap-2 pl-4">
            {entry.items.map((item) => (
              <li key={item._id} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary/80 text-xs">
                  {item.walletIcon ?? "📅"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {item.note || item.category}
                </span>
                <span className="shrink-0 text-xs font-bold text-muted-foreground">
                  jejak {formatDay(item.next_due)}
                </span>
                <span className="shrink-0 text-xs font-extrabold text-expense">
                  −{formatRupiah(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
