import { formatRupiah, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Pause, Play, Repeat } from "@/components/icons";
import type { Id } from "@/convex/_generated/dataModel";

export interface RecurringRow {
  _id: Id<"recurring_transactions">;
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
}

const FREQ_LABEL: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

export function RecurringList({
  items,
  onEdit,
  onToggle,
}: {
  items: RecurringRow[];
  onEdit: (item: RecurringRow) => void;
  onToggle: (id: Id<"recurring_transactions">, enabled: boolean) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <Repeat className="mx-auto mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">
          Belum ada transaksi berulang
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          Tambahkan untuk mencatat pengeluaran rutin secara otomatis.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const label = item.note.trim() || item.category.trim() || "Tanpa label";
        const isExpense = item.type === "expense";
        return (
          <li key={item._id} className="flex items-center gap-3 py-3">
            <button
              type="button"
              aria-label={item.enabled ? "Jeda" : "Aktifkan"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item._id, !item.enabled);
              }}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                item.enabled
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {item.enabled ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="flex min-w-0 flex-1 flex-col text-left"
            >
              <span
                className={cn(
                  "truncate text-sm font-semibold",
                  !item.enabled && "text-muted-foreground line-through",
                )}
              >
                {label}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{FREQ_LABEL[item.frequency]}</span>
                <span>·</span>
                <span>Berikutnya {formatShortDate(item.next_due)}</span>
                {item.walletName && (
                  <>
                    <span>·</span>
                    <span>{item.walletIcon} {item.walletName}</span>
                  </>
                )}
              </span>
            </button>

            <span
              className={cn(
                "shrink-0 text-sm font-bold tabular-nums",
                isExpense
                  ? "text-expense"
                  : "text-income",
                !item.enabled && "opacity-50",
              )}
            >
              {isExpense ? "-" : "+"}{formatRupiah(item.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
