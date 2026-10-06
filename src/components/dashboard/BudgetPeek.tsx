import { EASE } from "@/lib/motion";
import { toneValue } from "@/lib/palette";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ChevronRight, HandCoins } from "@/components/icons";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "react-router";

/**
 * Ringkasan anggaran bulan berjalan di dashboard, seperti budget household di
 * halaman utama kynan.id: total vs terpakai, bar progres, dan tiga kategori
 * dengan sisa jatah paling tipis.
 */
export function BudgetPeek({
  bookId,
  range,
}: {
  bookId: Id<"books">;
  /** Rentang bulan yang sedang dibuka di Ledger. */
  range: { from: number; to: number };
}) {
  const data = useQuery(api.budgets.list, { bookId, ...range });

  if (data === undefined) return null;

  const remaining = data.totalBudget - data.totalSpent;
  const percent =
    data.totalBudget > 0
      ? Math.min(Math.round((data.totalSpent / data.totalBudget) * 100), 100)
      : 0;
  const top = [...data.budgets]
    .filter((row) => row.amount > 0)
    .sort(
      (a, b) => b.spent / b.amount - a.spent / a.amount,
    )
    .slice(0, 3);

  if (data.budgets.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="clay p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-primary/12 text-primary">
            <HandCoins className="size-4" />
          </span>
          <h2 className="font-display text-sm font-extrabold">Anggaran</h2>
        </div>
        <Link
          to="/dashboard/anggaran"
          className="flex items-center gap-0.5 text-xs font-bold text-primary transition-opacity hover:opacity-80"
        >
          Detail
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-xl font-extrabold">
          {formatRupiah(data.totalSpent)}
          <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
            / {formatRupiah(data.totalBudget)}
          </span>
        </p>
        <p
          className={cn(
            "text-xs font-bold",
            remaining < 0 ? "text-destructive" : "text-income",
          )}
        >
          {remaining < 0 ? "Lewat " : "Sisa "}
          {formatRupiah(Math.abs(remaining))}
        </p>
      </div>

      <div className="clay-sunken mt-2.5 h-2.5 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percent, 3)}%` }}
          transition={{ duration: 0.5, ease: EASE }}
          className={cn(
            "h-full rounded-full",
            remaining < 0 ? "bg-destructive" : "bg-primary",
          )}
        />
      </div>

      {top.length > 0 && (
        <ul className="mt-3.5 flex flex-col gap-2">
          {top.map((row) => {
            const rowPercent = Math.min(
              Math.round((row.spent / row.amount) * 100),
              100,
            );
            const over = row.spent > row.amount;
            return (
              <li key={row._id} className="flex items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: toneValue(row.color) }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">
                  {row.category}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-extrabold",
                    over ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {rowPercent}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
