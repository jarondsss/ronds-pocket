import type { Id } from "@/convex/_generated/dataModel";
import { categoryEmoji, categoryTone, toneBackground } from "@/lib/categories";
import { formatDay, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { useMemo } from "react";

export interface LedgerTransaction {
  _id: Id<"transactions">;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  occurred_at: number;
  created_by: Id<"users">;
  created_at: number;
  createdByName: string;
  wallet_id: Id<"wallets"> | null;
  walletName: string | null;
  walletIcon: string | null;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function TransactionList({
  transactions,
  onEdit,
  emptyTitle = "Belum ada catatan",
  emptyDescription = "Mulai catat pengeluaran atau pemasukan pertamamu.",
  onEmptyAction,
}: {
  transactions: LedgerTransaction[];
  onEdit: (transaction: LedgerTransaction) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<number, LedgerTransaction[]>();
    for (const tx of transactions) {
      const key = startOfDay(tx.occurred_at);
      const bucket = map.get(key);
      if (bucket) bucket.push(tx);
      else map.set(key, [tx]);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([day, items]) => ({ day, items }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="clay flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="clay-sunken grid size-16 place-items-center rounded-3xl">
          <Receipt className="size-7 text-muted-foreground" />
        </span>
        <p className="font-display text-lg font-extrabold">{emptyTitle}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {emptyDescription}
        </p>
        {onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="clay-primary clay-press mt-2 px-5 py-2.5 text-sm font-bold"
          >
            Catat sekarang
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, groupIndex) => {
        const dayTotal = group.items.reduce(
          (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
          0,
        );
        return (
          <motion.section
            key={group.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(groupIndex * 0.04, 0.2),
              ease: "easeOut",
            }}
            className="clay overflow-hidden"
          >
            <header className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
              <h3 className="font-display text-sm font-extrabold">
                {formatDay(group.day)}
              </h3>
              <span
                className={cn(
                  "text-xs font-bold",
                  dayTotal >= 0 ? "text-income" : "text-expense",
                )}
              >
                {dayTotal >= 0 ? "+" : "−"}
                {formatRupiah(Math.abs(dayTotal))}
              </span>
            </header>

            <ul className="px-2 pb-2 sm:px-3">
              {group.items.map((tx) => (
                <li key={tx._id}>
                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg"
                      style={{
                        backgroundColor: toneBackground(
                          categoryTone(tx.category || tx.type),
                        ),
                      }}
                    >
                      {categoryEmoji(tx.category)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {tx.category || "Tanpa kategori"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tx.walletName
                          ? `${tx.walletIcon ?? "👛"} ${tx.walletName}`
                          : "Tanpa dompet"}{" "}
                        · {tx.note || "Tanpa catatan"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-display text-sm font-extrabold sm:text-base",
                        tx.type === "income" ? "text-income" : "text-expense",
                      )}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatRupiah(tx.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}
