import { EASE } from "@/lib/motion";
import { formatRupiah, formatShortDate } from "@/lib/format";
import { CalendarClock } from "@/components/icons";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";

/** Sisa hari dari sekarang sampai tanggal jatuh tempo. */
function daysUntil(ts: number, todayStart: number): number {
  return Math.round((ts - todayStart) / 86_400_000);
}

/**
 * Tagihan berikutnya di dashboard, seperti "Pengeluaran rutin otomatis" di
 * kynan.id: dari daftar transaksi berulang, tampilkan tiga yang paling dekat
 * jatuh temponya supaya pengguna bisa menyiapkan dananya.
 */
export function UpcomingBills({ bookId }: { bookId: Id<"books"> }) {
  const recurring = useQuery(api.recurring.list, { bookId });

  if (recurring === undefined) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const start = todayStart.getTime();

  const upcoming = recurring
    .filter((row) => row.enabled && row.type === "expense")
    .filter((row) => row.next_due >= start)
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="clay p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/12 text-primary">
          <CalendarClock className="size-4" />
        </span>
        <h2 className="font-display text-sm font-extrabold">
          Tagihan berikutnya
        </h2>
      </div>

      <ul className="mt-3 flex flex-col gap-2.5">
        {upcoming.map((bill) => {
          const days = daysUntil(bill.next_due, start);
          const urgent = days <= 3;
          return (
            <li key={bill._id} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary/80 text-base">
                {bill.walletIcon ?? "📅"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">
                  {bill.note || bill.category}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {formatShortDate(bill.next_due)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs font-extrabold text-expense">
                  −{formatRupiah(bill.amount)}
                </span>
                <span
                  className={
                    urgent
                      ? "block text-[10px] font-bold text-destructive"
                      : "block text-[10px] font-bold text-muted-foreground"
                  }
                >
                  {days === 0
                    ? "Hari ini"
                    : days === 1
                      ? "Besok"
                      : `${days} hari lagi`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
