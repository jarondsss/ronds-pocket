import { AppPageHeader } from "@/components/dashboard/AppPageHeader";
import { ClayLoader } from "@/components/ClayLoader";
import {
  TransactionDialog,
  type EditableTransaction,
  type EditorSession,
} from "@/components/dashboard/TransactionDialog";
import type { LedgerTransaction } from "@/components/dashboard/TransactionList";
import { api } from "@/convex/_generated/api";
import type { AiDraft } from "@/convex/ai";
import type { Id } from "@/convex/_generated/dataModel";
import { useBooks } from "@/lib/book-context";
import { categoryEmoji, categoryTone, toneBackground } from "@/lib/categories";
import {
  formatRupiah,
  formatShortDate,
  monthKeyLabel,
  monthRange,
  shiftMonthKey,
  toDateInput,
  toMonthKey,
} from "@/lib/format";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  Check,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Receipt,
  SearchIcon,
  X,
} from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

type TypeFilter = "all" | "expense" | "income";

const weekdayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
];

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/** "Hari ini" / "Kemarin" / nama hari, seperti daftar transaksi sehari-hari. */
function relativeDayLabel(day: number, now: number) {
  const diff = Math.round((startOfDay(now) - day) / 86_400_000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return weekdayFormat.format(day);
}

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
        active ? "bg-primary/15 text-primary" : "hover:bg-muted",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <Check className="size-4 shrink-0" />}
    </button>
  );
}

/**
 * Filter bergaya pil: label tetap terbaca ("Jenis", "Kategori", "Dompet"), dan
 * begitu dipilih, pil menampilkan nilai yang sedang aktif. Daftar pilihannya
 * pakai Popover clay yang sama dengan form transaksi.
 */
