import { ClayLoader } from "@/components/ClayLoader";
import { AiComposer } from "@/components/dashboard/AiComposer";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import {
  BillReminderDialog,
  type BillReminderSession,
} from "@/components/dashboard/BillReminderDialog";
import { BookSwitcher } from "@/components/dashboard/BookSwitcher";
import {
  RecurringDialog,
  type RecurringEditorSession,
} from "@/components/dashboard/RecurringDialog";
import {
  RecurringList,
  type RecurringRow,
} from "@/components/dashboard/RecurringList";
import { SummaryHero } from "@/components/dashboard/SummaryHero";
import { BudgetSnapshotCard } from "@/components/dashboard/BudgetSnapshotCard";
import { UpcomingBillRemindersCard } from "@/components/dashboard/UpcomingBillRemindersCard";
import { NotificationInsightCard } from "@/components/dashboard/NotificationInsightCard";
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
import type { Id } from "@/convex/_generated/dataModel";
import type { AiDraft } from "@/convex/ai";
import { useBooks } from "@/lib/book-context";
import { monthRange, toDateInput, toMonthKey } from "@/lib/format";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Repeat,
  SearchIcon,
  Sparkles,
  Wallet,
  X,
} from "@/components/icons";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NavLink } from "react-router";

type Filter = "all" | "expense" | "income";

function TotalBalance({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "clay-sm flex min-w-0 items-center gap-2 px-4 text-left",
        className,
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-income/15 text-income">
        <Wallet className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Saldo
        </span>
        <span className="block truncate font-display text-base font-extrabold leading-tight text-foreground">
          {formatRupiah(total)}
        </span>
      </span>
    </div>
  );
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
];

const HOME_GRID: {
  to: string;
  label: string;
  title: string;
  desc: string;
  emoji: string;
}[] = [
  { to: "/dashboard/anggaran", label: "Anggaran", title: "Anggaran", desc: "Atur batas belanja per kategori", emoji: "🧮" },
  { to: "/dashboard/goals", label: "Goals", title: "Goals", desc: "Kejar target tabunganmu", emoji: "🎯" },
  { to: "/dashboard/tabungan", label: "Tabungan", title: "Tabungan", desc: "Deposito, reksa dana, emas", emoji: "🐷" },
  { to: "/dashboard/net-worth", label: "Net Worth", title: "Net Worth", desc: "Harta dikurangi utang", emoji: "🏦" },
  { to: "/dashboard/rekap", label: "Rekap", title: "Rekap", desc: "Tren pemasukan & pengeluaran", emoji: "📊" },
  { to: "/dashboard/partner", label: "Sharing", title: "Sharing", desc: "Catat bareng atau split bill", emoji: "👥" },
];

