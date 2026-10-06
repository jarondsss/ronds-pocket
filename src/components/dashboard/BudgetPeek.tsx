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
 * halaman utama kynan.id: total, bar progres, tiga kategori, dan kartu "selisih"
 * yang meyakinkan (selisih negatif = kelewat, positif = aman).
 */
export function BudgetPeek({
  bookId,
  range,
}: {
  bookId: Id<"books">;
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

  const statusLabel =
    remaining < 0 ? "Lewat batas" : remaining <= data.totalBudget * 0.1 ? "Hampir" : "Aman";

  return (
    <div className="clay scroll-mt-28 space-y-4 rounded-3xl border border-border/50 bg-card/60 p-4 shadow-sm">
      {/* Header budget + link. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
            <HandCoins className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold tracking-tight">
              Anggaran
            </h2>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bulan {formatShortLabel(range.from)}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/anggaran"
          className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-primary/80 transition-colors hover:text-primary"
        >
          Kelola anggaran
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Ringkasan utama: total yang terpakai vs jatah. */}
      <div className="clay-sunken rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total terpakai bulan ini
            </p>
            <p className="text-lg font-display font-extrabold tracking-tight">
              {formatRupiah(data.totalSpent)}
              <span className="text-xs font-semibold text-muted-foreground">
                {" "}
                / {formatRupiah(data.totalBudget)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-xl font-display font-extrabold tracking-tight",
                remaining < 0 ? "text-destructive" : "text-income",
              )}
            >
              {remaining < 0
                ? "-" + formatRupiah(Math.abs(remaining))
                : formatRupiah(remaining)}
            </p>
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                remaining < 0
                  ? "text-destructive"
                  : remaining <= data.totalBudget * 0.1
                    ? "text-amber-600"
                    : "text-income",
              )}
            >
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="clay-sunken mt-3 h-2.5 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percent, 3)}%` }}
            transition={{ duration: 0.5, ease: EASE }}
            className={cn(
              "h-full rounded-full",
              remaining < 0
                ? "bg-destructive"
                : remaining <= data.totalBudget * 0.1
                  ? "bg-amber-500"
                  : "bg-primary",
            )}
          />
        </div>
        <p
          className={cn(
            "mt-1.5 text-[11px] font-bold",
            remaining < 0
              ? "text-destructive"
              : remaining <= data.totalBudget * 0.1
                ? "text-amber-600"
                : "text-income",
          )}
        >
          {percent}% dari jatah terpakai
        </p>
      </div>

      {/* 3 kategori dengan sisa jatah paling tipis. */}
      {top.length > 0 && (
        <div className="clay-sunken rounded-2xl p-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tiga kategori paling macet
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {top.map((row) => {
              const rowPercent = Math.min(
                Math.round((row.spent / row.amount) * 100),
                100,
              );
              const over = row.spent > row.amount;
              return (
                <li
                  key={row._id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-secondary/40"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: toneValue(row.color) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">
                    {row.category}
                  </span>
                  {over && (
                    <span className="shrink-0 text-xs font-bold text-destructive">
                      OVER
                    </span>
                  )}
                  <span className="shrink-0 text-xs font-extrabold">
                    {formatRupiah(row.spent)} / {formatRupiah(row.amount)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-bold",
                      over
                        ? "text-destructive"
                        : row.spent / row.amount >= 0.8
                          ? "text-amber-600"
                          : "text-muted-foreground",
                    )}
                  >
                    {rowPercent}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Singkatan standar bulan: Jan, Feb, Mar, ... */
function formatShortLabel(ts: number): string {
  const date = new Date(ts);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return monthNames[date.getMonth()];
}