function FilterPill({
  label,
  value,
  allLabel,
  options,
  onSelect,
}: {
  label: string;
  value: string | null;
  allLabel: string;
  options: { value: string; label: string }[];
  onSelect: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    options.find((option) => option.value === value)?.label ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}${selected ? `: ${selected}` : ""}`}
          className={cn(
            "clay-sm clay-press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          <span className="max-w-32 truncate">{selected ?? label}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0",
              selected ? "text-primary" : "text-muted-foreground",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <ul
          role="listbox"
          aria-label={label}
          className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
        >
          <li role="none">
            <OptionButton
              active={value === null}
              label={allLabel}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            />
          </li>
          {options.map((option) => (
            <li key={option.value} role="none">
              <OptionButton
                active={option.value === value}
                label={option.label}
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Unduh catatan bulan ini sebagai CSV (bisa dibuka di Excel/Sheets).
 * Dipisah titik koma karena itu yang dibaca Excel berbahasa Indonesia.
 */
function downloadCsv(rows: LedgerTransaction[], monthKey: string) {
  const header = [
    "Tanggal",
    "Jenis",
    "Kategori",
    "Catatan",
    "Dompet",
    "Nominal",
    "Dicatat oleh",
  ];
  const lines = [
    header.join(";"),
    ...rows.map((tx) =>
      [
        toDateInput(tx.occurred_at),
        tx.type === "income" ? "Masuk" : "Keluar",
        tx.category,
        tx.note,
        tx.walletName ?? "Tanpa dompet",
        tx.type === "income" ? tx.amount : -tx.amount,
        tx.createdByName,
      ]
        .map(csvCell)
        .join(";"),
    ),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ronds-pocket-${monthKey}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function Transactions() {
  const { activeBook } = useBooks();
  const bookId = activeBook?._id;
  const [monthKey, setMonthKey] = useState(() => toMonthKey(Date.now()));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<Id<"wallets"> | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [session, setSession] = useState<EditorSession | null>(null);
  const sessionKey = useRef(0);
  // Snapshot "sekarang" diambil sekali saat mount; sama seperti MonthNavigator,
  // supaya render tetap bebas dari fungsi waktu yang berubah-ubah.
  const [now] = useState(() => Date.now());

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

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of categories ?? []) names.add(item.name);
    for (const tx of transactions ?? [])
      if (tx.category) names.add(tx.category);
    return [...names]
      .sort((a, b) => a.localeCompare(b, "id"))
      .map((name) => ({ value: name, label: name }));
  }, [categories, transactions]);

  const walletOptions = useMemo(
    () =>
      (walletData?.wallets ?? []).map((wallet) => ({
        value: wallet._id as string,
        label: `${wallet.icon} ${wallet.name}`.trim(),
      })),
    [walletData],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions ?? []) {
      if (tx.type === "income") income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense };
  }, [transactions]);

  const visible = useMemo(() => {
    let rows: LedgerTransaction[] = transactions ?? [];
    if (typeFilter !== "all")
      rows = rows.filter((row) => row.type === typeFilter);
    if (categoryFilter) {
      rows = rows.filter((row) => row.category === categoryFilter);
    }
    if (walletFilter) {
      rows = rows.filter((row) => row.wallet_id === walletFilter);
    }
    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter(
        (row) =>
          row.category.toLowerCase().includes(query) ||
          row.note.toLowerCase().includes(query) ||
          (row.walletName ?? "").toLowerCase().includes(query) ||
          formatRupiah(row.amount).includes(query) ||
          row.createdByName.toLowerCase().includes(query),
      );
    }
    return rows;
  }, [transactions, typeFilter, categoryFilter, walletFilter, search]);

  const groups = useMemo(() => {
    const map = new Map<number, LedgerTransaction[]>();
    for (const tx of visible) {
      const key = startOfDay(tx.occurred_at);
      const bucket = map.get(key);
      if (bucket) bucket.push(tx);
      else map.set(key, [tx]);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([day, items]) => ({ day, items }));
  }, [visible]);

  if (!activeBook || !bookId) return null;

  const showAuthor = (activeBook.memberCount ?? 1) > 1;
  const hasFilter =
    typeFilter !== "all" || categoryFilter !== null || walletFilter !== null;

  const startSession = (
    mode: EditorSession["mode"],
    transaction: EditableTransaction | null,
    draft: AiDraft | null,
  ) => {
    sessionKey.current += 1;
    setSession({
      key: sessionKey.current,
      mode,
      today: toDateInput(now),
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

  const resetFilters = () => {
    setTypeFilter("all");
    setCategoryFilter(null);
    setWalletFilter(null);
    setSearch("");
  };

  const emptyTitle = search
    ? "Tidak ditemukan"
    : hasFilter
      ? "Belum ada yang cocok"
      : "Bulan ini masih kosong";
  const emptyDescription = search
    ? `Tidak ada catatan yang cocok dengan "${search}".`
    : hasFilter
      ? "Coba longgarkan filternya atau pilih bulan lain ya."
      : "Catat pengeluaran atau pemasukan pertamamu, nanti sisanya kami hitung.";

  return (
    <div className="flex flex-col gap-4">
      <AppPageHeader
        title="Riwayat"
        subtitle="Semua catatan uangmu."
        action={
          <button
            type="button"
            onClick={() => downloadCsv(visible, monthKey)}
            disabled={visible.length === 0}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-primary disabled:opacity-40"
            aria-label="Unduh riwayat CSV"
          >
            <Download className="size-4" />
          </button>
        }
      />

      <label
        className="-mb-3 text-xs text-muted-foreground"
        htmlFor="transaction-search"
      >
        Cari transaksi
      </label>

      <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-secondary px-4">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <input
          id="transaction-search"
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari catatan atau kategori"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-full bg-card text-xs font-semibold text-primary">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
            className="grid size-9 place-items-center"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span>{monthKeyLabel(monthKey)}</span>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
            className="grid size-9 place-items-center"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
        <FilterPill
          label="Jenis"
          value={typeFilter === "all" ? null : typeFilter}
          allLabel="Semua jenis"
          options={TYPE_OPTIONS.filter((option) => option.value !== "all").map(
            (option) => ({ value: option.value, label: option.label }),
          )}
          onSelect={(value) => setTypeFilter((value ?? "all") as TypeFilter)}
        />
        <FilterPill
          label="Kategori"
          value={categoryFilter}
          allLabel="Semua kategori"
          options={categoryOptions}
          onSelect={setCategoryFilter}
        />
        <FilterPill
          label="Dompet"
          value={walletFilter}
          allLabel="Semua dompet"
          options={walletOptions}
          onSelect={(value) =>
            setWalletFilter((value ?? null) as Id<"wallets"> | null)
          }
        />
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="clay-sm clay-press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            Reset
          </button>
        )}
      </div>

      <section className="hidden rounded-[1.5rem] bg-card p-4 sm:flex sm:flex-col sm:gap-3">
        <div className="flex items-center gap-3">
          <span className="clay-sunken grid size-10 shrink-0 place-items-center rounded-2xl text-primary">
            <ChartPie className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              {monthKeyLabel(monthKey)}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              {visible.length} catatan
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
              className="clay-sm clay-press grid size-9 place-items-center rounded-full"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
              className="clay-sm clay-press grid size-9 place-items-center rounded-full"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs font-bold">
          <span className="text-muted-foreground">
            Pengeluaran:{" "}
            <span className="text-expense">
              -{formatRupiah(totals.expense)}
            </span>
          </span>
          <span aria-hidden className="h-3.5 w-px bg-border" />
          <span className="text-muted-foreground">
            Pemasukan:{" "}
            <span className="text-income">{formatRupiah(totals.income)}</span>
          </span>
        </div>
      </section>

      {transactions === undefined ? (
        <div className="grid min-h-[24vh] place-items-center">
          <ClayLoader label="Memuat catatan..." />
        </div>
      ) : groups.length === 0 ? (
        <section className="clay flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="clay-sunken grid size-16 place-items-center rounded-3xl">
            <Receipt className="size-7 text-muted-foreground" />
          </span>
          <p className="font-display text-lg font-extrabold">{emptyTitle}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {emptyDescription}
          </p>
          {!search && !hasFilter && (
            <button
              type="button"
              onClick={openNew}
              className="clay-primary clay-press mt-2 rounded-full px-5 py-2.5 text-sm font-bold"
            >
              Catat sekarang
            </button>
          )}
        </section>
      ) : (
        groups.map((group, groupIndex) => (
          <motion.section
            key={group.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(groupIndex * 0.04, 0.2),
              ease: EASE,
            }}
            className="space-y-3"
          >
            <header className="flex items-baseline justify-between gap-2">
              {/* Tanggal mendampingi "Hari ini"/"Kemarin"/nama hari supaya
                  pengguna tidak perlu menebak tanggalnya saat menggulir. */}
              <h3 className="font-display text-sm font-extrabold">
                {relativeDayLabel(group.day, now)}
                <span className="ml-1.5 font-sans text-xs font-semibold text-muted-foreground">
                  · {formatShortDate(group.day)}
                </span>
              </h3>
              <span className="text-xs font-semibold text-primary">
                {group.items.length} catatan
              </span>
            </header>

            <ul className="overflow-hidden rounded-[1.5rem] bg-card px-5 shadow-[0_14px_30px_-24px_var(--clay-dark)]">
              {group.items.map((tx) => (
                <li
                  key={tx._id}
                  className="border-t border-border/60 first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(tx)}
                    className="flex min-h-17 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-2xl text-lg"
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
                        {tx.note || tx.category || "Tanpa catatan"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tx.walletName
                          ? `${tx.walletIcon ?? "👛"} ${tx.walletName}`
                          : "Tanpa dompet"}
                        {showAuthor ? ` · ${tx.createdByName}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className={cn(
                          "block font-display text-sm font-extrabold sm:text-base",
                          tx.type === "income" ? "text-income" : "text-expense",
                        )}
                      >
                        {tx.type === "income" ? "+" : "−"}
                        {formatRupiah(tx.amount)}
                      </span>
                      <span className="block max-w-28 truncate text-[11px] text-muted-foreground">
                        {tx.category || "Tanpa kategori"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.section>
        ))
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
