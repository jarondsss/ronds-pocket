import { AiComposer } from "@/components/dashboard/AiComposer";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import { SummaryHero } from "@/components/dashboard/SummaryHero";
import {
  TransactionDialog,
  type EditableTransaction,
  type EditorSession,
} from "@/components/dashboard/TransactionDialog";
import {
  TransactionList,
  type LedgerTransaction,
} from "@/components/dashboard/TransactionList";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { AiDraft } from "@/convex/ai";
import { useBooks } from "@/lib/book-context";
import { monthRange, toDateInput, toMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Filter = "all" | "expense" | "income";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
];

export default function Ledger() {
  const { activeBook } = useBooks();
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<EditorSession | null>(null);
  const sessionKey = useRef(0);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);
  const bookId = activeBook?._id;

  const summary = useQuery(
    api.transactions.summary,
    bookId ? { bookId, ...range } : "skip",
  );
  const transactions = useQuery(
    api.transactions.list,
    bookId ? { bookId, ...range } : "skip",
  );
  const walletData = useQuery(api.wallets.list, bookId ? { bookId } : "skip");
  const categories = useQuery(
    api.categories.list,
    bookId ? { bookId } : "skip",
  );

  const visible = useMemo(() => {
    const rows: LedgerTransaction[] = transactions ?? [];
    if (filter === "all") return rows;
    return rows.filter((row) => row.type === filter);
  }, [transactions, filter]);

  if (!activeBook || !bookId) return null;

  // Sesi dibuat di event handler: `Date.now()` boleh dipanggil di sini, dan
  // `key` yang naik bikin form di dialog ter-remount dengan nilai awal segar.
  const startSession = (
    mode: EditorSession["mode"],
    transaction: EditableTransaction | null,
    draft: AiDraft | null,
  ) => {
    sessionKey.current += 1;
    setSession({
      key: sessionKey.current,
      mode,
      today: toDateInput(Date.now()),
      transaction,
      draft,
    });
    setDialogOpen(true);
  };

  const openNew = () => startSession("new", null, null);

  const openDraft = (nextDraft: AiDraft) =>
    startSession("new", null, nextDraft);

  const openEdit = (transaction: LedgerTransaction) =>
    startSession(
      "edit",
      {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        note: transaction.note,
        occurred_at: transaction.occurred_at,
        wallet_id: transaction.wallet_id,
      },
      null,
    );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {activeBook.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeBook.role === "owner"
              ? "Kantong ini punyamu 👋"
              : "Kamu ikut mencatat di kantong ini"}
          </p>
        </div>
        <Button
          type="button"
          className="hidden sm:inline-flex"
          onClick={openNew}
        >
          <Plus className="size-4" />
          Catat uang
        </Button>
      </header>

      <AiComposer bookId={bookId} onDraft={openDraft} />

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      {summary === undefined ? (
        <div className="grid min-h-[24vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SummaryHero summary={summary} />
      )}

      <div className="clay-sunken flex items-center gap-1.5 p-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "relative flex-1 rounded-2xl px-3 py-2 text-xs font-bold transition-colors sm:text-sm",
              filter === item.value
                ? "clay-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {transactions === undefined ? (
        <div className="grid min-h-[24vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionList
          transactions={visible}
          onEdit={openEdit}
          emptyTitle={
            filter === "all" ? "Bulan ini masih kosong" : "Belum ada isinya"
          }
          emptyDescription={
            filter === "all"
              ? "Catat pengeluaran atau pemasukan pertamamu, nanti sisanya kami hitung."
              : "Coba ganti filternya atau pilih bulan lain ya."
          }
          onEmptyAction={filter === "all" ? openNew : undefined}
        />
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 22 }}
        onClick={openNew}
        aria-label="Catat uang"
        className="clay-primary fixed bottom-24 right-5 z-40 grid size-14 place-items-center lg:hidden"
      >
        <Plus className="size-7" />
      </motion.button>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookId={bookId}
        wallets={walletData?.wallets ?? []}
        categories={categories ?? []}
        session={session}
      />
    </div>
  );
}
