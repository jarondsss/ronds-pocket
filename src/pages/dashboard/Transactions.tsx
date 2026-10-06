import { BackToHome } from "@/components/BackToHome";
import { ClayLoader } from "@/components/ClayLoader";
import { MonthNavigator } from "@/components/dashboard/MonthNavigator";
import {
  TransactionDialog,
  type EditableTransaction,
  type EditorSession,
} from "@/components/dashboard/TransactionDialog";
import {
  TransactionList,
  type LedgerTransaction,
} from "@/components/dashboard/TransactionList";
import { api } from "@/convex/_generated/api";
import type { AiDraft } from "@/convex/ai";
import { useBooks } from "@/lib/book-context";
import { formatRupiah, monthRange, toDateInput, toMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { SearchIcon, X } from "@/components/icons";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";

type Filter = "all" | "expense" | "income";

export default function Transactions() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<EditorSession | null>(null);
  const sessionKey = useRef(0);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);
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
      <header>
        <div className="flex items-center gap-3">
          <BackToHome />
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Semua transaksi
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Semua catatan masuk dan keluar, dari bulan ini sampai yang paling
          lama. Geser bulan untuk menjelajah.
        </p>
        <Link
          to="/dashboard/riwayat/aktivitas"
          className="text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Lihat jejak perubahan siapa yang ngapain di pocket ini →
        </Link>
      </header>

      <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />

      <div className="clay-sunken flex items-center gap-1.5 p-1.5">
        {(
          [
            { value: "all", label: "Semua" },
            { value: "expense", label: "Keluar" },
            { value: "income", label: "Masuk" },
          ] as { value: Filter; label: string }[]
        ).map((item) => (
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

      {bookId && (
        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          bookId={bookId}
          wallets={walletData?.wallets ?? []}
          categories={categories ?? []}
          session={session}
        />
      )}
    </div>
  );
}