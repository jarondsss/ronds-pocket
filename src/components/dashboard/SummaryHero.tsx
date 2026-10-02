import { formatRupiah } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "@/components/icons";

interface Summary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export function SummaryHero({ summary }: { summary: Summary }) {
  const positive = summary.balance >= 0;
  const total = summary.income + summary.expense;
  const usedPercent = total > 0 ? Math.round((summary.expense / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="clay relative overflow-hidden p-5 sm:p-6"
      >
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sisa uang bulan ini
            </p>
            <p className="mt-2 bg-gradient-to-br from-[#8b7cff] to-[#5b4fe8] bg-clip-text font-display text-3xl font-extrabold leading-none text-transparent sm:text-4xl">
              {formatRupiah(summary.balance)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="clay-chip">
                {usedPercent}% terpakai
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {summary.count} catatan
                {positive ? " · masih aman" : " · pengeluaran lebih besar"}
              </span>
            </div>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
          className="clay-sm p-4"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-income/12 text-income">
            <ArrowDownLeft className="size-5" />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Pemasukan
          </p>
          <p className="mt-1 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {formatRupiah(summary.income)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: EASE }}
          className="clay-sm p-4"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-expense/12 text-expense">
            <ArrowUpRight className="size-5" />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Pengeluaran
          </p>
          <p className="mt-1 font-display text-lg font-extrabold text-foreground sm:text-xl">
            {formatRupiah(summary.expense)}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