export default function Ledger() {
  const { activeBook } = useBooks();
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [search, setSearch] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sessionKey = useRef(0);

  // Recurring transactions state
  const [recDialogOpen, setRecDialogOpen] = useState(false);
  const [recSession, setRecSession] = useState<RecurringEditorSession | null>(null);
  const recSessionKey = useRef(0);
  const [recExpanded, setRecExpanded] = useState(false);
  const toggleRecurring = useMutation(api.recurring.toggle);

  const [brDialogOpen, setBrDialogOpen] = useState(false);
  const [brSession, setBrSession] = useState<BillReminderSession | null>(null);
  const brSessionKey = useRef(0);
  const openBillReminder = (reminder: NonNullable<BillReminderSession["reminder"]> | null) => {
    brSessionKey.current += 1;
    setBrSession({
      key: brSessionKey.current,
      mode: reminder ? "edit" : "new",
      today: toDateInput(Date.now()),
      reminder,
    });
    setBrDialogOpen(true);
  };
  const openNewBillReminder = () => openBillReminder(null);

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
  const recurring = useQuery(
    api.recurring.list,
    bookId ? { bookId } : "skip",
  );

  const visible = useMemo(() => {
    let rows: LedgerTransaction[] = transactions ?? [];
    if (filter !== "all") {
      rows = rows.filter((row) => row.type === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.category.toLowerCase().includes(q) ||
          row.note.toLowerCase().includes(q) ||
          (row.walletName ?? "").toLowerCase().includes(q) ||
          formatRupiah(row.amount).includes(q) ||
          row.createdByName.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [transactions, filter, search]);

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

  const openNewRecurring = () => {
    recSessionKey.current += 1;
    setRecSession({
      key: recSessionKey.current,
      mode: "new",
      today: toDateInput(Date.now()),
      recurring: null,
    });
    setRecDialogOpen(true);
  };

  const openEditRecurring = (item: RecurringRow) => {
    recSessionKey.current += 1;
    setRecSession({
      key: recSessionKey.current,
      mode: "edit",
      today: toDateInput(Date.now()),
      recurring: {
        _id: item._id,
        type: item.type,
        amount: item.amount,
        category: item.category,
        note: item.note,
        frequency: item.frequency,
        next_due: item.next_due,
        enabled: item.enabled,
        wallet_id: item.wallet_id,
      },
    });
    setRecDialogOpen(true);
  };

  const handleToggleRecurring = (id: Id<"recurring_transactions">, enabled: boolean) => {
    toggleRecurring({ id, enabled }).catch(() => {
      toast.error("Gagal mengubah status.");
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          {/* Kantong utama dibuat tetap sempit; saldo mengambil sisa lebar,
              supaya angka saldo lebih lega daripada nama kantong. */}
          <div className="w-40 shrink-0 sm:w-48">
            <BookSwitcher />
          </div>
          {walletData && (
            <TotalBalance total={walletData.total} className="flex-1" />
          )}
        </div>
      </header>

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      {summary === undefined ? (
        <div className="grid min-h-[24vh] place-items-center">
          <ClayLoader label="Memuat catatan..." />
        </div>
      ) : (
        <SummaryHero summary={summary} />
      )}

      {/* Daftar transaksi bulan ini */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-extrabold sm:text-lg">
            Transaksi
          </h2>
          <button
            type="button"
            onClick={openNew}
            className="text-xs font-bold text-primary sm:hidden"
          >
            + Catat
          </button>
        </div>
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

        <div className="clay-sm flex items-center gap-2 px-3 py-2">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan, kategori, dompet..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {transactions === undefined ? (
          <div className="grid min-h-[24vh] place-items-center">
            <ClayLoader label="Memuat catatan..." />
          </div>
        ) : (
          <TransactionList
            transactions={visible}
            onEdit={openEdit}
            showAuthor={(activeBook?.memberCount ?? 1) > 1}
            emptyTitle={
              search
                ? "Tidak ditemukan"
                : filter === "all"
                  ? "Bulan ini masih kosong"
                  : "Belum ada isinya"
            }
            emptyDescription={
              search
                ? `Tidak ada catatan yang cocok dengan "${search}".`
                : filter === "all"
                  ? "Catat pengeluaran atau pemasukan pertamamu, nanti sisanya kami hitung."
                  : "Coba ganti filternya atau pilih bulan lain ya."
            }
            onEmptyAction={!search && filter === "all" ? openNew : undefined}
          />
        )}
      </section>

      {/* Transaksi berulang */}
      {recurring && (
        <section className="clay overflow-hidden">
          <button
            type="button"
            onClick={() => setRecExpanded(!recExpanded)}
            className="flex w-full items-center gap-2 p-4 text-left"
          >
            <Repeat className="size-4 text-primary" />
            <span className="flex-1 text-sm font-bold">
              Transaksi berulang
              {recurring.length > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
                  ({recurring.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                recExpanded && "rotate-180",
              )}
            />
          </button>
          {recExpanded && (
            <div className="border-t border-border px-4 pb-4">
              <RecurringList
                items={recurring as RecurringRow[]}
                onEdit={openEditRecurring}
                onToggle={handleToggleRecurring}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={openNewRecurring}
              >
                <Plus className="size-4" />
                Tambah berulang
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Pintu ke semua fitur kantong. Tanpa judul: tiap kartu sudah punya
          nama dan keterangan sendiri, jadi teksnya tidak diulang di atas. */}
      <section
        aria-label="Pintasan fitur kantong"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
          {HOME_GRID.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="clay clay-press flex flex-col gap-2 p-3 text-left"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-lg">
                {item.emoji}
              </span>
              <span className="text-sm font-extrabold">{item.title}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                {item.desc}
              </span>
            </NavLink>
        ))}
      </section>

      {bookId && <BudgetSnapshotCard bookId={bookId} range={range} />}
      {bookId && (
        <UpcomingBillRemindersCard
          bookId={bookId}
          onAdd={openNewBillReminder}
          onEdit={(reminder) => {
            void openBillReminder(reminder);
          }}
        />
      )}
      {bookId && <NotificationInsightCard bookId={bookId} />}

      {/* Panel chat AI melayang, di atas tombol chat. */}
      <AnimatePresence>
        {chatOpen && (
          // Panel chat = lapisan melayang (bukan konten halaman), jadi
          // spring biar terasa nempel, bukan geser konten (R-19).
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-[9.5rem] right-4 z-40 w-[min(92vw,24rem)]"
          >
            <AiComposer
              bookId={bookId}
              onDraft={openDraft}
              onClose={() => setChatOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB chat 'lahir' dengan spring tertunda 0.2s: elemen melayang,
          biar mata fokus ke tombol utama dulu (R-19). */}
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 22 }}
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Catat dari chat"
        aria-expanded={chatOpen}
        className="clay fixed bottom-24 right-5 z-40 grid size-12 place-items-center rounded-full text-primary lg:hidden"
      >
        {chatOpen ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </motion.button>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bookId={bookId}
        wallets={walletData?.wallets ?? []}
        categories={categories ?? []}
        session={session}
      />

      <RecurringDialog
        open={recDialogOpen}
        onOpenChange={setRecDialogOpen}
        bookId={bookId}
        wallets={walletData?.wallets ?? []}
        categories={categories ?? []}
        session={recSession}
      />

      <BillReminderDialog
        open={brDialogOpen}
        onOpenChange={setBrDialogOpen}
        bookId={bookId}
        wallets={walletData?.wallets ?? []}
        categories={categories ?? []}
        session={brSession}
      />
    </div>
  );
}