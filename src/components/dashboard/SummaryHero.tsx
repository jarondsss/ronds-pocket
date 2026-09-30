import { formatRupiah } from "@/lib/format";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

interface Summary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export function SummaryHero({ summary }: { summary: Summary }) {
  const positive = summary.balance >= 0;

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="clay-primary relative overflow-hidden p-5 sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-white/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-8 size-36 rounded-full bg-black/10 blur-2xl"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
              Saldo periode ini
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold leading-none sm:text-4xl">
              {formatRupiah(summary.balance)}
            </p>
            <p className="mt-3 text-xs font-medium text-white/80">
              {summary.count} transaksi tercatat
              {positive ? " · aman 👍" : " · pengeluaran lebih besar"}
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
            <Wallet className="size-6" />
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          className="clay-sm p-4"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-income/15 text-income">
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
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="clay-sm p-4"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-expense/15 text-expense">
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
